/**
 * SyncEngine - Orchestrates synchronization between Drive and local cache
 *
 * Features:
 * - Initial sync on app start
 * - Incremental sync (background polling)
 * - Upload queue processing
 * - Download changes from Drive
 * - Conflict detection and resolution
 */

import EventEmitter from 'events';
import { DriveService, DriveChange } from '../drive/DriveService';
import { SyncQueue, UploadOperation } from './SyncQueue';

export interface SyncEngineEvents {
  'sync:started': () => void;
  'sync:complete': (changesCount: number) => void;
  'sync:error': (error: Error) => void;
  'sync:online': () => void;
  'sync:offline': () => void;
  'sync:uploading': (path: string, progress: number) => void;
  'sync:uploaded': (path: string) => void;
  'sync:downloading': (path: string) => void;
  'sync:downloaded': (path: string) => void;
  'sync:conflict': (path: string) => void;
  'sync:quota-exceeded': (message: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface SyncEngine {
  on<U extends keyof SyncEngineEvents>(event: U, listener: SyncEngineEvents[U]): this;
  emit<U extends keyof SyncEngineEvents>(event: U, ...args: Parameters<SyncEngineEvents[U]>): boolean;
}

export interface FileState {
  path: string;
  driveFileId?: string;
  content: string | Buffer;
  modifiedTime: number;
  isDirty: boolean;
  lastSyncTime?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class SyncEngine extends EventEmitter {
  private drive: DriveService;
  private uploadQueue: SyncQueue;
  private syncIntervalMs = 30_000; // 30 seconds
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline = true;
  private dirtyFiles = new Set<string>();
  private workspaceFolderId: string | null = null;
  private pageToken: string | null = null;

  // Storage callbacks (to be set by main process)
  private getFileCallback: ((path: string) => Promise<FileState | null>) | null = null;
  private saveFileCallback: ((state: FileState) => Promise<void>) | null = null;
  private deleteFileCallback: ((path: string) => Promise<void>) | null = null;
  private getAllFilesCallback: (() => Promise<FileState[]>) | null = null;

  constructor(driveService: DriveService) {
    super();
    this.drive = driveService;
    this.uploadQueue = new SyncQueue();

    // Set up upload queue processor
    this.uploadQueue.setProcessor(async (operation: UploadOperation) => {
      await this.processUpload(operation);
    });

    // Listen to queue events
    this.uploadQueue.on('upload:start', path => {
      this.emit('sync:uploading', path, 0);
    });

    this.uploadQueue.on('upload:success', path => {
      this.dirtyFiles.delete(path);
      this.emit('sync:uploaded', path);
    });

    this.uploadQueue.on('upload:failed', (path, error) => {
      this.emit('sync:error', error);
    });
  }

  /**
   * Set storage callbacks
   */
  setStorageCallbacks(callbacks: {
    getFile: (path: string) => Promise<FileState | null>;
    saveFile: (state: FileState) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    getAllFiles: () => Promise<FileState[]>;
  }): void {
    this.getFileCallback = callbacks.getFile;
    this.saveFileCallback = callbacks.saveFile;
    this.deleteFileCallback = callbacks.deleteFile;
    this.getAllFilesCallback = callbacks.getAllFiles;
  }

  /**
   * Set workspace folder ID
   */
  setWorkspaceFolderId(folderId: string): void {
    this.workspaceFolderId = folderId;
  }

  /**
   * Initial sync - run on app startup
   */
  async initialSync(): Promise<void> {
    if (!this.workspaceFolderId) {
      throw new Error('Workspace folder not set');
    }

    this.emit('sync:started');

    try {
      // Get initial page token if not set
      if (!this.pageToken) {
        this.pageToken = await this.drive.getStartPageToken();
      }

      // Download all files from workspace
      const files = await this.drive.listFiles(this.workspaceFolderId);

      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // Skip folders for now (TODO: implement recursive sync)
          continue;
        }

        this.emit('sync:downloading', file.name);

        // Download file content
        const content = file.mimeType.includes('text')
          ? await this.drive.downloadFile(file.id)
          : await this.drive.downloadFileBuffer(file.id);

        // Save to cache
        if (this.saveFileCallback) {
          await this.saveFileCallback({
            path: file.name,
            driveFileId: file.id,
            content,
            modifiedTime: new Date(file.modifiedTime).getTime(),
            isDirty: false,
            lastSyncTime: Date.now(),
          });
        }

        this.emit('sync:downloaded', file.name);
      }

      this.emit('sync:complete', files.length);
    } catch (error) {
      this.emit('sync:error', error as Error);
      throw error;
    }
  }

  /**
   * Incremental sync - check for changes
   */
  async incrementalSync(): Promise<void> {
    if (!this.isOnline || !this.pageToken) {
      return;
    }

    this.emit('sync:started');

    try {
      const changes = await this.drive.getAllChanges(this.pageToken);

      for (const change of changes.changes) {
        await this.handleRemoteChange(change);
      }

      this.pageToken = changes.newStartPageToken;
      this.emit('sync:complete', changes.changes.length);
    } catch (error) {
      this.emit('sync:error', error as Error);
    }
  }

  /**
   * Handle remote change from Drive
   */
  private async handleRemoteChange(change: DriveChange): Promise<void> {
    if (change.removed || !change.file) {
      // File deleted
      if (this.deleteFileCallback) {
        await this.deleteFileCallback(change.fileId);
      }
      return;
    }

    const file = change.file;
    const localFile = this.getFileCallback ? await this.getFileCallback(file.name) : null;

    if (!localFile) {
      // New file - download it
      await this.downloadFile(file.id, file.name, file.mimeType);
    } else {
      const remoteTime = new Date(file.modifiedTime).getTime();
      const localTime = localFile.modifiedTime;

      if (remoteTime > localTime) {
        // Remote is newer
        if (this.dirtyFiles.has(file.name)) {
          // Conflict!
          this.emit('sync:conflict', file.name);
          // TODO: Handle conflict resolution (PR-032)
        } else {
          // Safe to download
          await this.downloadFile(file.id, file.name, file.mimeType);
        }
      }
    }
  }

  /**
   * Download file from Drive
   */
  private async downloadFile(fileId: string, name: string, mimeType: string): Promise<void> {
    this.emit('sync:downloading', name);

    const content = mimeType.includes('text')
      ? await this.drive.downloadFile(fileId)
      : await this.drive.downloadFileBuffer(fileId);

    if (this.saveFileCallback) {
      await this.saveFileCallback({
        path: name,
        driveFileId: fileId,
        content,
        modifiedTime: Date.now(),
        isDirty: false,
        lastSyncTime: Date.now(),
      });
    }

    this.emit('sync:downloaded', name);
  }

  /**
   * Queue file for upload
   */
  async queueUpload(path: string, content: string | Buffer, mimeType: string): Promise<void> {
    this.dirtyFiles.add(path);

    // Get Drive file ID if exists
    const localFile = this.getFileCallback ? await this.getFileCallback(path) : null;

    this.uploadQueue.enqueue({
      path,
      content,
      mimeType,
      driveFileId: localFile?.driveFileId,
    });
  }

  /**
   * Process upload operation
   */
  private async processUpload(operation: UploadOperation): Promise<void> {
    if (!this.workspaceFolderId) {
      throw new Error('Workspace folder not set');
    }

    if (operation.driveFileId) {
      // Update existing file
      await this.drive.updateFile(operation.driveFileId, operation.content, operation.mimeType);
    } else {
      // Create new file
      const fileId = await this.drive.uploadFile(
        operation.path,
        operation.content,
        operation.mimeType,
        this.workspaceFolderId
      );

      // Update local file with Drive ID
      if (this.saveFileCallback) {
        const localFile = await this.getFileCallback!(operation.path);
        if (localFile) {
          localFile.driveFileId = fileId;
          localFile.isDirty = false;
          localFile.lastSyncTime = Date.now();
          await this.saveFileCallback(localFile);
        }
      }
    }
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(): void {
    if (this.syncTimer) {
      return; // Already running
    }

    this.syncTimer = setInterval(async () => {
      if (this.isOnline) {
        await this.incrementalSync();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Handle online event
   */
  handleOnline(): void {
    this.isOnline = true;
    this.uploadQueue.resume();
    this.emit('sync:online');

    // Resume periodic sync
    this.startPeriodicSync();

    // Trigger immediate sync
    this.incrementalSync();
  }

  /**
   * Handle offline event
   */
  handleOffline(): void {
    this.isOnline = false;
    this.uploadQueue.pause();
    this.emit('sync:offline');

    // Stop periodic sync
    this.stopPeriodicSync();
  }

  /**
   * Get sync status
   */
  getStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    queueSize: number;
    dirtyFiles: number;
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.uploadQueue.isProcessing(),
      queueSize: this.uploadQueue.size(),
      dirtyFiles: this.dirtyFiles.size,
    };
  }

  /**
   * Force sync now
   */
  async syncNow(): Promise<void> {
    await this.incrementalSync();
  }

  /**
   * Clear all pending uploads
   */
  clearQueue(): void {
    this.uploadQueue.clear();
    this.dirtyFiles.clear();
  }
}
