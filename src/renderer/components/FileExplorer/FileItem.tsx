import React, { useState } from 'react';
import type { FileMetadata } from '../../../shared/types';

interface FileItemProps {
  file: FileMetadata;
  onSelect: (file: FileMetadata) => void;
  isSelected: boolean;
  depth?: number;
  onFileMove?: (sourcePath: string, targetFolderPath: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  file,
  onSelect,
  isSelected,
  depth = 0,
  onFileMove
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleClick = () => {
    if (file.type !== 'folder') {
      onSelect(file);
    }
  };

  const getIcon = () => {
    switch (file.type) {
      case 'folder':
        return '📁';
      case 'markdown':
        return '📝';
      case 'pdf':
        return '📄';
      default:
        return '📄';
    }
  };

  // Drag handlers for dragging this file
  const handleDragStart = (e: React.DragEvent) => {
    if (file.type === 'folder') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/noto-file', file.path);
  };

  // Drop handlers for dropping files into this folder
  const handleDragOver = (e: React.DragEvent) => {
    if (file.type !== 'folder') return;

    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (file.type !== 'folder') return;

    // Handle internal file move
    const sourcePath = e.dataTransfer.getData('application/noto-file');
    if (sourcePath && sourcePath !== file.path && onFileMove) {
      onFileMove(sourcePath, file.path);
      return;
    }

    // Handle external file drop
    const externalFiles = Array.from(e.dataTransfer.files);
    if (externalFiles.length > 0) {
      const supportedFiles = externalFiles.filter(
        (f) => f.name.endsWith('.pdf') || f.name.endsWith('.md')
      );

      if (supportedFiles.length === 0) {
        alert('Please drop PDF or Markdown files only');
        return;
      }

      try {
        for (const externalFile of supportedFiles) {
          const targetPath = `${file.path}/${externalFile.name}`;

          if (externalFile.name.endsWith('.pdf')) {
            // Read PDF as array buffer
            const arrayBuffer = await externalFile.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Convert to base64 for IPC transfer
            const base64 = btoa(
              uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Import PDF via IPC
            await window.api['file:import-pdf'](targetPath, base64);
          } else if (externalFile.name.endsWith('.md')) {
            // Read markdown as text
            const content = await externalFile.text();

            // Write markdown file via IPC
            await window.api['file:write'](targetPath, content);
          }
        }

        // Refresh file tree
        window.location.reload();
      } catch (error) {
        console.error('Error importing files to folder:', error);
        alert('Failed to import files: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const isDraggable = file.type !== 'folder';

  return (
    <div
      className={`
        flex items-center px-2 py-1 cursor-pointer
        hover:bg-vscode-hover
        ${isSelected ? 'bg-vscode-selection' : ''}
        ${dragOver ? 'bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed' : ''}
      `}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={handleClick}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="mr-2 text-sm">{getIcon()}</span>
      <span className="text-sm text-vscode-text truncate">{file.name}</span>
    </div>
  );
};
