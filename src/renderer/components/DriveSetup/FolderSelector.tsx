/**
 * FolderSelector - Select Google Drive folder for workspace
 *
 * Features:
 * - Browse Drive folders
 * - Create new folder
 * - Select existing folder
 * - Show folder path
 */

import React, { useState, useEffect } from 'react';

interface DriveFolder {
  id: string;
  name: string;
  path: string;
}

interface FolderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderId: string, folderPath: string) => void;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
}) => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DriveFolder | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRootFolders();
    }
  }, [isOpen]);

  const loadRootFolders = async () => {
    setIsLoading(true);
    try {
      // TODO: Call IPC to list Drive folders
      // const folders = await window.api['drive:list-folders']();
      // setFolders(folders);

      // Mock data for now
      setFolders([
        { id: '1', name: 'My Drive', path: '/' },
        { id: '2', name: 'Shared with me', path: '/shared' },
      ]);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubfolders = async (_folderId: string) => {
    setIsLoading(true);
    try {
      // TODO: Call IPC to list subfolders
      // const subfolders = await window.api['drive:list-folders'](_folderId);
      // setFolders(subfolders);

      // Mock data
      setFolders([
        { id: '3', name: 'Documents', path: '/Documents' },
        { id: '4', name: 'Projects', path: '/Projects' },
      ]);
    } catch (error) {
      console.error('Failed to load subfolders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: DriveFolder) => {
    setSelectedFolder(folder);
  };

  const handleFolderDoubleClick = (folder: DriveFolder) => {
    setCurrentFolder(folder);
    loadSubfolders(folder.id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call IPC to create folder
      // const newFolder = await window.api['drive:create-folder'](
      //   newFolderName,
      //   currentFolder?.id
      // );

      // Mock
      const newFolder: DriveFolder = {
        id: Math.random().toString(),
        name: newFolderName,
        path: `${currentFolder?.path || ''}/${newFolderName}`,
      };

      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClick = () => {
    if (selectedFolder) {
      onSelectFolder(selectedFolder.id, selectedFolder.path);
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Select Workspace Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Current path */}
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-700">
          <div className="text-sm text-gray-400">
            Current: {currentFolder?.path || '/'}
          </div>
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-1">
              {/* Back button */}
              {currentFolder && (
                <button
                  onClick={() => {
                    setCurrentFolder(null);
                    loadRootFolders();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
                >
                  <span className="text-gray-400">← Back</span>
                </button>
              )}

              {/* Folder items */}
              {folders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  onDoubleClick={() => handleFolderDoubleClick(folder)}
                  className={`px-4 py-2 rounded cursor-pointer ${
                    selectedFolder?.id === folder.id
                      ? 'bg-blue-600'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📁</span>
                    <span className="text-white">{folder.name}</span>
                  </div>
                </div>
              ))}

              {folders.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-400">
                  No folders found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create folder section */}
        {showCreateFolder ? (
          <div className="px-6 py-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                onKeyPress={e => e.key === 'Enter' && handleCreateFolder()}
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-gray-700">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="text-blue-500 hover:text-blue-400"
            >
              + Create New Folder
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectClick}
            disabled={!selectedFolder}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Select Folder
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderSelector;
