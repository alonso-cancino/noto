import React, { useState, useRef } from 'react';
import type { FileMetadata } from '../../../shared/types';
import { FileTree } from './FileTree';
import { InputDialog } from '../InputDialog';

interface FileExplorerProps {
  onFileSelect: (file: FileMetadata) => void;
  selectedPath?: string;
}

type DialogType = 'file' | 'folder' | null;

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, selectedPath }) => {
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedFiles = files.filter(
      (file) => file.name.endsWith('.pdf') || file.name.endsWith('.md')
    );

    if (supportedFiles.length === 0) {
      alert('Please drop PDF or Markdown files only');
      return;
    }

    try {
      for (const file of supportedFiles) {
        if (file.name.endsWith('.pdf')) {
          // Read PDF as array buffer
          const arrayBuffer = await file.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Convert to base64 for IPC transfer
          const base64 = btoa(
            uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          // Import PDF via IPC
          await window.api['file:import-pdf'](file.name, base64);
        } else if (file.name.endsWith('.md')) {
          // Read markdown as text
          const content = await file.text();

          // Write markdown file via IPC
          await window.api['file:write'](file.name, content);
        }
      }

      // Refresh file tree
      window.location.reload();
    } catch (error) {
      console.error('Error importing files:', error);
      alert('Failed to import files: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleNewFile = () => {
    setDialogType('file');
  };

  const handleNewFolder = () => {
    setDialogType('folder');
  };

  const handleDialogConfirm = async (name: string) => {
    setDialogType(null);

    try {
      if (dialogType === 'file') {
        // Ensure .md extension
        const fullName = name.endsWith('.md') ? name : `${name}.md`;
        await window.api['file:create'](fullName, 'markdown');
      } else if (dialogType === 'folder') {
        await window.api['file:create'](name, 'folder');
      }

      // Refresh file tree
      window.location.reload(); // Temporary - will add proper refresh later
    } catch (error) {
      console.error(`Error creating ${dialogType}:`, error);
      alert(
        `Failed to create ${dialogType}: ` +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const handleDialogCancel = () => {
    setDialogType(null);
  };

  const handleOpenPDF = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      for (const file of Array.from(files)) {
        if (!file.name.endsWith('.pdf')) {
          alert('Please select PDF files only');
          continue;
        }

        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert to base64 for IPC transfer
        const base64 = btoa(
          uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Import PDF via IPC
        await window.api['file:import-pdf'](file.name, base64);
      }

      // Refresh file tree
      window.location.reload();
    } catch (error) {
      console.error('Error importing PDF:', error);
      alert('Failed to import PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-vscode-sidebar relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-vscode-border">
        <span className="text-xs text-vscode-text-secondary uppercase tracking-wide">Explorer</span>
        <div className="flex gap-1">
          <button
            onClick={handleOpenPDF}
            className="p-1 hover:bg-vscode-hover rounded text-vscode-text"
            title="Open PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </button>
          <button
            onClick={handleNewFile}
            className="p-1 hover:bg-vscode-hover rounded text-vscode-text"
            title="New File"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
          <button
            onClick={handleNewFolder}
            className="p-1 hover:bg-vscode-hover rounded text-vscode-text"
            title="New Folder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Hidden file input for PDF selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* File Tree */}
      <div className="flex-1 overflow-hidden">
        <FileTree onFileSelect={onFileSelect} selectedPath={selectedPath} />
      </div>

      {/* Drag Overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-blue-500 border-dashed flex items-center justify-center z-50">
          <div className="bg-vscode-sidebar p-4 rounded shadow-lg text-center">
            <div className="text-4xl mb-2">📄</div>
            <div className="text-vscode-text font-semibold">Drop files here</div>
            <div className="text-vscode-text-secondary text-sm mt-1">
              Supports .pdf and .md files
            </div>
          </div>
        </div>
      )}

      {/* Input Dialog */}
      <InputDialog
        isOpen={dialogType !== null}
        title={dialogType === 'file' ? 'Create New File' : 'Create New Folder'}
        placeholder={dialogType === 'file' ? 'e.g., notes.md' : 'e.g., research'}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />
    </div>
  );
};
