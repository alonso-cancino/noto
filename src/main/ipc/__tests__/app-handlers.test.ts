import { ipcMain, shell, app } from 'electron';
import { registerAppHandlers } from '../app-handlers';

// Mock electron modules
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
  app: {
    getVersion: jest.fn(),
  },
}));

describe('App IPC Handlers', () => {
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
    registerAppHandlers();
  });

  describe('app:getVersion', () => {
    it('should return app version successfully', async () => {
      (app.getVersion as jest.Mock).mockReturnValue('1.0.0');

      const handler = handlers.get('app:getVersion');
      const result = await handler!(null);

      expect(result).toBe('1.0.0');
      expect(app.getVersion).toHaveBeenCalled();
    });

    it('should throw error when getVersion fails', async () => {
      const mockError = new Error('Version not available');
      (app.getVersion as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      const handler = handlers.get('app:getVersion');

      await expect(handler!(null)).rejects.toThrow('Version not available');
    });
  });

  describe('app:openExternal', () => {
    it('should open HTTP URL successfully', async () => {
      (shell.openExternal as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('app:openExternal');
      await handler!(null, 'http://example.com');

      expect(shell.openExternal).toHaveBeenCalledWith('http://example.com');
    });

    it('should open HTTPS URL successfully', async () => {
      (shell.openExternal as jest.Mock).mockResolvedValue(undefined);

      const handler = handlers.get('app:openExternal');
      await handler!(null, 'https://example.com');

      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });

    it('should reject non-HTTP(S) URLs for security', async () => {
      const handler = handlers.get('app:openExternal');

      await expect(handler!(null, 'file:///etc/passwd')).rejects.toThrow('Invalid URL');
      await expect(handler!(null, 'javascript:alert(1)')).rejects.toThrow('Invalid URL');
      await expect(handler!(null, 'ftp://example.com')).rejects.toThrow('Invalid URL');

      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('should throw error when openExternal fails', async () => {
      const mockError = new Error('Failed to open URL');
      (shell.openExternal as jest.Mock).mockRejectedValue(mockError);

      const handler = handlers.get('app:openExternal');

      await expect(handler!(null, 'https://example.com')).rejects.toThrow('Failed to open URL');
    });
  });
});
