import React, { useEffect, useState } from 'react';
import type { FileMetadata } from '../../../shared/types';
import { FileItem } from './FileItem';

interface FileTreeProps {
  onFileSelect: (file: FileMetadata) => void;
  selectedPath?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ onFileSelect, selectedPath }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileList = await window.api['file:list']('');
      setFiles(fileList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFiles();
  };

  const handleFileMove = async (sourcePath: string, targetFolderPath: string) => {
    try {
      // Extract file name from source path
      const fileName = sourcePath.split('/').pop() || sourcePath;

      // Build new path: targetFolder/fileName
      const newPath = targetFolderPath ? `${targetFolderPath}/${fileName}` : fileName;

      // Use file:rename IPC to move the file
      await window.api['file:rename'](sourcePath, newPath);

      // Refresh file tree
      loadFiles();
    } catch (error) {
      console.error('Error moving file:', error);
      alert('Failed to move file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-vscode-text-secondary">
        Loading files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-400 mb-2">Error: {error}</div>
        <button onClick={handleRefresh} className="text-vscode-accent hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-vscode-text-secondary text-sm">
        <p className="mb-2">No files yet</p>
        <p className="text-xs">Create a new file to get started</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="py-1">
        {files.map((file) => (
          <FileItem
            key={file.path}
            file={file}
            onSelect={onFileSelect}
            isSelected={file.path === selectedPath}
            onFileMove={handleFileMove}
          />
        ))}
      </div>
    </div>
  );
};
