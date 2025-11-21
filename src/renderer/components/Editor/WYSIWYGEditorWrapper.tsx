/**
 * Wrapper for WYSIWYG Editor
 * Maintains same interface as old Monaco-based Editor
 */

import React, { useEffect } from 'react';
import { WYSIWYGEditor } from '../WYSIWYGEditor';
import { useFileContent } from '../../hooks/useFileContent';
import { countWords } from '../../services/markdown';

interface EditorProps {
  filePath: string;
  onContentChange?: (content: string, wordCount: number, isDirty: boolean) => void;
}

export const Editor: React.FC<EditorProps> = ({ filePath, onContentChange }) => {
  const { content, loading, error, isDirty, setContent } = useFileContent({
    filePath,
    autoSaveDelay: 500,
  });

  // Notify parent of content changes
  useEffect(() => {
    if (onContentChange && content !== undefined) {
      const wordCount = countWords(content);
      onContentChange(content, wordCount, isDirty);
    }
  }, [content, isDirty, onContentChange]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-vscode-editor">
        <div className="text-center text-red-400">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg mb-2">Error loading file</p>
          <p className="text-sm opacity-75">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-vscode-editor">
      {/* Toolbar */}
      <div className="h-8 bg-vscode-sidebar border-b border-vscode-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2 text-xs text-vscode-text-secondary">
          <span>Markdown</span>
          {isDirty && (
            <>
              <span>•</span>
              <span className="text-vscode-accent">Modified</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-vscode-text-secondary">
          <span>WYSIWYG Mode</span>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        <WYSIWYGEditor value={content} onChange={setContent} loading={loading} />
      </div>
    </div>
  );
};
