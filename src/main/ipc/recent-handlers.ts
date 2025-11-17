/**
 * IPC handlers for recent files operations
 */

import { ipcMain } from 'electron';
import { RecentFilesService } from '../services/RecentFilesService';
import type { RecentFile } from '../../shared/types';

let recentFilesService: RecentFilesService | null = null;

/**
 * Initialize recent files service
 */
export function initializeRecentFilesService(userDataPath: string, workspaceRoot: string): void {
  recentFilesService = new RecentFilesService(userDataPath, workspaceRoot);

  // Load recent files on startup
  recentFilesService.load().catch(error => {
    console.error('Failed to load recent files:', error);
  });
}

/**
 * Register all recent files related IPC handlers
 */
export function registerRecentFilesHandlers(): void {
  // Get recent files handler
  ipcMain.handle('recent:get', async (): Promise<RecentFile[]> => {
    if (!recentFilesService) {
      throw new Error('Recent files service not initialized');
    }

    return recentFilesService.getRecentFiles();
  });

  // Add file to recent files handler
  ipcMain.handle('recent:add', async (_event, filePath: string): Promise<void> => {
    if (!recentFilesService) {
      throw new Error('Recent files service not initialized');
    }

    await recentFilesService.addFile(filePath);
  });

  // Clear recent files handler
  ipcMain.handle('recent:clear', async (): Promise<void> => {
    if (!recentFilesService) {
      throw new Error('Recent files service not initialized');
    }

    await recentFilesService.clear();
  });

  console.log('✓ Recent files handlers registered');
}

/**
 * Get the recent files service instance (for internal use)
 */
export function getRecentFilesService(): RecentFilesService | null {
  return recentFilesService;
}
