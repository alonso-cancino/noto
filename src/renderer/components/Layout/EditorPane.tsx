import React, { useState } from 'react';
import type { FileMetadata } from '../../../shared/types';
import { Editor } from '../Editor';

interface EditorPaneProps {
  file: FileMetadata | null;
  onEditorStateChange?: (wordCount: number, isDirty: boolean) => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({ file, onEditorStateChange }) => {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-vscode-editor text-vscode-text-secondary">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <p>Select a file to open</p>
          <p className="text-xs mt-2">or create a new file from the sidebar</p>
        </div>
      </div>
    );
  }

  if (file.type === 'folder') {
    return (
      <div className="h-full flex items-center justify-center bg-vscode-editor text-vscode-text-secondary">
        <p>Cannot open folder</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-vscode-editor">
      <div className="h-full flex flex-col">
        {/* Tab bar */}
        <div className="h-9 bg-vscode-sidebar border-b border-vscode-border flex items-center px-3">
          <div className="flex items-center gap-2 text-sm text-vscode-text">
            <span>{file.type === 'markdown' ? '📝' : '📄'}</span>
            <span>{file.name}</span>
          </div>
        </div>

        {/* Editor/Viewer area */}
        <div className="flex-1 overflow-hidden">
          {file.type === 'markdown' ? (
            <Editor
              filePath={file.path}
              onContentChange={(content, wordCount, isDirty) => {
                onEditorStateChange?.(wordCount, isDirty);
              }}
            />
          ) : (
            <PDFViewerPlaceholder fileName={file.name} />
          )}
        </div>
      </div>
    </div>
  );
};

const PDFViewerPlaceholder: React.FC<{ fileName: string }> = ({ fileName }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-vscode-text-secondary">
      <div className="text-6xl mb-4">📄</div>
      <p className="text-lg mb-2">{fileName}</p>
      <p className="text-sm">PDF viewer will be integrated in Phase 3</p>
      <div className="text-xs mt-4 opacity-50">
        <p>Features coming:</p>
        <ul className="list-disc ml-6 mt-1">
          <li>Page navigation</li>
          <li>Zoom controls</li>
          <li>Annotations</li>
          <li>Text highlighting</li>
        </ul>
      </div>
    </div>
  );
};
