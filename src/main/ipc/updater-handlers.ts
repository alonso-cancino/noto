/**
 * IPC Handlers for Auto-Updater
 */

import { ipcMain } from 'electron';
import { autoUpdaterService } from '../services/AutoUpdater';

export function registerUpdaterHandlers(): void {
  // Check for updates manually
  ipcMain.handle('updater:check-for-updates', async () => {
    await autoUpdaterService.checkForUpdates();
  });

  // Download update
  ipcMain.handle('updater:download-update', async () => {
    await autoUpdaterService.downloadUpdate();
  });

  // Install update and restart
  ipcMain.handle('updater:quit-and-install', () => {
    autoUpdaterService.quitAndInstall();
  });

  // Get current version
  ipcMain.handle('updater:get-version', () => {
    return autoUpdaterService.getCurrentVersion();
  });

  // Check if updates are supported
  ipcMain.handle('updater:is-supported', () => {
    return autoUpdaterService.isUpdateSupported();
  });
}
