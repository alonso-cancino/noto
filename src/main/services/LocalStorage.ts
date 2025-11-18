import fs from 'fs/promises';
import { Dirent } from 'fs';
import path from 'path';
import { app } from 'electron';
import type { FileMetadata, FileType } from '../../shared/types';

/**
 * LocalStorage service handles all file system operations
 * Works with a local workspace directory for now
 * Can be swapped with Drive storage later
 */
export class LocalStorage {
  private workspacePath: string;

  constructor(workspacePath?: string) {
    // Default workspace in user data directory
    this.workspacePath = workspacePath || path.join(app.getPath('userData'), 'workspace');
  }

  /**
   * Initialize the workspace directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.access(this.workspacePath);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.workspacePath, { recursive: true });
    }
  }

  /**
   * Get the workspace path
   */
  getWorkspacePath(): string {
    return this.workspacePath;
  }

  /**
   * Set a new workspace path
   */
  async setWorkspacePath(newPath: string): Promise<void> {
    await fs.access(newPath); // Verify it exists
    this.workspacePath = newPath;
  }

  /**
   * Read file contents
   */
  async readFile(relativePath: string): Promise<string> {
    const fullPath = this.getFullPath(relativePath);
    await this.validatePath(relativePath);

    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  }

  /**
   * Write file contents
   */
  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    await this.validatePath(relativePath);

    // Ensure parent directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Write binary file contents (for PDFs, images, etc.)
   */
  async writeFileBinary(relativePath: string, buffer: Buffer): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    await this.validatePath(relativePath);

    // Ensure parent directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(fullPath, buffer);
  }

  /**
   * Delete file or folder
   */
  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    await this.validatePath(relativePath);

    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }
  }

  /**
   * Rename/move file
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    await this.validatePath(oldPath);
    await this.validatePath(newPath);

    const oldFullPath = this.getFullPath(oldPath);
    const newFullPath = this.getFullPath(newPath);

    // Ensure parent directory exists
    const dir = path.dirname(newFullPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.rename(oldFullPath, newFullPath);
  }

  /**
   * Create a new file or folder
   */
  async createFile(relativePath: string, type: FileType): Promise<void> {
    const fullPath = this.getFullPath(relativePath);
    await this.validatePath(relativePath);

    if (type === 'folder') {
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      // Ensure parent directory exists
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });

      // Create empty file with appropriate extension
      let content = '';
      if (type === 'markdown') {
        content = '# ' + path.basename(relativePath, '.md') + '\n\n';
      }

      await fs.writeFile(fullPath, content, 'utf-8');
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(relativePath: string = ''): Promise<FileMetadata[]> {
    const fullPath = this.getFullPath(relativePath);

    try {
      await fs.access(fullPath);
    } catch {
      // Directory doesn't exist, return empty array
      return [];
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files: FileMetadata[] = [];

    for (const entry of entries) {
      // Skip hidden files (except .annotations.json)
      if (entry.name.startsWith('.') && !entry.name.endsWith('.annotations.json')) {
        continue;
      }

      const entryPath = path.join(relativePath, entry.name);
      const entryFullPath = this.getFullPath(entryPath);
      const stat = await fs.stat(entryFullPath);

      files.push({
        path: entryPath,
        name: entry.name,
        type: this.getFileType(entry),
        size: stat.size,
        modifiedTime: stat.mtime.toISOString(),
      });
    }

    // Sort: folders first, then alphabetically
    files.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    return files;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(relativePath: string): Promise<FileMetadata> {
    const fullPath = this.getFullPath(relativePath);
    await this.validatePath(relativePath);

    const stat = await fs.stat(fullPath);

    return {
      path: relativePath,
      name: path.basename(relativePath),
      type: this.getFileTypeFromPath(relativePath, stat.isDirectory()),
      size: stat.size,
      modifiedTime: stat.mtime.toISOString(),
    };
  }

  /**
   * Check if file exists
   */
  async fileExists(relativePath: string): Promise<boolean> {
    const fullPath = this.getFullPath(relativePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get full file tree recursively
   */
  async getFileTree(relativePath: string = ''): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];

    const collectFiles = async (currentPath: string) => {
      const items = await this.listFiles(currentPath);

      for (const item of items) {
        files.push(item);

        if (item.type === 'folder') {
          await collectFiles(item.path);
        }
      }
    };

    await collectFiles(relativePath);
    return files;
  }

  // Private helper methods

  private getFullPath(relativePath: string): string {
    return path.join(this.workspacePath, relativePath);
  }

  private async validatePath(relativePath: string): Promise<void> {
    // Security: prevent directory traversal
    const normalized = path.normalize(relativePath);

    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      throw new Error('Invalid path: directory traversal not allowed');
    }

    // Check for invalid characters
    if (/[<>:"|?*]/.test(relativePath)) {
      throw new Error('Invalid characters in path');
    }
  }

  private getFileType(entry: Dirent): FileType {
    if (entry.isDirectory()) {
      return 'folder';
    }

    const ext = path.extname(entry.name).toLowerCase();

    if (ext === '.md' || ext === '.markdown') {
      return 'markdown';
    }

    if (ext === '.pdf') {
      return 'pdf';
    }

    return 'markdown'; // Default to markdown for unknown types
  }

  private getFileTypeFromPath(filePath: string, isDirectory: boolean): FileType {
    if (isDirectory) {
      return 'folder';
    }

    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.md' || ext === '.markdown') {
      return 'markdown';
    }

    if (ext === '.pdf') {
      return 'pdf';
    }

    return 'markdown';
  }
}

// Singleton instance
export const localStorage = new LocalStorage();
