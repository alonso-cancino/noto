import React, { useEffect, useRef } from 'react';
import { PDFCanvasProps } from './types';
import { TextLayer } from './TextLayer';
import { AnnotationLayer } from './AnnotationLayer';
import { Annotation } from '../../../shared/types';

export interface PDFCanvasPropsWithAnnotations extends PDFCanvasProps {
  annotations?: Annotation[];
  currentPage?: number;
  onAnnotationClick?: (annotation: Annotation) => void;
  onAnnotationRightClick?: (annotation: Annotation, event: React.MouseEvent) => void;
}

export function PDFCanvas({
  page,
  scale,
  onRenderComplete,
  annotations = [],
  currentPage = 1,
  onAnnotationClick,
  onAnnotationRightClick,
}: PDFCanvasPropsWithAnnotations): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div
      ref={containerRef}
      className="pdf-page-container relative inline-block"
    >
      <canvas
        ref={canvasRef}
        className="pdf-canvas"
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
        }}
      />
      {/* Text layer for text selection */}
      <TextLayer page={page} scale={scale} />
      {/* Annotation layer for highlights, notes, and areas */}
      <AnnotationLayer
        page={page}
        scale={scale}
        annotations={annotations}
        currentPage={currentPage}
        onAnnotationClick={onAnnotationClick}
        onAnnotationRightClick={onAnnotationRightClick}
      />
    </div>
  );
}
