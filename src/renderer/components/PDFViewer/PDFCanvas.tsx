import React, { useEffect, useRef } from 'react';
import { PDFCanvasProps } from './types';

export function PDFCanvas({
  page,
  scale,
  onRenderComplete,
}: PDFCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!page || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Could not get canvas context');
        return;
      }

      // Get viewport at desired scale
      const viewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport,
      };

      try {
        await page.render(renderContext).promise;
        onRenderComplete?.();
      } catch (err) {
        console.error('Error rendering PDF page:', err);
      }
    };

    renderPage();
  }, [page, scale, onRenderComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="pdf-canvas"
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}
