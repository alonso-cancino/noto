import React, { useState } from 'react';
import type { FileMetadata } from '../../../shared/types';
import { FileExplorer } from '../FileExplorer';
import { EditorPane } from './EditorPane';
import { StatusBar } from '../StatusBar';

export const Layout: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  const handleFileSelect = (file: FileMetadata) => {
    setSelectedFile(file);
    setWordCount(0);
    setIsDirty(false);
  };

  const handleEditorStateChange = (newWordCount: number, newIsDirty: boolean) => {
    setWordCount(newWordCount);
    setIsDirty(newIsDirty);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-vscode-bg overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 border-r border-vscode-border flex-shrink-0">
            <FileExplorer
              onFileSelect={handleFileSelect}
              selectedPath={selectedFile?.path}
            />
          </div>
        )}

        {/* Editor pane */}
        <div className="flex-1">
          <EditorPane
            file={selectedFile}
            onEditorStateChange={handleEditorStateChange}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        currentFile={selectedFile?.path}
        wordCount={wordCount}
        isDirty={isDirty}
      />
    </div>
  );
};
