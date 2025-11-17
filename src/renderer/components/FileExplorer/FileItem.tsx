import React from 'react';
import type { FileMetadata } from '../../../shared/types';

interface FileItemProps {
  file: FileMetadata;
  onSelect: (file: FileMetadata) => void;
  isSelected: boolean;
  depth?: number;
}

export const FileItem: React.FC<FileItemProps> = ({
  file,
  onSelect,
  isSelected,
  depth = 0,
}) => {
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

  return (
    <div
      className={`
        flex items-center px-2 py-1 cursor-pointer
        hover:bg-vscode-hover
        ${isSelected ? 'bg-vscode-selection' : ''}
      `}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={handleClick}
    >
      <span className="mr-2 text-sm">{getIcon()}</span>
      <span className="text-sm text-vscode-text truncate">{file.name}</span>
    </div>
  );
};
