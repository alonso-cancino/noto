/**
 * Annotation Context Menu
 * Right-click menu for editing and deleting annotations
 */

import React, { useEffect, useRef } from 'react';
import { Annotation } from '../../../shared/types';

export interface AnnotationContextMenuProps {
  annotation: Annotation;
  position: { x: number; y: number };
  onEdit: (annotation: Annotation) => void;
  onChangeColor: (annotation: Annotation, color: string) => void;
  onDelete: (annotation: Annotation) => void;
  onQuote?: (annotation: Annotation) => void;
  onClose: () => void;
}

const COLORS = [
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Green', value: '#C5E1A5' },
  { name: 'Blue', value: '#90CAF9' },
  { name: 'Red', value: '#EF5350' },
  { name: 'Purple', value: '#CE93D8' },
];

export function AnnotationContextMenu({
  annotation,
  position,
  onEdit,
  onChangeColor,
  onDelete,
  onQuote,
  onClose,
}: AnnotationContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleEdit = () => {
    onEdit(annotation);
    onClose();
  };

  const handleChangeColor = (color: string) => {
    onChangeColor(annotation, color);
    onClose();
  };

  const handleDelete = () => {
    onDelete(annotation);
    onClose();
  };

  const handleQuote = () => {
    if (onQuote) {
      onQuote(annotation);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="annotation-context-menu fixed bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      data-testid="annotation-context-menu"
    >
      {/* Edit Note */}
      <button
        onClick={handleEdit}
        className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
        data-testid="menu-edit"
      >
        <span>✏️</span>
        <span>Edit Note</span>
      </button>

      {/* Change Color (only for highlights and areas) */}
      {(annotation.type === 'highlight' || annotation.type === 'area') && (
        <>
          <div className="border-t border-gray-600 my-1" />
          <div className="px-4 py-1 text-xs text-gray-400 uppercase">Change Color</div>
          <div className="px-2 py-1">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleChangeColor(color.value)}
                className={`w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded flex items-center gap-2 ${
                  annotation.color === color.value ? 'bg-gray-700' : ''
                }`}
                data-testid={`menu-color-${color.value}`}
              >
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color.value }}
                />
                <span>{color.name}</span>
                {annotation.color === color.value && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Quote in Note (only if annotation has text) */}
      {annotation.text && onQuote && (
        <>
          <div className="border-t border-gray-600 my-1" />
          <button
            onClick={handleQuote}
            className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            data-testid="menu-quote"
          >
            <span>📝</span>
            <span>Quote in Note...</span>
          </button>
        </>
      )}

      {/* Delete */}
      <div className="border-t border-gray-600 my-1" />
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
        data-testid="menu-delete"
      >
        <span>🗑️</span>
        <span>Delete</span>
      </button>
    </div>
  );
}

/**
 * Note Edit Dialog
 * Simple modal for editing annotation notes
 */
export interface NoteEditDialogProps {
  annotation: Annotation;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function NoteEditDialog({
  annotation,
  onSave,
  onCancel,
}: NoteEditDialogProps): JSX.Element {
  const [text, setText] = React.useState(annotation.note || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    onSave(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="note-edit-dialog fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
      data-testid="note-edit-dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          {annotation.type === 'note' ? 'Edit Note' : 'Add Note'}
        </h2>

        {/* Show annotation text if it's a highlight */}
        {annotation.text && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Highlighted Text:</div>
            <div className="text-sm text-gray-300 bg-gray-700 p-2 rounded italic">
              "{annotation.text.substring(0, 200)}
              {annotation.text.length > 200 && '..."'}
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-700 text-gray-200 border border-gray-600 rounded px-3 py-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your note here..."
          data-testid="note-textarea"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm"
            data-testid="note-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
            data-testid="note-save"
          >
            Save (Ctrl+Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
