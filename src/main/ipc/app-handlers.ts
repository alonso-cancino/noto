import { ipcMain, shell, app } from 'electron';

/**
 * Register IPC handlers for app operations
 */
export function registerAppHandlers() {
  // Get app version
  ipcMain.handle('app:getVersion', async (): Promise<string> => {
    try {
      return app.getVersion();
    } catch (error) {
      console.error('Error getting app version:', error);
      throw error;
    }
  });

  // Open external URL in default browser
  ipcMain.handle('app:openExternal', async (_event, url: string): Promise<void> => {
    try {
      // Validate URL to prevent abuse
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid URL: only HTTP(S) URLs are allowed');
      }

      await shell.openExternal(url);
    } catch (error) {
      console.error('Error opening external URL:', error);
      throw error;
    }
  });

  console.log('✓ App IPC handlers registered');
}
