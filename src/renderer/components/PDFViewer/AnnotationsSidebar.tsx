/**
 * Annotations Sidebar
 * Displays all annotations for the current PDF, grouped by page
 */

import React, { useMemo } from 'react';
import { Annotation, AnnotationType } from '../../../shared/types';

export interface AnnotationsSidebarProps {
  annotations: Annotation[];
  onAnnotationClick?: (annotation: Annotation) => void;
  onAnnotationEdit?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotation: Annotation) => void;
}

export function AnnotationsSidebar({
  annotations,
  onAnnotationClick,
  onAnnotationEdit,
  onAnnotationDelete,
}: AnnotationsSidebarProps): JSX.Element {
  // Group annotations by page
  const annotationsByPage = useMemo(() => {
    const map = new Map<number, Annotation[]>();

    for (const ann of annotations) {
      if (!map.has(ann.pageNumber)) {
        map.set(ann.pageNumber, []);
      }
      map.get(ann.pageNumber)!.push(ann);
    }

    // Sort each page's annotations by y position
    for (const [, anns] of map) {
      anns.sort((a, b) => a.bounds.y - b.bounds.y);
    }

    return map;
  }, [annotations]);

  // Sort pages numerically
  const sortedPages = useMemo(() => {
    return Array.from(annotationsByPage.keys()).sort((a, b) => a - b);
  }, [annotationsByPage]);

  const getIcon = (type: AnnotationType): string => {
    switch (type) {
      case 'highlight':
        return '🖍️';
      case 'note':
        return '📝';
      case 'area':
        return '▢';
    }
  };

  const getPreviewText = (annotation: Annotation): string => {
    if (annotation.text) {
      return annotation.text.substring(0, 100);
    }
    if (annotation.note) {
      return annotation.note.substring(0, 100);
    }
    return `${annotation.type} annotation`;
  };

  const renderAnnotationItem = (annotation: Annotation) => {
    const preview = getPreviewText(annotation);
    const hasMoreText = (annotation.text?.length || 0) > 100 || (annotation.note?.length || 0) > 100;

    return (
      <div
        key={annotation.id}
        className="annotation-item p-2 hover:bg-gray-700 rounded cursor-pointer group relative"
        onClick={() => onAnnotationClick?.(annotation)}
        data-annotation-id={annotation.id}
      >
        <div className="flex items-start gap-2">
          {/* Icon */}
          <div
            className="text-lg flex-shrink-0"
            style={{ color: annotation.color || '#666' }}
          >
            {getIcon(annotation.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-200 break-words">
              {preview}
              {hasMoreText && '...'}
            </div>

            {/* Note (if exists and different from text) */}
            {annotation.note && annotation.note !== annotation.text && (
              <div className="text-xs text-gray-400 mt-1 italic">
                Note: {annotation.note.substring(0, 50)}
                {annotation.note.length > 50 && '...'}
              </div>
            )}

            {/* Citations */}
            {annotation.citedIn && annotation.citedIn.length > 0 && (
              <div className="text-xs text-blue-400 mt-1">
                📎 Cited in {annotation.citedIn.length} note(s)
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 mt-1">
              {new Date(annotation.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Action Buttons (shown on hover) */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {onAnnotationEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnnotationEdit(annotation);
                }}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                title="Edit annotation"
                data-testid={`edit-${annotation.id}`}
              >
                ✏️
              </button>
            )}
            {onAnnotationDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAnnotationDelete(annotation);
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                title="Delete annotation"
                data-testid={`delete-${annotation.id}`}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (annotations.length === 0) {
    return (
      <div className="annotations-sidebar w-64 bg-gray-800 border-l border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-200 mb-4">Annotations</h2>
        <div className="text-sm text-gray-400 text-center py-8">
          No annotations yet.
          <br />
          <span className="text-xs">Use the tools below to add highlights, notes, or areas.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="annotations-sidebar w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-3 z-10">
        <h2 className="text-sm font-semibold text-gray-200">
          Annotations ({annotations.length})
        </h2>
      </div>

      {/* Annotations grouped by page */}
      <div className="p-2">
        {sortedPages.map((pageNumber) => {
          const pageAnnotations = annotationsByPage.get(pageNumber)!;
          return (
            <div key={pageNumber} className="annotation-page-group mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase px-2 py-1 sticky top-0 bg-gray-800">
                Page {pageNumber} ({pageAnnotations.length})
              </h3>
              <div className="space-y-1">
                {pageAnnotations.map((annotation) => renderAnnotationItem(annotation))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
