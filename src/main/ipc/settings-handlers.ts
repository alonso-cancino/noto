/**
 * IPC handlers for settings operations
 */

import { ipcMain } from 'electron';
import { SettingsService } from '../services/SettingsService';
import type { AppSettings } from '../../shared/types';

let settingsService: SettingsService | null = null;

/**
 * Initialize settings service
 */
export function initializeSettingsService(userDataPath: string): void {
  settingsService = new SettingsService(userDataPath);

  // Load settings on startup
  settingsService.load().catch(error => {
    console.error('Failed to load settings:', error);
  });
}

/**
 * Register all settings-related IPC handlers
 */
export function registerSettingsHandlers(): void {
  // Get settings handler
  ipcMain.handle('settings:get', async (): Promise<AppSettings> => {
    if (!settingsService) {
      throw new Error('Settings service not initialized');
    }

    return settingsService.get();
  });

  // Set settings handler
  ipcMain.handle('settings:set', async (_event, updates: Partial<AppSettings>): Promise<void> => {
    if (!settingsService) {
      throw new Error('Settings service not initialized');
    }

    await settingsService.update(updates);
  });

  console.log('✓ Settings handlers registered');
}

/**
 * Get the settings service instance (for internal use)
 */
export function getSettingsService(): SettingsService | null {
  return settingsService;
}
