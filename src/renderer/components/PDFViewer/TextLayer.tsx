import React, { useEffect, useRef } from 'react';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import * as pdfjsLib from 'pdfjs-dist';

interface TextLayerProps {
  page: PDFPageProxy;
  scale: number;
}

export function TextLayer({ page, scale }: TextLayerProps): JSX.Element {
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderTextLayer = async () => {
      if (!page || !textLayerRef.current) {
        return;
      }

      const textLayerDiv = textLayerRef.current;

      // Clear previous text layer
      textLayerDiv.innerHTML = '';

      try {
        // Get text content from PDF page
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale });

        // Render text layer
        pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: [],
        });
      } catch (err) {
        console.error('Error rendering text layer:', err);
      }
    };

    renderTextLayer();
  }, [page, scale]);

  return (
    <div
      ref={textLayerRef}
      className="text-layer absolute inset-0 overflow-hidden"
      style={{
        lineHeight: '1',
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        opacity: 0.2, // Make text invisible but selectable
        pointerEvents: 'auto',
      }}
    />
  );
}
