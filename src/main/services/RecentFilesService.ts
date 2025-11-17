/**
 * RecentFilesService - Track recently opened files
 *
 * Features:
 * - Maintains list of recently opened files
 * - Persists to disk
 * - Limits to max N files
 * - Automatically removes deleted files
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface RecentFile {
  path: string;
  name: string;
  lastOpened: string;
}

const MAX_RECENT_FILES = 10;

export class RecentFilesService {
  private recentFilesPath: string;
  private recentFiles: RecentFile[] = [];
  private workspaceRoot: string;

  constructor(userDataPath: string, workspaceRoot: string) {
    this.recentFilesPath = path.join(userDataPath, 'recent-files.json');
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Load recent files from disk
   */
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.recentFilesPath, 'utf-8');
      this.recentFiles = JSON.parse(data);

      // Clean up files that no longer exist
      await this.cleanupDeletedFiles();

      console.log(`Loaded ${this.recentFiles.length} recent files`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('No recent files found, starting fresh');
        this.recentFiles = [];
      } else {
        console.error('Error loading recent files:', error);
        this.recentFiles = [];
      }
    }
  }

  /**
   * Save recent files to disk
   */
  async save(): Promise<void> {
    try {
      const data = JSON.stringify(this.recentFiles, null, 2);
      await fs.writeFile(this.recentFilesPath, data, 'utf-8');
    } catch (error) {
      console.error('Error saving recent files:', error);
    }
  }

  /**
   * Add a file to recent files
   */
  async addFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);

    // Remove if already exists
    this.recentFiles = this.recentFiles.filter((f) => f.path !== filePath);

    // Add to front
    this.recentFiles.unshift({
      path: filePath,
      name: fileName,
      lastOpened: new Date().toISOString(),
    });

    // Limit to max
    if (this.recentFiles.length > MAX_RECENT_FILES) {
      this.recentFiles = this.recentFiles.slice(0, MAX_RECENT_FILES);
    }

    await this.save();
  }

  /**
   * Get recent files list
   */
  getRecentFiles(): RecentFile[] {
    return [...this.recentFiles];
  }

  /**
   * Clear all recent files
   */
  async clear(): Promise<void> {
    this.recentFiles = [];
    await this.save();
  }

  /**
   * Remove a specific file from recent files
   */
  async removeFile(filePath: string): Promise<void> {
    this.recentFiles = this.recentFiles.filter((f) => f.path !== filePath);
    await this.save();
  }

  /**
   * Clean up files that no longer exist
   */
  private async cleanupDeletedFiles(): Promise<void> {
    const validFiles: RecentFile[] = [];

    for (const file of this.recentFiles) {
      try {
        const fullPath = path.join(this.workspaceRoot, file.path);
        await fs.access(fullPath);
        validFiles.push(file);
      } catch {
        // File doesn't exist, skip it
        console.log(`Removing deleted file from recent: ${file.path}`);
      }
    }

    if (validFiles.length !== this.recentFiles.length) {
      this.recentFiles = validFiles;
      await this.save();
    }
  }
}
