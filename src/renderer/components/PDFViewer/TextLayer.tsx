import React, { useEffect, useRef } from 'react';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

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

        // Set the --scale-factor CSS variable to match viewport scale
        // This fixes the PDF.js warning about missing scale-factor
        textLayerDiv.style.setProperty('--scale-factor', viewport.scale.toString());

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
      className="textLayer"
      style={{
        lineHeight: '1',
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'auto',
        userSelect: 'text',
        zIndex: 5,
      }}
    />
  );
}
