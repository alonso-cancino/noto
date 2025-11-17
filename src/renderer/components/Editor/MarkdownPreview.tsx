import React, { useMemo } from 'react';
import { renderMarkdown } from '../../services/markdown';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div className="h-full overflow-y-auto bg-vscode-editor">
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div
          className="markdown-preview prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
};
