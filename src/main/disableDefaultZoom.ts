import { BrowserWindow } from 'electron';

/**
 * Disables Electron's default zoom behavior to prevent conflicts with
 * custom PDF viewer zoom controls.
 *
 * This prevents Ctrl/Cmd + Plus/Minus from zooming the entire window
 * and allows the PDF viewer to handle zoom gestures.
 */
export function disableDefaultZoom(window: BrowserWindow): void {
  // Prevent keyboard shortcuts from zooming the entire window
  window.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      if (input.key === '=' || input.key === '+' || input.key === '-' || input.key === '0') {
        event.preventDefault();
      }
    }
  });

  // Set zoom factor to 1 and disable zoom level changes
  window.webContents.setZoomFactor(1);
  window.webContents.setVisualZoomLevelLimits(1, 1);
}
