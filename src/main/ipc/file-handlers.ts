import { ipcMain } from 'electron';
import { localStorage } from '../services/LocalStorage';
import type { FileMetadata, FileType } from '../../shared/types';

/**
 * Register IPC handlers for file operations
 */
export function registerFileHandlers() {
  // Read file
  ipcMain.handle('file:read', async (_event, path: string): Promise<string> => {
    try {
      return await localStorage.readFile(path);
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  // Write file
  ipcMain.handle('file:write', async (_event, path: string, content: string): Promise<void> => {
    try {
      await localStorage.writeFile(path, content);
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  // Delete file
  ipcMain.handle('file:delete', async (_event, path: string): Promise<void> => {
    try {
      await localStorage.deleteFile(path);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  });

  // Rename file
  ipcMain.handle('file:rename', async (_event, oldPath: string, newPath: string): Promise<void> => {
    try {
      await localStorage.renameFile(oldPath, newPath);
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  });

  // List files
  ipcMain.handle('file:list', async (_event, folderPath: string = ''): Promise<FileMetadata[]> => {
    try {
      return await localStorage.listFiles(folderPath);
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  });

  // Create file
  ipcMain.handle('file:create', async (_event, path: string, type: FileType): Promise<void> => {
    try {
      await localStorage.createFile(path, type);
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  });

  console.log('✓ File IPC handlers registered');
}
