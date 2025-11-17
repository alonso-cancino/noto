import { registerFileHandlers } from './file-handlers';
import { registerAnnotationHandlers } from './annotation-handlers';
import { registerCitationHandlers } from './citation-handlers';

/**
 * Register all IPC handlers
 */
export function registerAllHandlers() {
  registerFileHandlers();
  registerAnnotationHandlers();
  registerCitationHandlers();
  // Future: registerDriveHandlers();
  // Future: registerSearchHandlers();
  // Future: registerSettingsHandlers();

  console.log('✓ All IPC handlers registered');
}
