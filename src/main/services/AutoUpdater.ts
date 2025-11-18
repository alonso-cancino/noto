/**
 * Auto-Updater Service
 *
 * Handles application updates using electron-updater.
 * Checks for updates on startup and periodically.
 */

import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { BrowserWindow } from 'electron';

export class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 1000 * 60 * 60 * 4; // Check every 4 hours

  constructor() {
    // Configure logging
    autoUpdater.logger = log;
    log.transports.file.level = 'info';

    // Auto-download updates (can be disabled in settings)
    autoUpdater.autoDownload = true;

    // Allow prerelease versions in development
    autoUpdater.allowPrerelease = process.env.NODE_ENV === 'development';

    // Set up event handlers
    this.setupEventHandlers();
  }

  /**
   * Set the main window for sending update events
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Start checking for updates
   */
  public startUpdateChecks(): void {
    // Check on startup (after 10 seconds to let app initialize)
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);

    // Check periodically
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop checking for updates
   */
  public stopUpdateChecks(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Manually check for updates
   */
  public async checkForUpdates(): Promise<void> {
    try {
      log.info('Checking for updates...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Error checking for updates:', error);
      this.sendToRenderer('update-error', {
        message: 'Failed to check for updates',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Download update
   */
  public async downloadUpdate(): Promise<void> {
    try {
      log.info('Downloading update...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Error downloading update:', error);
      this.sendToRenderer('update-error', {
        message: 'Failed to download update',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Install update and restart app
   */
  public quitAndInstall(): void {
    log.info('Installing update and restarting...');
    // false = don't force close windows (let app clean up)
    // true = restart after quit
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Set up event handlers for auto-updater
   */
  private setupEventHandlers(): void {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.sendToRenderer('checking-for-update');
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendToRenderer('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    // No update available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendToRenderer('update-not-available', {
        version: info.version,
      });
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Download progress:', progressObj.percent.toFixed(2) + '%');
      this.sendToRenderer('download-progress', {
        percent: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendToRenderer('update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    // Error occurred
    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      this.sendToRenderer('update-error', {
        message: 'An error occurred while updating',
        error: error.message,
      });
    });
  }

  /**
   * Send event to renderer process
   */
  private sendToRenderer(channel: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(`updater:${channel}`, data);
    }
  }

  /**
   * Get current version
   */
  public getCurrentVersion(): string {
    return autoUpdater.currentVersion.version;
  }

  /**
   * Check if updates are supported on this platform
   */
  public isUpdateSupported(): boolean {
    // Auto-updates work on macOS and Windows
    // Linux typically uses package managers
    return process.platform === 'darwin' || process.platform === 'win32';
  }
}

// Export singleton instance
export const autoUpdaterService = new AutoUpdaterService();
