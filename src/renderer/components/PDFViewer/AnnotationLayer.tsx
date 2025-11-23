/**
 * SVG Annotation Overlay Layer
 * Renders annotations (highlights, notes, areas) on top of PDF canvas
 */

import React, { useEffect, useRef, useState } from 'react';
import { Annotation } from '../../../shared/types';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

export interface AnnotationLayerProps {
  page: PDFPageProxy;
  scale: number;
  annotations: Annotation[];
  currentPage: number;
  onAnnotationClick?: (annotation: Annotation) => void;
  onAnnotationRightClick?: (annotation: Annotation, event: React.MouseEvent) => void;
}

export function AnnotationLayer({
  page,
  scale,
  annotations,
  currentPage,
  onAnnotationClick,
  onAnnotationRightClick,
}: AnnotationLayerProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions when page or scale changes
  useEffect(() => {
    const viewport = page.getViewport({ scale });
    setDimensions({
      width: viewport.width,
      height: viewport.height,
    });
  }, [page, scale]);

  // Filter annotations for current page
  const pageAnnotations = annotations.filter(
    (ann) => ann.pageNumber === currentPage
  );

  // Convert percentage bounds to pixel coordinates
  const boundsToPixels = (annotation: Annotation) => {
    const { bounds } = annotation;
    return {
      x: (bounds.x / 100) * dimensions.width,
      y: (bounds.y / 100) * dimensions.height,
      width: (bounds.width / 100) * dimensions.width,
      height: (bounds.height / 100) * dimensions.height,
    };
  };

  const handleAnnotationClick = (annotation: Annotation) => {
    if (onAnnotationClick) {
      onAnnotationClick(annotation);
    }
  };

  const handleAnnotationRightClick = (
    annotation: Annotation,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    if (onAnnotationRightClick) {
      onAnnotationRightClick(annotation, event);
    }
  };

  const renderHighlight = (annotation: Annotation) => {
    const rect = boundsToPixels(annotation);
    return (
      <rect
        key={annotation.id}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill={annotation.color || '#FFEB3B'}
        opacity={annotation.opacity || 0.4}
        data-annotation-id={annotation.id}
        data-annotation-type="highlight"
        className="annotation-highlight cursor-pointer hover:opacity-60 transition-opacity"
        style={{ pointerEvents: 'auto' }}
        onClick={() => handleAnnotationClick(annotation)}
        onContextMenu={(e) => handleAnnotationRightClick(annotation, e)}
      />
    );
  };

  const renderNote = (annotation: Annotation) => {
    const rect = boundsToPixels(annotation);
    const iconSize = Math.min(rect.width, rect.height);

    return (
      <g
        key={annotation.id}
        data-annotation-id={annotation.id}
        data-annotation-type="note"
        className="annotation-note cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onClick={() => handleAnnotationClick(annotation)}
        onContextMenu={(e) => handleAnnotationRightClick(annotation, e)}
      >
        {/* Background circle */}
        <circle
          cx={rect.x + iconSize / 2}
          cy={rect.y + iconSize / 2}
          r={iconSize / 2}
          fill="#FFA726"
          opacity="0.9"
          className="hover:opacity-100 transition-opacity"
        />
        {/* Note icon (simplified) */}
        <text
          x={rect.x + iconSize / 2}
          y={rect.y + iconSize / 2}
          fontSize={iconSize * 0.6}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          pointerEvents="none"
        >
          📝
        </text>
      </g>
    );
  };

  const renderArea = (annotation: Annotation) => {
    const rect = boundsToPixels(annotation);
    return (
      <g key={annotation.id} data-annotation-id={annotation.id} data-annotation-type="area">
        {/* Filled area */}
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={annotation.color || '#90CAF9'}
          opacity={annotation.opacity || 0.2}
          className="cursor-pointer"
          style={{ pointerEvents: 'auto' }}
          onClick={() => handleAnnotationClick(annotation)}
          onContextMenu={(e) => handleAnnotationRightClick(annotation, e)}
        />
        {/* Border */}
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill="none"
          stroke={annotation.color || '#90CAF9'}
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.8"
          className="pointer-events-none"
        />
      </g>
    );
  };

  const renderAnnotation = (annotation: Annotation) => {
    switch (annotation.type) {
      case 'highlight':
        return renderHighlight(annotation);
      case 'note':
        return renderNote(annotation);
      case 'area':
        return renderArea(annotation);
      default:
        return null;
    }
  };

  return (
    <svg
      ref={svgRef}
      className="annotation-layer absolute top-0 left-0"
      width={dimensions.width}
      height={dimensions.height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      {pageAnnotations.map((annotation) => renderAnnotation(annotation))}
    </svg>
  );
}
