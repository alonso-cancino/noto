/**
 * Backlinks Panel
 * Shows which note files cite annotations in the current PDF
 */

import React, { useState, useEffect } from 'react';
import { Annotation } from '../../../shared/types';
import { citationService } from '../../services/CitationService';
import path from 'path-browserify';

export interface BacklinksPanelProps {
  pdfPath: string;
  annotations: Annotation[];
  onNoteClick?: (notePath: string) => void;
}

interface BacklinkInfo {
  notePath: string;
  noteName: string;
  annotationCount: number;
  annotations: Annotation[];
}

export function BacklinksPanel({
  pdfPath,
  annotations,
  onNoteClick,
}: BacklinksPanelProps): JSX.Element {
  const [backlinks, setBacklinks] = useState<BacklinkInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBacklinks();
  }, [pdfPath, annotations]);

  const loadBacklinks = async () => {
    setLoading(true);
    try {
      // Get backlinks map (annotation ID -> note paths)
      const backlinksMap = await citationService.getBacklinksForPdf(pdfPath);

      // Group by note file
      const noteMap = new Map<string, Annotation[]>();

      for (const annotation of annotations) {
        const notePaths = backlinksMap.get(annotation.id);
        if (notePaths) {
          for (const notePath of notePaths) {
            if (!noteMap.has(notePath)) {
              noteMap.set(notePath, []);
            }
            noteMap.get(notePath)!.push(annotation);
          }
        }
      }

      // Convert to BacklinkInfo array
      const backlinkInfos: BacklinkInfo[] = [];
      for (const [notePath, anns] of noteMap) {
        backlinkInfos.push({
          notePath,
          noteName: path.basename(notePath),
          annotationCount: anns.length,
          annotations: anns,
        });
      }

      // Sort by annotation count (descending)
      backlinkInfos.sort((a, b) => b.annotationCount - a.annotationCount);

      setBacklinks(backlinkInfos);
    } catch (error) {
      console.error('Failed to load backlinks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteClick = (notePath: string) => {
    if (onNoteClick) {
      onNoteClick(notePath);
    }
  };

  const renderAnnotationPreview = (annotation: Annotation) => {
    const preview = annotation.text || annotation.note || '';
    const truncated = preview.substring(0, 60);
    return (
      <div
        key={annotation.id}
        className="text-xs text-gray-400 ml-4 mb-1 truncate"
        title={preview}
      >
        • {truncated}
        {preview.length > 60 && '...'}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="backlinks-panel w-64 bg-gray-800 border-l border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-200 mb-4">Backlinks</h2>
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  if (backlinks.length === 0) {
    return (
      <div className="backlinks-panel w-64 bg-gray-800 border-l border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-200 mb-4">Backlinks</h2>
        <div className="text-sm text-gray-400 text-center py-8">
          No notes cite this PDF yet.
          <br />
          <span className="text-xs mt-2 block">
            Use "Quote in Note" to create citations
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="backlinks-panel w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-3 z-10">
        <h2 className="text-sm font-semibold text-gray-200">
          Backlinks ({backlinks.length})
        </h2>
      </div>

      {/* Backlinks list */}
      <div className="p-2">
        {backlinks.map((backlink) => (
          <div
            key={backlink.notePath}
            className="backlink-item mb-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
            onClick={() => handleNoteClick(backlink.notePath)}
            data-testid={`backlink-${backlink.notePath}`}
          >
            {/* Note name */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📝</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-medium truncate" title={backlink.notePath}>
                  {backlink.noteName}
                </div>
                <div className="text-xs text-gray-400">
                  {backlink.annotationCount} citation
                  {backlink.annotationCount !== 1 && 's'}
                </div>
              </div>
            </div>

            {/* Annotation previews */}
            <div className="space-y-1">
              {backlink.annotations.slice(0, 3).map((ann) => renderAnnotationPreview(ann))}
              {backlink.annotations.length > 3 && (
                <div className="text-xs text-gray-500 ml-4">
                  +{backlink.annotations.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
