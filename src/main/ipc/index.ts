import { registerFileHandlers } from './file-handlers';
import { registerAnnotationHandlers } from './annotation-handlers';
import { registerCitationHandlers } from './citation-handlers';
import { registerSearchHandlers } from './search-handlers';
import { registerSettingsHandlers } from './settings-handlers';
import { registerRecentFilesHandlers } from './recent-handlers';
import { registerExportHandlers } from './export-handlers';
import { registerUpdaterHandlers } from './updater-handlers';
import { registerAppHandlers } from './app-handlers';

/**
 * Register all IPC handlers
 */
export function registerAllHandlers() {
  registerFileHandlers();
  registerAnnotationHandlers();
  registerCitationHandlers();
  registerSearchHandlers();
  registerSettingsHandlers();
  registerRecentFilesHandlers();
  registerExportHandlers();
  registerUpdaterHandlers();
  registerAppHandlers();
  // Future: registerDriveHandlers();

  console.log('✓ All IPC handlers registered');
}
