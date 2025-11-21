import { app, BrowserWindow, protocol } from 'electron';
import path from 'path';
import { registerAllHandlers } from './ipc';
import { localStorage } from './services/LocalStorage';
import { registerProtocolHandler } from './protocol/notoProtocol';
import { initializeSearchService } from './ipc/search-handlers';
import { initializeSettingsService } from './ipc/settings-handlers';
import { initializeRecentFilesService } from './ipc/recent-handlers';
import { initializeExportService } from './ipc/export-handlers';
import { autoUpdaterService } from './services/AutoUpdater';

// MUST register custom protocol schemes BEFORE app.whenReady()
// See: https://www.electronjs.org/docs/latest/api/protocol#protocolregisterschemesasprivilegedcustomschemes
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'noto',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // Development mode - load from Vite dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Initialize storage
  await localStorage.initialize();
  console.log('✓ Local storage initialized at:', localStorage.getWorkspacePath());

  // Initialize settings service
  initializeSettingsService(app.getPath('userData'));
  console.log('✓ Settings service initialized');

  // Initialize search service
  initializeSearchService(localStorage.getWorkspacePath());
  console.log('✓ Search service initialized');

  // Initialize recent files service
  initializeRecentFilesService(app.getPath('userData'), localStorage.getWorkspacePath());
  console.log('✓ Recent files service initialized');

  // Initialize export service
  initializeExportService(localStorage.getWorkspacePath());
  console.log('✓ Export service initialized');

  // Register custom noto:// protocol
  registerProtocolHandler();
  console.log('✓ Custom noto:// protocol registered');

  // Register IPC handlers
  registerAllHandlers();

  // Create window
  createWindow();

  // Initialize auto-updater (only in production)
  if (process.env.NODE_ENV !== 'development' && mainWindow) {
    autoUpdaterService.setMainWindow(mainWindow);
    if (autoUpdaterService.isUpdateSupported()) {
      autoUpdaterService.startUpdateChecks();
      console.log('✓ Auto-updater initialized');
    } else {
      console.log('ℹ Auto-updates not supported on this platform');
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop update checks
  autoUpdaterService.stopUpdateChecks();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Export mainWindow getter for protocol handler
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
