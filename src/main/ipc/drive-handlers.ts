/**
 * Google Drive IPC Handlers
 *
 * Handles IPC communication for Google Drive authentication and sync operations.
 */

import { ipcMain, dialog } from 'electron';
import type { SyncStatus } from '../../shared/types';
import { DriveAuthService } from '../services/drive/DriveAuthService';
import { DriveService } from '../services/drive/DriveService';
import { SyncEngine } from '../services/sync/SyncEngine';
import { localStorage } from '../services/LocalStorage';

// Singleton instances (initialized when handlers are registered)
let authService: DriveAuthService | null = null;
let driveService: DriveService | null = null;
let syncEngine: SyncEngine | null = null;

/**
 * Initialize Drive services with OAuth credentials
 *
 * IMPORTANT: This requires Google OAuth credentials to be configured.
 * See docs/GOOGLE_OAUTH_SETUP.md for instructions.
 */
export function initializeDriveServices(credentials?: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): void {
  // Use provided credentials or fall back to environment variables
  const clientId = credentials?.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = credentials?.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = credentials?.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback';

  if (!clientId || !clientSecret) {
    console.warn('⚠️  Google OAuth credentials not configured. Drive sync will not work.');
    console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
    console.warn('   or call initializeDriveServices() with credentials.');
    return;
  }

  // Initialize auth service
  authService = new DriveAuthService({
    clientId,
    clientSecret,
    redirectUri,
  });

  // Initialize Drive service
  driveService = new DriveService(authService);

  // Initialize sync engine
  syncEngine = new SyncEngine(driveService);

  // Set up storage callbacks for sync engine
  syncEngine.setStorageCallbacks({
    getFile: async (path: string) => {
      try {
        const content = await localStorage.readFile(path);
        const stats = await localStorage.getMetadata(path);
        return {
          path,
          content,
          modifiedTime: new Date(stats.modifiedTime).getTime(),
          isDirty: false,
        };
      } catch {
        return null;
      }
    },
    saveFile: async (state) => {
      await localStorage.writeFile(state.path, state.content.toString());
    },
    deleteFile: async (path) => {
      await localStorage.deleteFile(path);
    },
  });

  console.log('✓ Google Drive services initialized');
}

/**
 * Register all Drive-related IPC handlers
 */
export function registerDriveHandlers(): void {
  /**
   * Authenticate with Google Drive
   * Opens OAuth window and returns whether authentication succeeded
   */
  ipcMain.handle('drive:auth', async (_event): Promise<boolean> => {
    if (!authService) {
      throw new Error('Drive services not initialized. OAuth credentials missing.');
    }

    try {
      await authService.authenticate();
      return true;
    } catch (error) {
      console.error('Drive authentication failed:', error);
      return false;
    }
  });

  /**
   * Sign out from Google Drive
   * Revokes OAuth tokens and clears stored credentials
   */
  ipcMain.handle('drive:signout', async (_event): Promise<void> => {
    if (!authService) {
      throw new Error('Drive services not initialized');
    }

    try {
      await authService.signOut();
      console.log('✓ Signed out from Google Drive');
    } catch (error) {
      console.error('Drive sign out failed:', error);
      throw error;
    }
  });

  /**
   * Trigger synchronization
   * Performs incremental sync and returns status
   */
  ipcMain.handle('drive:sync', async (_event): Promise<SyncStatus> => {
    if (!syncEngine) {
      throw new Error('Drive services not initialized');
    }

    if (!authService || !(await authService.isAuthenticated())) {
      return {
        status: 'error',
        error: 'Not authenticated. Please sign in to Google Drive first.',
      };
    }

    try {
      await syncEngine.incrementalSync();
      return {
        status: 'synced',
        lastSyncTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  });

  /**
   * Get current sync status
   */
  ipcMain.handle('drive:status', async (_event): Promise<SyncStatus> => {
    if (!syncEngine || !authService) {
      return {
        status: 'offline',
        error: 'Drive services not initialized',
      };
    }

    try {
      const isAuthenticated = await authService.isAuthenticated();

      if (!isAuthenticated) {
        return {
          status: 'offline',
          error: 'Not authenticated',
        };
      }

      // Return current sync status
      // TODO: Get actual status from sync engine
      return {
        status: 'synced',
        lastSyncTime: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Select workspace folder on Google Drive
   * Opens folder picker dialog and returns selected folder ID
   */
  ipcMain.handle('drive:selectFolder', async (_event): Promise<string | null> => {
    if (!driveService || !authService) {
      throw new Error('Drive services not initialized');
    }

    if (!(await authService.isAuthenticated())) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    try {
      // List all folders in root
      const folders = await driveService.listFolders('root');

      // Show folder selection dialog (simple implementation)
      // TODO: Implement proper folder browser UI
      if (folders.length === 0) {
        const result = await dialog.showMessageBox({
          type: 'question',
          buttons: ['Create New', 'Cancel'],
          title: 'No Folders Found',
          message: 'No folders found in your Google Drive. Create a new "Noto" folder?',
        });

        if (result.response === 0) {
          // Create new folder
          const folder = await driveService.createFolder('Noto', 'root');
          if (syncEngine) {
            syncEngine.setWorkspaceFolderId(folder.id);
          }
          return folder.id;
        }
        return null;
      }

      // For now, use the first folder or create "Noto" folder
      // TODO: Show actual folder picker UI
      const notoFolder = folders.find((f) => f.name === 'Noto');
      if (notoFolder) {
        if (syncEngine) {
          syncEngine.setWorkspaceFolderId(notoFolder.id);
        }
        return notoFolder.id;
      }

      // Create Noto folder
      const folder = await driveService.createFolder('Noto', 'root');
      if (syncEngine) {
        syncEngine.setWorkspaceFolderId(folder.id);
      }
      return folder.id;
    } catch (error) {
      console.error('Folder selection failed:', error);
      throw error;
    }
  });

  console.log('✓ Drive IPC handlers registered');
}

/**
 * Get sync engine instance (for main process use)
 */
export function getSyncEngine(): SyncEngine | null {
  return syncEngine;
}

/**
 * Get auth service instance (for main process use)
 */
export function getAuthService(): DriveAuthService | null {
  return authService;
}
