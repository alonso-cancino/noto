import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FileTree } from '../FileTree';
import type { FileMetadata } from '../../../../shared/types';

// Mock the window.api
const mockFileList = jest.fn();
const mockFileRename = jest.fn();

global.window.api = {
  'file:list': mockFileList,
  'file:rename': mockFileRename,
} as any;

// Mock FileItem component to simplify testing
jest.mock('../FileItem', () => ({
  FileItem: ({
    file,
    onSelect,
    isSelected,
    onToggle,
    isExpanded,
  }: any) => (
    <div
      data-testid={`file-item-${file.path}`}
      data-selected={isSelected}
      data-expanded={isExpanded}
      onClick={() => {
        if (file.type === 'folder' && onToggle) {
          onToggle();
        } else if (file.type !== 'folder') {
          onSelect(file);
        }
      }}
    >
      {file.name} ({file.type})
    </div>
  ),
}));

describe('FileTree', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Loading', () => {
    it('should load files recursively on mount', async () => {
      const rootFiles: FileMetadata[] = [
        { name: 'file1.md', path: 'file1.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
        { name: 'folder1', path: 'folder1', type: 'folder', size: 0, modifiedTime: new Date().toISOString() },
      ];

      const folderContents: FileMetadata[] = [
        { name: 'file2.md', path: 'folder1/file2.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
      ];

      mockFileList
        .mockResolvedValueOnce(rootFiles)
        .mockResolvedValueOnce(folderContents);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      // Should show loading state initially
      expect(screen.getByText('Loading files...')).toBeInTheDocument();

      // Wait for files to load
      await waitFor(() => {
        expect(mockFileList).toHaveBeenCalledWith('');
        expect(mockFileList).toHaveBeenCalledWith('folder1');
      });

      // Should render root level files
      await waitFor(() => {
        expect(screen.getByTestId('file-item-file1.md')).toBeInTheDocument();
        expect(screen.getByTestId('file-item-folder1')).toBeInTheDocument();
      });

      // Expand folder to see nested files
      const folderItem = screen.getByTestId('file-item-folder1');
      fireEvent.click(folderItem);

      // Now nested files should be visible
      await waitFor(() => {
        expect(screen.getByTestId('file-item-folder1/file2.md')).toBeInTheDocument();
      });
    });

    it('should handle loading errors', async () => {
      const error = new Error('Failed to load');
      mockFileList.mockRejectedValueOnce(error);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Failed to load/)).toBeInTheDocument();
      });

      // Should show retry button
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    it('should show empty state when no files exist', async () => {
      mockFileList.mockResolvedValueOnce([]);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      await waitFor(() => {
        expect(screen.getByText('No files yet')).toBeInTheDocument();
        expect(screen.getByText('Create a new file to get started')).toBeInTheDocument();
      });
    });
  });

  describe('Folder Expand/Collapse', () => {
    it('should expand folder when clicked', async () => {
      const rootFiles: FileMetadata[] = [
        { name: 'folder1', path: 'folder1', type: 'folder', size: 0, modifiedTime: new Date().toISOString() },
      ];

      const folderContents: FileMetadata[] = [
        { name: 'file1.md', path: 'folder1/file1.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
      ];

      mockFileList
        .mockResolvedValueOnce(rootFiles)
        .mockResolvedValueOnce(folderContents);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      await waitFor(() => {
        expect(screen.getByTestId('file-item-folder1')).toBeInTheDocument();
      });

      const folderElement = screen.getByTestId('file-item-folder1');
      expect(folderElement).toHaveAttribute('data-expanded', 'false');

      // Click to expand
      fireEvent.click(folderElement);

      await waitFor(() => {
        expect(folderElement).toHaveAttribute('data-expanded', 'true');
      });

      // Nested file should now be visible
      expect(screen.getByTestId('file-item-folder1/file1.md')).toBeInTheDocument();
    });

    it('should collapse folder when clicked again', async () => {
      const rootFiles: FileMetadata[] = [
        { name: 'folder1', path: 'folder1', type: 'folder', size: 0, modifiedTime: new Date().toISOString() },
      ];

      const folderContents: FileMetadata[] = [
        { name: 'file1.md', path: 'folder1/file1.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
      ];

      mockFileList
        .mockResolvedValueOnce(rootFiles)
        .mockResolvedValueOnce(folderContents);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      await waitFor(() => {
        expect(screen.getByTestId('file-item-folder1')).toBeInTheDocument();
      });

      const folderElement = screen.getByTestId('file-item-folder1');

      // Expand
      fireEvent.click(folderElement);
      await waitFor(() => {
        expect(folderElement).toHaveAttribute('data-expanded', 'true');
      });

      // Collapse
      fireEvent.click(folderElement);
      await waitFor(() => {
        expect(folderElement).toHaveAttribute('data-expanded', 'false');
      });
    });
  });

  describe('File Selection', () => {
    it('should call onFileSelect when file is clicked', async () => {
      const file: FileMetadata = {
        name: 'file1.md',
        path: 'file1.md',
        type: 'markdown',
        size: 100,
        modifiedTime: new Date().toISOString(),
      };

      mockFileList.mockResolvedValueOnce([file]);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      await waitFor(() => {
        expect(screen.getByTestId('file-item-file1.md')).toBeInTheDocument();
      });

      const fileElement = screen.getByTestId('file-item-file1.md');
      fireEvent.click(fileElement);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it('should highlight selected file', async () => {
      const file: FileMetadata = {
        name: 'file1.md',
        path: 'file1.md',
        type: 'markdown',
        size: 100,
        modifiedTime: new Date().toISOString(),
      };

      mockFileList.mockResolvedValueOnce([file]);

      render(<FileTree onFileSelect={mockOnFileSelect} selectedPath="file1.md" />);

      await waitFor(() => {
        const fileElement = screen.getByTestId('file-item-file1.md');
        expect(fileElement).toHaveAttribute('data-selected', 'true');
      });
    });
  });

  describe('File Tree Structure', () => {
    it('should build correct tree hierarchy', async () => {
      const files: FileMetadata[] = [
        { name: 'root.md', path: 'root.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
        { name: 'folder1', path: 'folder1', type: 'folder', size: 0, modifiedTime: new Date().toISOString() },
        { name: 'nested.md', path: 'folder1/nested.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
        { name: 'subfolder', path: 'folder1/subfolder', type: 'folder', size: 0, modifiedTime: new Date().toISOString() },
        { name: 'deep.md', path: 'folder1/subfolder/deep.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
      ];

      mockFileList
        .mockResolvedValueOnce([files[0], files[1]])
        .mockResolvedValueOnce([files[2], files[3]])
        .mockResolvedValueOnce([files[4]]);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      // Wait for root level items to be visible
      await waitFor(() => {
        expect(screen.getByTestId('file-item-root.md')).toBeInTheDocument();
        expect(screen.getByTestId('file-item-folder1')).toBeInTheDocument();
      });

      // Expand folder1 to see its children
      const folder1 = screen.getByTestId('file-item-folder1');
      fireEvent.click(folder1);

      // Now nested items should be visible
      await waitFor(() => {
        expect(screen.getByTestId('file-item-folder1/nested.md')).toBeInTheDocument();
        expect(screen.getByTestId('file-item-folder1/subfolder')).toBeInTheDocument();
      });

      // Expand subfolder to see deeply nested files
      const subfolder = screen.getByTestId('file-item-folder1/subfolder');
      fireEvent.click(subfolder);

      await waitFor(() => {
        expect(screen.getByTestId('file-item-folder1/subfolder/deep.md')).toBeInTheDocument();
      });
    });
  });

  describe('File Operations', () => {
    it('should retry loading files when retry button is clicked', async () => {
      mockFileList
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce([
          { name: 'file1.md', path: 'file1.md', type: 'markdown', size: 100, modifiedTime: new Date().toISOString() },
        ]);

      render(<FileTree onFileSelect={mockOnFileSelect} />);

      await waitFor(() => {
        expect(screen.getByText(/Error/)).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('file-item-file1.md')).toBeInTheDocument();
      });
    });
  });
});
