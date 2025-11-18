/**
 * IPC handlers for export operations
 */

import { ipcMain, dialog } from 'electron';
import { ExportService } from '../services/ExportService';
import { getMainWindow } from '../index';

let exportService: ExportService | null = null;

/**
 * Initialize export service
 */
export function initializeExportService(workspaceRoot: string): void {
  exportService = new ExportService(workspaceRoot);
}

/**
 * Register all export-related IPC handlers
 */
export function registerExportHandlers(): void {
  // Export markdown to HTML handler
  ipcMain.handle('export:markdown-to-html', async (_event, filePath: string, outputPath?: string): Promise<void> => {
    if (!exportService) {
      throw new Error('Export service not initialized');
    }

    try {
      // If no output path provided, show save dialog
      let finalOutputPath = outputPath;
      if (!finalOutputPath) {
        const mainWindow = getMainWindow();
        if (!mainWindow) {
          throw new Error('Main window not available');
        }

        const result = await dialog.showSaveDialog(mainWindow, {
          title: 'Export to HTML',
          defaultPath: filePath.replace('.md', '.html'),
          filters: [{ name: 'HTML Files', extensions: ['html'] }],
        });

        if (result.canceled || !result.filePath) {
          return; // User canceled
        }

        finalOutputPath = result.filePath;
      }

      await exportService.exportToHTML(filePath, finalOutputPath);
    } catch (error) {
      console.error('Failed to export to HTML:', error);
      throw error;
    }
  });

  // Export markdown to PDF handler
  ipcMain.handle('export:markdown-to-pdf', async (_event, filePath: string, outputPath?: string): Promise<void> => {
    if (!exportService) {
      throw new Error('Export service not initialized');
    }

    try {
      // If no output path provided, show save dialog
      let finalOutputPath = outputPath;
      if (!finalOutputPath) {
        const mainWindow = getMainWindow();
        if (!mainWindow) {
          throw new Error('Main window not available');
        }

        const result = await dialog.showSaveDialog(mainWindow, {
          title: 'Export to PDF',
          defaultPath: filePath.replace('.md', '.pdf'),
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });

        if (result.canceled || !result.filePath) {
          return; // User canceled
        }

        finalOutputPath = result.filePath;
      }

      await exportService.exportToPDF(filePath, finalOutputPath);
    } catch (error) {
      console.error('Failed to export to PDF:', error);
      throw error;
    }
  });

  console.log('✓ Export handlers registered');
}

/**
 * Get the export service instance (for internal use)
 */
export function getExportService(): ExportService | null {
  return exportService;
}
