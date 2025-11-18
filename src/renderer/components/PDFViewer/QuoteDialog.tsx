/**
 * Quote Dialog
 * Allows users to select a note file to quote an annotation into
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Annotation, FileMetadata } from '../../../shared/types';
import { citationService } from '../../services/CitationService';

export interface QuoteDialogProps {
  annotation: Annotation;
  pdfPath: string;
  onQuote: (notePath: string, citationText: string) => void;
  onCancel: () => void;
}

export function QuoteDialog({
  annotation,
  pdfPath,
  onQuote,
  onCancel,
}: QuoteDialogProps): JSX.Element {
  const [notes, setNotes] = useState<FileMetadata[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [citationPreview, setCitationPreview] = useState<string>('');

  const loadNotes = async () => {
    try {
      const files = await window.api['file:list']();
      const markdownNotes = files.filter(
        (f) => f.type === 'markdown' && f.name.endsWith('.md')
      );
      setNotes(markdownNotes);

      if (markdownNotes.length > 0) {
        setSelectedNote(markdownNotes[0].path);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCitationPreview = useCallback(() => {
    const citation = citationService.createQuoteCitation(
      pdfPath,
      annotation,
      annotation.text
    );
    setCitationPreview(citation);
  }, [pdfPath, annotation]);

  useEffect(() => {
    loadNotes();
    generateCitationPreview();
  }, [generateCitationPreview]);

  const handleQuote = async () => {
    if (!selectedNote) {
      return;
    }

    try {
      // Generate the citation text
      const citationText = citationService.createQuoteCitation(
        pdfPath,
        annotation,
        annotation.text
      );

      // Add backlink to annotation
      await citationService.addBacklink(pdfPath, annotation.id, selectedNote);

      // Call the onQuote callback with the selected note and citation text
      onQuote(selectedNote, citationText);
    } catch (error) {
      console.error('Failed to create quote:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedNote) {
      handleQuote();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="quote-dialog fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
      data-testid="quote-dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          Quote in Note
        </h2>

        {/* Citation Preview */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Citation Preview:</div>
          <div className="bg-gray-700 p-3 rounded text-sm text-gray-300 font-mono whitespace-pre-wrap">
            {citationPreview}
          </div>
        </div>

        {/* Note Selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Select Note File:
          </label>
          {loading ? (
            <div className="text-gray-400 text-sm">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-yellow-400 text-sm">
              No markdown notes found. Create a note file first.
            </div>
          ) : (
            <select
              value={selectedNote || ''}
              onChange={(e) => setSelectedNote(e.target.value)}
              className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="note-select"
            >
              {notes.map((note) => (
                <option key={note.path} value={note.path}>
                  {note.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm"
            data-testid="quote-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleQuote}
            disabled={!selectedNote || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="quote-insert"
          >
            Insert Quote
          </button>
        </div>
      </div>
    </div>
  );
}
