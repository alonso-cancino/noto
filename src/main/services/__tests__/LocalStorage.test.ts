import fs from 'fs/promises';
import path from 'path';
import { LocalStorage } from '../LocalStorage';

// Mock fs/promises
jest.mock('fs/promises');
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/user/data'),
  },
}));

describe('LocalStorage', () => {
  let storage: LocalStorage;
  const mockWorkspace = '/mock/workspace';

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new LocalStorage(mockWorkspace);
  });

  describe('initialize', () => {
    it('should create workspace directory if it does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Directory not found'));
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await storage.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith(mockWorkspace, { recursive: true });
    });

    it('should not create workspace if it already exists', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      await storage.initialize();

      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe('readFile', () => {
    it('should read file content successfully', async () => {
      const mockContent = '# Test Content';
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await storage.readFile('test.md');

      expect(result).toBe(mockContent);
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'test.md'),
        'utf-8'
      );
    });

    it('should throw error for invalid path with ..', async () => {
      await expect(storage.readFile('../etc/passwd')).rejects.toThrow(
        'Invalid path: directory traversal not allowed'
      );
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    it('should throw error for absolute paths', async () => {
      await expect(storage.readFile('/etc/passwd')).rejects.toThrow(
        'Invalid path: directory traversal not allowed'
      );
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    it('should throw error for invalid characters', async () => {
      await expect(storage.readFile('test<file>.md')).rejects.toThrow(
        'Invalid characters in path'
      );
      await expect(storage.readFile('test|file.md')).rejects.toThrow(
        'Invalid characters in path'
      );
      expect(fs.readFile).not.toHaveBeenCalled();
    });
  });

  describe('writeFile', () => {
    it('should write file content successfully', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await storage.writeFile('test.md', '# New Content');

      expect(fs.mkdir).toHaveBeenCalledWith(mockWorkspace, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'test.md'),
        '# New Content',
        'utf-8'
      );
    });

    it('should create parent directory if needed', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await storage.writeFile('folder/subfolder/test.md', 'Content');

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'folder/subfolder'),
        { recursive: true }
      );
    });

    it('should throw error for invalid path', async () => {
      await expect(storage.writeFile('../test.md', 'content')).rejects.toThrow(
        'Invalid path'
      );
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('writeFileBinary', () => {
    it('should write binary file successfully', async () => {
      const buffer = Buffer.from('binary data');
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await storage.writeFileBinary('document.pdf', buffer);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'document.pdf'),
        buffer
      );
    });

    it('should create parent directory for binary files', async () => {
      const buffer = Buffer.from('data');
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await storage.writeFileBinary('folder/file.pdf', buffer);

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'folder'),
        { recursive: true }
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete regular file', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false });
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await storage.deleteFile('test.md');

      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockWorkspace, 'test.md'));
    });

    it('should delete directory recursively', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true });
      (fs.rm as jest.Mock).mockResolvedValue(undefined);

      await storage.deleteFile('folder');

      expect(fs.rm).toHaveBeenCalledWith(path.join(mockWorkspace, 'folder'), {
        recursive: true,
      });
    });

    it('should throw error for invalid path', async () => {
      await expect(storage.deleteFile('../test.md')).rejects.toThrow('Invalid path');
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });

  describe('renameFile', () => {
    it('should rename file successfully', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.rename as jest.Mock).mockResolvedValue(undefined);

      await storage.renameFile('old.md', 'new.md');

      expect(fs.rename).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'old.md'),
        path.join(mockWorkspace, 'new.md')
      );
    });

    it('should create parent directory if needed', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.rename as jest.Mock).mockResolvedValue(undefined);

      await storage.renameFile('old.md', 'folder/new.md');

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'folder'),
        { recursive: true }
      );
    });

    it('should validate both old and new paths', async () => {
      await expect(storage.renameFile('../old.md', 'new.md')).rejects.toThrow();
      await expect(storage.renameFile('old.md', '../new.md')).rejects.toThrow();
      expect(fs.rename).not.toHaveBeenCalled();
    });
  });

  describe('createFile', () => {
    it('should create markdown file with template', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await storage.createFile('test.md', 'markdown');

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'test.md'),
        expect.stringContaining('# test'),
        'utf-8'
      );
    });

    it('should create folder', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await storage.createFile('new-folder', 'folder');

      expect(fs.mkdir).toHaveBeenCalledWith(path.join(mockWorkspace, 'new-folder'), {
        recursive: true,
      });
    });

    it('should create PDF file as empty', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await storage.createFile('document.pdf', 'pdf');

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockWorkspace, 'document.pdf'),
        '',
        'utf-8'
      );
    });
  });

  describe('listFiles', () => {
    it('should list files and folders', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'folder1', isDirectory: () => true },
        { name: 'test.md', isDirectory: () => false },
        { name: 'document.pdf', isDirectory: () => false },
      ]);
      (fs.stat as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('folder1')) {
          return Promise.resolve({
            size: 0,
            mtime: new Date('2025-01-01'),
            isDirectory: () => true,
          });
        }
        return Promise.resolve({
          size: 1024,
          mtime: new Date('2025-01-01'),
          isDirectory: () => false,
        });
      });

      const result = await storage.listFiles('');

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('folder');
      // Files are sorted alphabetically: document.pdf comes before test.md
      expect(result[1].type).toBe('pdf');
      expect(result[2].type).toBe('markdown');
    });

    it('should skip hidden files except annotations', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: '.hidden', isDirectory: () => false },
        { name: '.document.pdf.annotations.json', isDirectory: () => false },
        { name: 'visible.md', isDirectory: () => false },
      ]);
      (fs.stat as jest.Mock).mockResolvedValue({
        size: 100,
        mtime: new Date(),
        isDirectory: () => false,
      });

      const result = await storage.listFiles('');

      expect(result).toHaveLength(2);
      expect(result.some((f) => f.name === '.hidden')).toBe(false);
      expect(result.some((f) => f.name === '.document.pdf.annotations.json')).toBe(true);
      expect(result.some((f) => f.name === 'visible.md')).toBe(true);
    });

    it('should return empty array if directory does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await storage.listFiles('non-existent');

      expect(result).toEqual([]);
      expect(fs.readdir).not.toHaveBeenCalled();
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await storage.fileExists('test.md');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await storage.fileExists('missing.md');

      expect(result).toBe(false);
    });
  });

  describe('getWorkspacePath', () => {
    it('should return workspace path', () => {
      expect(storage.getWorkspacePath()).toBe(mockWorkspace);
    });
  });

  describe('path validation', () => {
    const invalidPaths = [
      '../../../etc/passwd',
      '../../sensitive.txt',
      '/absolute/path',
      'C:\\Windows\\System32',
      'test<file>.md',
      'test>file.md',
      'test:file.md',
      'test"file.md',
      'test|file.md',
      'test?file.md',
      'test*file.md',
    ];

    invalidPaths.forEach((invalidPath) => {
      it(`should reject invalid path: ${invalidPath}`, async () => {
        await expect(storage.readFile(invalidPath)).rejects.toThrow();
      });
    });

    const validPaths = [
      'test.md',
      'folder/test.md',
      'folder/subfolder/test.md',
      'test-file.md',
      'test_file.md',
      'test file with spaces.md',
      'folder1/folder2/file.pdf',
    ];

    validPaths.forEach((validPath) => {
      it(`should accept valid path: ${validPath}`, async () => {
        (fs.readFile as jest.Mock).mockResolvedValue('content');

        await expect(storage.readFile(validPath)).resolves.toBe('content');
      });
    });
  });
});
