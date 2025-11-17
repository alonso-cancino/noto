/**
 * Annotation Toolbar
 * Provides UI for selecting annotation tools and colors
 */

import React from 'react';
import { AnnotationToolType } from './AnnotationTools';

export interface AnnotationToolbarProps {
  currentTool: AnnotationToolType;
  currentColor: string;
  onToolChange: (tool: AnnotationToolType) => void;
  onColorChange: (color: string) => void;
}

const COLORS = [
  { name: 'Yellow', value: '#FFEB3B', label: '🟨' },
  { name: 'Green', value: '#C5E1A5', label: '🟩' },
  { name: 'Blue', value: '#90CAF9', label: '🟦' },
  { name: 'Red', value: '#EF5350', label: '🟥' },
  { name: 'Purple', value: '#CE93D8', label: '🟪' },
];

export function AnnotationToolbar({
  currentTool,
  currentColor,
  onToolChange,
  onColorChange,
}: AnnotationToolbarProps): JSX.Element {
  const toolButtonClass = (toolType: AnnotationToolType) =>
    `px-3 py-2 rounded text-sm font-medium transition-colors ${
      currentTool === toolType
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
    }`;

  return (
    <div className="annotation-toolbar flex items-center gap-2 bg-gray-800 px-4 py-2 border-t border-gray-700">
      {/* Tool Selection */}
      <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
        <span className="text-xs text-gray-400 mr-2">Tools:</span>
        <button
          onClick={() => onToolChange('none')}
          className={toolButtonClass('none')}
          title="Select/Pan (Escape)"
          data-testid="tool-none"
        >
          👆 Select
        </button>
        <button
          onClick={() => onToolChange('highlight')}
          className={toolButtonClass('highlight')}
          title="Highlight Text (H)"
          data-testid="tool-highlight"
        >
          🖍️ Highlight
        </button>
        <button
          onClick={() => onToolChange('note')}
          className={toolButtonClass('note')}
          title="Add Note (N)"
          data-testid="tool-note"
        >
          📝 Note
        </button>
        <button
          onClick={() => onToolChange('area')}
          className={toolButtonClass('area')}
          title="Select Area (A)"
          data-testid="tool-area"
        >
          ▢ Area
        </button>
      </div>

      {/* Color Selection */}
      {(currentTool === 'highlight' || currentTool === 'area') && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 mr-2">Color:</span>
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-transform ${
                currentColor === color.value
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110'
                  : 'hover:scale-105'
              }`}
              title={color.name}
              data-testid={`color-${color.value}`}
              aria-label={`Select ${color.name}`}
            >
              {color.label}
            </button>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="flex-1 text-xs text-gray-400 text-right">
        {currentTool === 'highlight' && 'Click and drag to highlight text'}
        {currentTool === 'note' && 'Click to add a note'}
        {currentTool === 'area' && 'Click and drag to select an area'}
        {currentTool === 'none' && 'Click annotations to view or edit'}
      </div>
    </div>
  );
}
