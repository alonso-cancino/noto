import { ipcMain } from 'electron';
import { registerFileHandlers } from '../file-handlers';
import { localStorage } from '../../services/LocalStorage';

// Mock the localStorage service
jest.mock('../../services/LocalStorage', () => ({
  localStorage: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    writeFileBinary: jest.fn(),
    deleteFile: jest.fn(),
    renameFile: jest.fn(),
    listFiles: jest.fn(),
    createFile: jest.fn(),
  },
}));

describe('File IPC Handlers', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let handlers: Map<string, (...args: any[]) => any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Capture registered handlers
    handlers = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ipcMain.handle as jest.Mock) = jest.fn((channel: string, handler: (...args: any[]) => any) => {
      handlers.set(channel, handler);
    });

    // Register the handlers
    registerFileHandlers();
  });

  describe('file:read', () => {
    it('should read file content successfully', async () => {
      const mockContent = '# Test File\n\nThis is a test.';
      (localStorage.readFile as jest.Mock).mockResolvedValue(mockContent);

      const handler = handlers.get('file:read');
      const result = await handler!(null, 'test.md');

      expect(result).toBe(mockContent);
      expect(localStorage.readFile).toHaveBeenCalledWith('test.md');
    });

    it('should throw error when file read fails', async () => {
      const mockError = new Error('File not found');
      (localStorage.readFile as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('file:read');

      await expect(handler!(null, 'missing.md')).rejects.toThrow('File not found');
      expect(localStorage.readFile).toHaveBeenCalledWith('missing.md');
    });
  });

  describe('file:write', () => {
    it('should write file content successfully', async () => {
      (localStorage.writeFile as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('file:write');
      await handler!(null, 'test.md', '# New Content');

      expect(localStorage.writeFile).toHaveBeenCalledWith('test.md', '# New Content');
    });

    it('should throw error when file write fails', async () => {
      const mockError = new Error('Write permission denied');
      (localStorage.writeFile as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('file:write');

      await expect(handler!(null, 'test.md', '# Content')).rejects.toThrow('Write permission denied');
    });
  });

  describe('file:delete', () => {
    it('should delete file successfully', async () => {
      (localStorage.deleteFile as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('file:delete');
      await handler!(null, 'test.md');

      expect(localStorage.deleteFile).toHaveBeenCalledWith('test.md');
    });

    it('should throw error when file delete fails', async () => {
      const mockError = new Error('File in use');
      (localStorage.deleteFile as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('file:delete');

      await expect(handler!(null, 'test.md')).rejects.toThrow('File in use');
    });
  });

  describe('file:rename', () => {
    it('should rename file successfully', async () => {
      (localStorage.renameFile as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('file:rename');
      await handler!(null, 'old-name.md', 'new-name.md');

      expect(localStorage.renameFile).toHaveBeenCalledWith('old-name.md', 'new-name.md');
    });

    it('should throw error when rename fails', async () => {
      const mockError = new Error('Target already exists');
      (localStorage.renameFile as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('file:rename');

      await expect(handler!(null, 'old.md', 'new.md')).rejects.toThrow('Target already exists');
    });
  });

  describe('file:list', () => {
    it('should list files successfully', async () => {
      const mockFiles = [
        {
          path: 'folder1',
          name: 'folder1',
          type: 'folder' as const,
          size: 0,
          modifiedTime: '2025-01-01T00:00:00.000Z',
        },
        {
          path: 'test.md',
          name: 'test.md',
          type: 'markdown' as const,
          size: 1024,
          modifiedTime: '2025-01-01T00:00:00.000Z',
        },
      ];
      (localStorage.listFiles as jest.Mock).mockResolvedValue(mockFiles);

      const handler = handlers.get('file:list');
      const result = await handler!(null, 'some-folder');

      expect(result).toEqual(mockFiles);
      expect(localStorage.listFiles).toHaveBeenCalledWith('some-folder');
    });

    it('should use empty path when no folder specified', async () => {
      (localStorage.listFiles as jest.Mock).mockResolvedValue([]);

      const handler = handlers.get('file:list');
      await handler!(null, undefined);

      expect(localStorage.listFiles).toHaveBeenCalledWith('');
    });

    it('should throw error when listing fails', async () => {
      const mockError = new Error('Permission denied');
      (localStorage.listFiles as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('file:list');

      await expect(handler!(null, 'folder')).rejects.toThrow('Permission denied');
    });
  });

  describe('file:create', () => {
    it('should create markdown file successfully', async () => {
      (localStorage.createFile as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('file:create');
      await handler!(null, 'new-note.md', 'markdown');

      expect(localStorage.createFile).toHaveBeenCalledWith('new-note.md', 'markdown');
    });

    it('should create folder successfully', async () => {
      (localStorage.createFile as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('file:create');
      await handler!(null, 'new-folder', 'folder');

      expect(localStorage.createFile).toHaveBeenCalledWith('new-folder', 'folder');
    });

    it('should throw error when create fails', async () => {
      const mockError = new Error('Already exists');
      (localStorage.createFile as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('file:create');

      await expect(handler!(null, 'test.md', 'markdown')).rejects.toThrow('Already exists');
    });
  });

  describe('file:import-pdf', () => {
    it('should import PDF file successfully', async () => {
      const base64Data = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago='; // Sample base64
      (localStorage.writeFileBinary as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('file:import-pdf');
      await handler!(null, 'document.pdf', base64Data);

      expect(localStorage.writeFileBinary).toHaveBeenCalled();
      const callArgs = (localStorage.writeFileBinary as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('document.pdf');
      expect(Buffer.isBuffer(callArgs[1])).toBe(true);
    });

    it('should add .pdf extension if missing', async () => {
      const base64Data = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago=';
      (localStorage.writeFileBinary as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('file:import-pdf');
      await handler!(null, 'document', base64Data);

      const callArgs = (localStorage.writeFileBinary as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBe('document.pdf');
    });

    it('should throw error when import fails', async () => {
      const mockError = new Error('Invalid base64');
      (localStorage.writeFileBinary as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('file:import-pdf');

      await expect(handler!(null, 'document.pdf', 'invalid-data')).rejects.toThrow();
    });
  });
});
