/**
 * TabBar - Multiple file tabs
 *
 * Features:
 * - Display open files as tabs
 * - Click to switch between files
 * - Close button on each tab
 * - Keyboard navigation (Ctrl+Tab, Ctrl+W)
 * - Dirty indicator (unsaved changes)
 */

import React from 'react';
import type { FileMetadata } from '../../../shared/types';

interface Tab {
  file: FileMetadata;
  isDirty: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string | null; // file path
  onTabSelect: (filePath: string) => void;
  onTabClose: (filePath: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose,
}) => {
  if (tabs.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'markdown':
        return '📝';
      case 'pdf':
        return '📕';
      default:
        return '📄';
    }
  };

  return (
    <div className="flex items-center bg-vscode-bg border-b border-vscode-border overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.file.path === activeTab;

        return (
          <div
            key={tab.file.path}
            onClick={() => onTabSelect(tab.file.path)}
            className={`
              flex items-center gap-2 px-4 py-2 border-r border-vscode-border
              cursor-pointer transition-colors min-w-[120px] max-w-[200px]
              ${
                isActive
                  ? 'bg-vscode-selection text-vscode-text border-b-2 border-vscode-accent'
                  : 'bg-vscode-bg text-vscode-text-secondary hover:bg-vscode-hover'
              }
            `}
          >
            {/* File icon */}
            <span className="text-sm">{getFileIcon(tab.file.type)}</span>

            {/* File name */}
            <span className="flex-1 truncate text-sm">
              {tab.file.name}
            </span>

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className="text-vscode-accent text-xs">●</span>
            )}

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.file.path);
              }}
              className="text-vscode-text-secondary hover:text-vscode-text hover:bg-vscode-hover rounded p-0.5"
              title="Close tab"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
