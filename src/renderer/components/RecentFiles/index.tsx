/**
 * RecentFiles - Display recently opened files
 *
 * Features:
 * - Shows list of recently opened files
 * - Click to open file
 * - Clear recent files
 * - Displays in FileExplorer header or as separate panel
 */

import React, { useState, useEffect } from 'react';
import type { RecentFile, FileMetadata } from '../../../shared/types';

interface RecentFilesProps {
  onFileSelect: (file: FileMetadata) => void;
}

export const RecentFiles: React.FC<RecentFilesProps> = ({ onFileSelect }) => {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    try {
      const recent = await window.api['recent:get']();
      setRecentFiles(recent);
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  };

  const handleFileClick = async (recentFile: RecentFile) => {
    try {
      // Get full file metadata
      const files = await window.api['file:list']();
      const file = files.find((f) => f.path === recentFile.path);

      if (file) {
        onFileSelect(file);
      }
    } catch (error) {
      console.error('Failed to open recent file:', error);
    }
  };

  const handleClearRecent = async () => {
    if (confirm('Clear all recent files?')) {
      try {
        await window.api['recent:clear']();
        setRecentFiles([]);
      } catch (error) {
        console.error('Failed to clear recent files:', error);
      }
    }
  };

  if (recentFiles.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-vscode-border">
      <div
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-vscode-hover"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-xs text-vscode-text-secondary font-semibold uppercase">
          Recent Files
        </span>
        <div className="flex items-center gap-2">
          {recentFiles.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearRecent();
              }}
              className="text-xs text-vscode-text-secondary hover:text-vscode-text"
              title="Clear recent files"
            >
              Clear
            </button>
          )}
          <span className="text-xs text-vscode-text-secondary">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-48 overflow-y-auto">
          {recentFiles.map((file) => (
            <div
              key={file.path}
              onClick={() => handleFileClick(file)}
              className="px-3 py-2 cursor-pointer hover:bg-vscode-hover flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-vscode-text truncate">{file.name}</div>
                <div className="text-xs text-vscode-text-secondary truncate">
                  {file.path}
                </div>
              </div>
              <div className="text-xs text-vscode-text-secondary ml-2">
                {new Date(file.lastOpened).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
