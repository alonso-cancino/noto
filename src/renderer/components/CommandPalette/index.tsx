/**
 * CommandPalette - Quick file navigation and commands
 *
 * Features:
 * - Quick file opening (like VSCode Cmd+P)
 * - Recent files list
 * - Command execution
 * - Fuzzy search
 * - Keyboard navigation
 * - Triggered by Cmd/Ctrl+P
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FileMetadata, RecentFile } from '../../../shared/types';

interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  icon?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: FileMetadata) => void;
  onCommand?: (command: Command) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  onCommand,
}) => {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [filteredItems, setFilteredItems] = useState<Array<FileMetadata | Command>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'files' | 'commands'>('files');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load files and recent files
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [allFiles, recent] = await Promise.all([
        window.api['file:list'](),
        window.api['recent:get'](),
      ]);

      setFiles(allFiles);
      setRecentFiles(recent);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Filter items based on query
  useEffect(() => {
    if (!query.trim()) {
      // Show recent files when no query
      const recentFilesData = files.filter((f) =>
        recentFiles.some((rf) => rf.path === f.path)
      );
      setFilteredItems(recentFilesData);
      setMode('files');
    } else if (query.startsWith('>')) {
      // Command mode
      setMode('commands');
      const commandQuery = query.slice(1).toLowerCase();
      const commands = getCommands();
      const filtered = commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(commandQuery) ||
          cmd.description?.toLowerCase().includes(commandQuery)
      );
      setFilteredItems(filtered);
    } else {
      // File search mode
      setMode('files');
      const queryLower = query.toLowerCase();
      const filtered = files
        .filter((f) => f.name.toLowerCase().includes(queryLower))
        .sort((a, b) => {
          // Prioritize files that start with the query
          const aStarts = a.name.toLowerCase().startsWith(queryLower);
          const bStarts = b.name.toLowerCase().startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.name.localeCompare(b.name);
        });
      setFilteredItems(filtered);
    }

    setSelectedIndex(0);
  }, [query, files, recentFiles]);

  // Get available commands
  const getCommands = useCallback((): Command[] => {
    return [
      {
        id: 'search',
        label: 'Search in Files',
        description: 'Full-text search across all files',
        action: () => {
          onClose();
          // Trigger global search (will be handled by parent)
          window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'f',
            shiftKey: true,
            metaKey: true,
            ctrlKey: true,
          }));
        },
        icon: '🔍',
      },
      {
        id: 'settings',
        label: 'Open Settings',
        description: 'Configure application settings',
        action: () => {
          onClose();
          // Trigger settings (will be handled by parent)
          window.dispatchEvent(new CustomEvent('open-settings'));
        },
        icon: '⚙️',
      },
      {
        id: 'export-html',
        label: 'Export to HTML',
        description: 'Export current markdown file to HTML',
        action: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('export-html'));
        },
        icon: '📄',
      },
      {
        id: 'export-pdf',
        label: 'Export to PDF',
        description: 'Export current markdown file to PDF',
        action: () => {
          onClose();
          window.dispatchEvent(new CustomEvent('export-pdf'));
        },
        icon: '📕',
      },
    ];
  }, [onClose]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleItemSelect(filteredItems[selectedIndex]);
    }
  };

  // Handle item selection
  const handleItemSelect = (item: FileMetadata | Command) => {
    if ('action' in item) {
      // It's a command
      item.action();
      if (onCommand) {
        onCommand(item);
      }
    } else {
      // It's a file
      onFileSelect(item);
    }
    onClose();
    setQuery('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
      <div className="bg-vscode-bg border border-vscode-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col">
        {/* Input */}
        <div className="p-4 border-b border-vscode-border">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search files or > for commands... (Esc to close)"
            className="w-full px-4 py-2 bg-vscode-input text-vscode-text border border-vscode-border rounded focus:outline-none focus:border-vscode-accent"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 && (
            <div className="p-4 text-vscode-text-secondary text-center">
              {query
                ? `No ${mode === 'files' ? 'files' : 'commands'} found`
                : 'Type to search or > for commands'}
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="divide-y divide-vscode-border">
              {filteredItems.map((item, index) => {
                const isCommand = 'action' in item;
                const isFile = 'name' in item;

                return (
                  <div
                    key={isCommand ? item.id : item.path}
                    onClick={() => handleItemSelect(item)}
                    className={`p-3 cursor-pointer transition-colors flex items-center gap-3 ${
                      index === selectedIndex
                        ? 'bg-vscode-selection'
                        : 'hover:bg-vscode-hover'
                    }`}
                  >
                    {isCommand && (
                      <>
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="text-vscode-text font-medium">
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-xs text-vscode-text-secondary">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {isFile && (
                      <>
                        <div className="flex-1">
                          <div className="text-vscode-text font-medium">
                            {item.name}
                          </div>
                          <div className="text-xs text-vscode-text-secondary">
                            {item.path}
                          </div>
                        </div>
                        <span className="text-xs text-vscode-text-secondary">
                          {item.type}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-vscode-border text-xs text-vscode-text-secondary flex items-center gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
          <span className="ml-auto">
            {query.startsWith('>') ? 'Commands' : 'Files'}: {filteredItems.length}
          </span>
        </div>
      </div>
    </div>
  );
};
