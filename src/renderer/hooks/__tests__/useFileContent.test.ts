import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileContent } from '../useFileContent';

// Mock window.api
const mockFileRead = jest.fn();
const mockFileWrite = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).window = {
  api: {
    'file:read': mockFileRead,
    'file:write': mockFileWrite,
  },
};

describe('useFileContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading file content', () => {
    it('should load file content on mount', async () => {
      mockFileRead.mockResolvedValue('# Test Content');

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md' })
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.content).toBe('# Test Content');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockFileRead).toHaveBeenCalledWith('test.md');
    });

    it('should handle file read error', async () => {
      mockFileRead.mockRejectedValue(new Error('File not found'));

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'missing.md' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('File not found');
      expect(result.current.content).toBe('');
    });

    it('should not load when filePath is null', async () => {
      const { result } = renderHook(() =>
        useFileContent({ filePath: null })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFileRead).not.toHaveBeenCalled();
      expect(result.current.content).toBe('');
    });
  });

  describe('Auto-save functionality', () => {
    it('should auto-save after delay when content changes', async () => {
      mockFileRead.mockResolvedValue('Original content');
      mockFileWrite.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md', autoSaveDelay: 500 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change content
      act(() => {
        result.current.setContent('Modified content');
      });

      expect(result.current.isDirty).toBe(true);
      expect(mockFileWrite).not.toHaveBeenCalled();

      // Fast-forward time by 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });

      expect(mockFileWrite).toHaveBeenCalledWith('test.md', 'Modified content');
    });

    it('should debounce multiple rapid changes', async () => {
      mockFileRead.mockResolvedValue('Original');
      mockFileWrite.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md', autoSaveDelay: 500 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Make multiple rapid changes
      act(() => {
        result.current.setContent('Change 1');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setContent('Change 2');
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setContent('Final change');
      });

      // Only the last change should be saved
      expect(mockFileWrite).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockFileWrite).toHaveBeenCalledTimes(1);
      });

      expect(mockFileWrite).toHaveBeenCalledWith('test.md', 'Final change');
    });

    it('should not auto-save if content unchanged', async () => {
      mockFileRead.mockResolvedValue('Original content');

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md', autoSaveDelay: 500 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set to same content
      act(() => {
        result.current.setContent('Original content');
      });

      expect(result.current.isDirty).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockFileWrite).not.toHaveBeenCalled();
    });
  });

  describe('Manual save', () => {
    it('should save manually when save() is called', async () => {
      mockFileRead.mockResolvedValue('Original');
      mockFileWrite.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent('Modified');
      });

      expect(result.current.isDirty).toBe(true);

      await act(async () => {
        await result.current.save();
      });

      expect(mockFileWrite).toHaveBeenCalledWith('test.md', 'Modified');
      expect(result.current.isDirty).toBe(false);
    });

    it('should not save if not dirty', async () => {
      mockFileRead.mockResolvedValue('Content');

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.save();
      });

      expect(mockFileWrite).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      mockFileRead.mockResolvedValue('Content');
      mockFileWrite.mockRejectedValue(new Error('Write failed'));

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent('Modified');
      });

      await act(async () => {
        await expect(result.current.save()).rejects.toThrow('Write failed');
      });

      expect(result.current.error).toBe('Write failed');
      expect(result.current.isDirty).toBe(true); // Still dirty after failed save
    });
  });

  describe('File switching', () => {
    it('should save current file before switching', async () => {
      mockFileRead.mockResolvedValue('File 1 content');
      mockFileWrite.mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ filePath }) => useFileContent({ filePath }),
        { initialProps: { filePath: 'file1.md' as string | null } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Modify content
      act(() => {
        result.current.setContent('Modified file 1');
      });

      expect(result.current.isDirty).toBe(true);

      // Switch to different file
      mockFileRead.mockResolvedValue('File 2 content');

      act(() => {
        rerender({ filePath: 'file2.md' });
      });

      await waitFor(() => {
        expect(mockFileWrite).toHaveBeenCalledWith('file1.md', 'Modified file 1');
      });
    });

    it('should load new file content when switching', async () => {
      mockFileRead
        .mockResolvedValueOnce('File 1')
        .mockResolvedValueOnce('File 2');

      const { result, rerender } = renderHook(
        ({ filePath }) => useFileContent({ filePath }),
        { initialProps: { filePath: 'file1.md' as string | null } }
      );

      await waitFor(() => {
        expect(result.current.content).toBe('File 1');
      });

      // Switch file
      act(() => {
        rerender({ filePath: 'file2.md' });
      });

      await waitFor(() => {
        expect(result.current.content).toBe('File 2');
      });

      expect(result.current.isDirty).toBe(false);
    });

    it('should clear content when switching to null', async () => {
      mockFileRead.mockResolvedValue('File content');

      const { result, rerender } = renderHook(
        ({ filePath }) => useFileContent({ filePath }),
        { initialProps: { filePath: 'file.md' as string | null } }
      );

      await waitFor(() => {
        expect(result.current.content).toBe('File content');
      });

      // Switch to null
      act(() => {
        rerender({ filePath: null });
      });

      await waitFor(() => {
        expect(result.current.content).toBe('');
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Reload functionality', () => {
    it('should reload file content', async () => {
      mockFileRead
        .mockResolvedValueOnce('Original content')
        .mockResolvedValueOnce('Updated content');

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md' })
      );

      await waitFor(() => {
        expect(result.current.content).toBe('Original content');
      });

      // Reload
      await act(async () => {
        await result.current.reload();
      });

      expect(result.current.content).toBe('Updated content');
      expect(result.current.isDirty).toBe(false);
      expect(mockFileRead).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dirty state tracking', () => {
    it('should track dirty state correctly', async () => {
      mockFileRead.mockResolvedValue('Original');

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md' })
      );

      await waitFor(() => {
        expect(result.current.isDirty).toBe(false);
      });

      // Modify content
      act(() => {
        result.current.setContent('Modified');
      });

      expect(result.current.isDirty).toBe(true);

      // Revert to original
      act(() => {
        result.current.setContent('Original');
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Custom auto-save delay', () => {
    it('should respect custom delay', async () => {
      mockFileRead.mockResolvedValue('Original');
      mockFileWrite.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useFileContent({ filePath: 'test.md', autoSaveDelay: 1000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setContent('Modified');
      });

      // Advance by 500ms (should not save yet)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockFileWrite).not.toHaveBeenCalled();

      // Advance by another 500ms (total 1000ms)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockFileWrite).toHaveBeenCalled();
      });
    });
  });
});
