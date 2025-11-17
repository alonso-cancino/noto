import React, { useState } from 'react';
import type { FileMetadata } from '../../../shared/types';
import { FileTree } from './FileTree';

interface FileExplorerProps {
  onFileSelect: (file: FileMetadata) => void;
  selectedPath?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  selectedPath,
}) => {
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  const handleNewFile = async () => {
    const fileName = prompt('Enter file name (e.g., "notes.md"):');
    if (!fileName) return;

    try {
      // Ensure .md extension
      const fullName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
      await window.api['file:create'](fullName, 'markdown');

      // Refresh file tree
      window.location.reload(); // Temporary - will add proper refresh later
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Failed to create file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleNewFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      await window.api['file:create'](folderName, 'folder');
      window.location.reload(); // Temporary - will add proper refresh later
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="h-full flex flex-col bg-vscode-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-vscode-border">
        <span className="text-xs text-vscode-text-secondary uppercase tracking-wide">
          Explorer
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleNewFile}
            className="p-1 hover:bg-vscode-hover rounded text-vscode-text"
            title="New File"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={handleNewFolder}
            className="p-1 hover:bg-vscode-hover rounded text-vscode-text"
            title="New Folder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-hidden">
        <FileTree onFileSelect={onFileSelect} selectedPath={selectedPath} />
      </div>
    </div>
  );
};
