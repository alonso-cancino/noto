import React, { useMemo, useEffect, useRef } from 'react';
import { renderMarkdown } from '../../services/markdown';
import { citationService } from '../../services/CitationService';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const html = useMemo(() => renderMarkdown(content), [content]);
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle clicks on noto:// links
  useEffect(() => {
    const handleLinkClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if it's an anchor tag
      if (target.tagName === 'A') {
        const href = target.getAttribute('href');

        if (href && href.startsWith('noto://')) {
          event.preventDefault();

          // Parse the noto:// URL
          const parsed = citationService.parseNotoUrl(href);
          if (parsed) {
            // Load the file list to find the PDF
            try {
              const files = await window.api['file:list']();
              const targetFile = files.find((f) => f.path === parsed.pdfPath);

              if (targetFile) {
                // Manually trigger file open and navigation
                // This will be handled by the Layout component's event listener
                const openCitationEvent = new CustomEvent('open-citation', {
                  detail: {
                    pdfPath: parsed.pdfPath,
                    page: parsed.page,
                    annotationId: parsed.annotationId,
                  },
                });
                window.dispatchEvent(openCitationEvent);

                console.log('Citation link clicked:', parsed);
              } else {
                console.error('PDF file not found:', parsed.pdfPath);
              }
            } catch (error) {
              console.error('Failed to handle citation link:', error);
            }
          }
        }
      }
    };

    const preview = previewRef.current;
    if (preview) {
      preview.addEventListener('click', handleLinkClick);
    }

    return () => {
      if (preview) {
        preview.removeEventListener('click', handleLinkClick);
      }
    };
  }, [html]);

  return (
    <div className="h-full overflow-y-auto bg-vscode-editor">
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div
          ref={previewRef}
          className="markdown-preview prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
};
