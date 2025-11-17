/**
 * IndexedDBService - Local cache layer for fast access
 *
 * Provides:
 * - Fast file access (no network needed)
 * - Metadata storage (Drive file IDs, timestamps)
 * - Sync state tracking
 * - Offline support
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface CachedFile {
  id: string; // Local ID (path)
  driveFileId?: string; // Google Drive file ID
  name: string;
  path: string;
  content: string | ArrayBuffer;
  mimeType: string;
  size: number;
  modifiedTime: number;
  createdTime: number;
  lastSyncTime?: number;
  isDirty: boolean;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

interface NotoDBSchema extends DBSchema {
  files: {
    key: string; // path
    value: CachedFile;
    indexes: {
      'by-drive-id': string;
      'by-modified': number;
      'by-dirty': number;
    };
  };
  metadata: {
    key: string;
    value: SyncMetadata;
  };
}

export class IndexedDBService {
  private db: IDBPDatabase<NotoDBSchema> | null = null;
  private dbName = 'noto-cache';
  private version = 1;

  /**
   * Initialize database
   */
  async init(): Promise<void> {
    this.db = await openDB<NotoDBSchema>(this.dbName, this.version, {
      upgrade(db) {
        // Files store
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'path' });
          fileStore.createIndex('by-drive-id', 'driveFileId', { unique: false });
          fileStore.createIndex('by-modified', 'modifiedTime', { unique: false });
          fileStore.createIndex('by-dirty', 'isDirty', { unique: false });
        }

        // Metadata store (for sync tokens, settings, etc.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });
  }

  /**
   * Ensure database is initialized
   */
  private ensureDB(): IDBPDatabase<NotoDBSchema> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized. Call init() first.');
    }
    return this.db;
  }

  // ===== File Operations =====

  /**
   * Save file to cache
   */
  async saveFile(file: CachedFile): Promise<void> {
    const db = this.ensureDB();
    await db.put('files', file);
  }

  /**
   * Get file from cache
   */
  async getFile(path: string): Promise<CachedFile | null> {
    const db = this.ensureDB();
    const file = await db.get('files', path);
    return file || null;
  }

  /**
   * Get file by Drive ID
   */
  async getFileByDriveId(driveFileId: string): Promise<CachedFile | null> {
    const db = this.ensureDB();
    const files = await db.getAllFromIndex('files', 'by-drive-id', driveFileId);
    return files[0] || null;
  }

  /**
   * Get all files
   */
  async getAllFiles(): Promise<CachedFile[]> {
    const db = this.ensureDB();
    return db.getAll('files');
  }

  /**
   * Get all dirty files (need upload)
   */
  async getDirtyFiles(): Promise<CachedFile[]> {
    const db = this.ensureDB();
    return db.getAllFromIndex('files', 'by-dirty', 1);
  }

  /**
   * Delete file from cache
   */
  async deleteFile(path: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('files', path);
  }

  /**
   * Mark file as dirty (needs sync)
   */
  async markDirty(path: string): Promise<void> {
    const db = this.ensureDB();
    const file = await this.getFile(path);
    if (file) {
      file.isDirty = true;
      file.modifiedTime = Date.now();
      await db.put('files', file);
    }
  }

  /**
   * Mark file as clean (synced)
   */
  async markClean(path: string): Promise<void> {
    const db = this.ensureDB();
    const file = await this.getFile(path);
    if (file) {
      file.isDirty = false;
      file.lastSyncTime = Date.now();
      await db.put('files', file);
    }
  }

  /**
   * Update file content
   */
  async updateFileContent(path: string, content: string | ArrayBuffer): Promise<void> {
    const db = this.ensureDB();
    const file = await this.getFile(path);
    if (file) {
      file.content = content;
      file.modifiedTime = Date.now();
      file.isDirty = true;
      file.size = typeof content === 'string' ? content.length : content.byteLength;
      await db.put('files', file);
    }
  }

  /**
   * Set Drive file ID for cached file
   */
  async setDriveFileId(path: string, driveFileId: string): Promise<void> {
    const db = this.ensureDB();
    const file = await this.getFile(path);
    if (file) {
      file.driveFileId = driveFileId;
      await db.put('files', file);
    }
  }

  // ===== Metadata Operations =====

  /**
   * Get sync token (for change detection)
   */
  async getSyncToken(): Promise<string | null> {
    const db = this.ensureDB();
    const metadata = await db.get('metadata', 'sync_token');
    return metadata?.value || null;
  }

  /**
   * Set sync token
   */
  async setSyncToken(token: string): Promise<void> {
    const db = this.ensureDB();
    await db.put('metadata', { key: 'sync_token', value: token });
  }

  /**
   * Get workspace folder ID
   */
  async getWorkspaceFolderId(): Promise<string | null> {
    const db = this.ensureDB();
    const metadata = await db.get('metadata', 'workspace_folder_id');
    return metadata?.value || null;
  }

  /**
   * Set workspace folder ID
   */
  async setWorkspaceFolderId(folderId: string): Promise<void> {
    const db = this.ensureDB();
    await db.put('metadata', { key: 'workspace_folder_id', value: folderId });
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<number | null> {
    const db = this.ensureDB();
    const metadata = await db.get('metadata', 'last_sync_time');
    return metadata ? parseInt(metadata.value) : null;
  }

  /**
   * Set last sync time
   */
  async setLastSyncTime(time: number): Promise<void> {
    const db = this.ensureDB();
    await db.put('metadata', { key: 'last_sync_time', value: time.toString() });
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: string): Promise<string | null> {
    const db = this.ensureDB();
    const metadata = await db.get('metadata', key);
    return metadata?.value || null;
  }

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: string): Promise<void> {
    const db = this.ensureDB();
    await db.put('metadata', { key, value });
  }

  // ===== Utility Operations =====

  /**
   * Clear all cached files
   */
  async clearFiles(): Promise<void> {
    const db = this.ensureDB();
    await db.clear('files');
  }

  /**
   * Clear all metadata
   */
  async clearMetadata(): Promise<void> {
    const db = this.ensureDB();
    await db.clear('metadata');
  }

  /**
   * Clear entire cache
   */
  async clearAll(): Promise<void> {
    await this.clearFiles();
    await this.clearMetadata();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalFiles: number;
    dirtyFiles: number;
    totalSize: number;
    lastSyncTime: number | null;
  }> {
    const db = this.ensureDB();
    const allFiles = await db.getAll('files');
    const dirtyFiles = await this.getDirtyFiles();
    const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
    const lastSyncTime = await this.getLastSyncTime();

    return {
      totalFiles: allFiles.length,
      dirtyFiles: dirtyFiles.length,
      totalSize,
      lastSyncTime,
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
