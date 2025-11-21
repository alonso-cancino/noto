import React, { useState, useEffect } from 'react';
import { MarkdownMonacoEditor } from './MonacoEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { useFileContent } from '../../hooks/useFileContent';
import { countWords } from '../../services/markdown';

interface EditorProps {
  filePath: string;
  onContentChange?: (content: string, wordCount: number, isDirty: boolean) => void;
}

export const Editor: React.FC<EditorProps> = ({ filePath, onContentChange }) => {
  const [showPreview, setShowPreview] = useState(true);
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-vscode-editor text-vscode-text-secondary">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p>Loading file...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-2 py-1 text-xs text-vscode-text hover:bg-vscode-hover rounded"
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? '👁️ Preview' : '📝 Editor Only'}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div className={showPreview ? 'w-1/2' : 'w-full'}>
          <MarkdownMonacoEditor value={content} onChange={setContent} />
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <>
            {/* Divider */}
            <div className="w-px bg-vscode-border" />

            {/* Preview */}
            <div className="w-1/2">
              <MarkdownPreview content={content} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
