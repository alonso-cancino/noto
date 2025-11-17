import { registerFileHandlers } from './file-handlers';

/**
 * Register all IPC handlers
 */
export function registerAllHandlers() {
  registerFileHandlers();
  // Future: registerDriveHandlers();
  // Future: registerAnnotationHandlers();
  // Future: registerSearchHandlers();
  // Future: registerSettingsHandlers();

  console.log('✓ All IPC handlers registered');
}
