/**
 * DriveService - Google Drive API operations
 *
 * Provides methods for:
 * - Listing files and folders
 * - Downloading files
 * - Uploading files (create + update)
 * - Deleting files
 * - Watching for changes (Changes API)
 */

import { google, drive_v3 } from 'googleapis';
import { DriveAuthService } from './DriveAuthService';
import { Readable } from 'stream';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  createdTime: string;
  size?: string;
  parents?: string[];
  trashed: boolean;
}

export interface DriveChange {
  fileId: string;
  removed: boolean;
  file?: DriveFile;
  time: string;
}

export interface ChangeList {
  changes: DriveChange[];
  newStartPageToken: string;
  nextPageToken?: string;
}

export class DriveService {
  private drive: drive_v3.Drive;
  private auth: DriveAuthService;

  constructor(authService: DriveAuthService) {
    this.auth = authService;
    this.drive = google.drive({
      version: 'v3',
      auth: authService.getOAuth2Client(),
    });
  }

  /**
   * List files in a folder
   */
  async listFiles(folderId?: string): Promise<DriveFile[]> {
    const query = folderId
      ? `'${folderId}' in parents and trashed=false`
      : 'trashed=false';

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, modifiedTime, createdTime, size, parents, trashed)',
      pageSize: 1000,
      orderBy: 'name',
    });

    return (response.data.files || []) as DriveFile[];
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const response = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, modifiedTime, createdTime, size, parents, trashed',
    });

    return response.data as DriveFile;
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<string> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'text' }
    );

    return response.data as string;
  }

  /**
   * Download file as buffer (for binary files like PDFs)
   */
  async downloadFileBuffer(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
  }

  /**
   * Upload new file
   */
  async uploadFile(
    name: string,
    content: string | Buffer,
    mimeType: string,
    parentId?: string
  ): Promise<string> {
    const metadata: drive_v3.Schema$File = {
      name,
      parents: parentId ? [parentId] : undefined,
    };

    const media = {
      mimeType,
      body: typeof content === 'string' ? Readable.from([content]) : Readable.from([content]),
    };

    const response = await this.drive.files.create({
      requestBody: metadata,
      media,
      fields: 'id',
    });

    return response.data.id!;
  }

  /**
   * Update existing file
   */
  async updateFile(fileId: string, content: string | Buffer, mimeType: string): Promise<void> {
    const media = {
      mimeType,
      body: typeof content === 'string' ? Readable.from([content]) : Readable.from([content]),
    };

    await this.drive.files.update({
      fileId,
      media,
    });
  }

  /**
   * Create folder
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    const metadata: drive_v3.Schema$File = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };

    const response = await this.drive.files.create({
      requestBody: metadata,
      fields: 'id',
    });

    return response.data.id!;
  }

  /**
   * Delete file (move to trash)
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.update({
      fileId,
      requestBody: {
        trashed: true,
      },
    });
  }

  /**
   * Permanently delete file
   */
  async permanentlyDeleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({
      fileId,
    });
  }

  /**
   * Get initial page token for change watching
   */
  async getStartPageToken(): Promise<string> {
    const response = await this.drive.changes.getStartPageToken();
    return response.data.startPageToken!;
  }

  /**
   * Get changes since last sync
   */
  async getChanges(pageToken: string, pageSize = 100): Promise<ChangeList> {
    const response = await this.drive.changes.list({
      pageToken,
      pageSize,
      includeRemoved: true,
      fields: 'changes(fileId, removed, file(id, name, mimeType, modifiedTime, createdTime, size, parents, trashed), time), newStartPageToken, nextPageToken',
    });

    const changes: DriveChange[] = (response.data.changes || []).map(change => ({
      fileId: change.fileId!,
      removed: change.removed || false,
      file: change.file as DriveFile | undefined,
      time: change.time!,
    }));

    return {
      changes,
      newStartPageToken: response.data.newStartPageToken!,
      nextPageToken: response.data.nextPageToken,
    };
  }

  /**
   * Get all changes (paginated)
   */
  async getAllChanges(pageToken: string): Promise<ChangeList> {
    let allChanges: DriveChange[] = [];
    let currentPageToken = pageToken;
    let newStartPageToken = '';

    while (true) {
      const result = await this.getChanges(currentPageToken);
      allChanges = allChanges.concat(result.changes);
      newStartPageToken = result.newStartPageToken;

      if (!result.nextPageToken) {
        break;
      }

      currentPageToken = result.nextPageToken;
    }

    return {
      changes: allChanges,
      newStartPageToken,
    };
  }

  /**
   * Search files by name
   */
  async searchFiles(query: string): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      q: `name contains '${query}' and trashed=false`,
      fields: 'files(id, name, mimeType, modifiedTime, createdTime, size, parents)',
      pageSize: 100,
    });

    return (response.data.files || []) as DriveFile[];
  }

  /**
   * Get file by path (relative to workspace folder)
   */
  async getFileByPath(path: string, workspaceFolderId: string): Promise<DriveFile | null> {
    const parts = path.split('/').filter(p => p);
    let currentFolderId = workspaceFolderId;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;

      const query = `name='${part}' and '${currentFolderId}' in parents and trashed=false`;
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, modifiedTime, createdTime, size, parents)',
        pageSize: 1,
      });

      if (!response.data.files || response.data.files.length === 0) {
        return null;
      }

      const file = response.data.files[0] as DriveFile;

      if (isLastPart) {
        return file;
      }

      currentFolderId = file.id;
    }

    return null;
  }

  /**
   * Check if service is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return this.auth.isAuthenticated();
  }
}
