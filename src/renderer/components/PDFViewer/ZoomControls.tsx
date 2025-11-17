import React from 'react';

interface ZoomControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
}

const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export function ZoomControls({ scale, onScaleChange }: ZoomControlsProps): JSX.Element {
  const handleZoomIn = () => {
    const nextLevel = ZOOM_LEVELS.find((level) => level > scale);
    if (nextLevel) {
      onScaleChange(nextLevel);
    }
  };

  const handleZoomOut = () => {
    const prevLevel = [...ZOOM_LEVELS].reverse().find((level) => level < scale);
    if (prevLevel) {
      onScaleChange(prevLevel);
    }
  };

  const handleReset = () => {
    onScaleChange(1.0);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2">
      <button
        onClick={handleZoomOut}
        disabled={scale <= ZOOM_LEVELS[0]}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
        title="Zoom out"
      >
        −
      </button>

      <button
        onClick={handleReset}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm min-w-[60px]"
        title="Reset zoom"
      >
        {Math.round(scale * 100)}%
      </button>

      <button
        onClick={handleZoomIn}
        disabled={scale >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}
