import React, { useState, useEffect, useCallback } from 'react';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onPageChange,
}: PageNavigationProps): JSX.Element {
  const [inputValue, setInputValue] = useState<string>(currentPage.toString());

  // Update input when currentPage changes externally
  useEffect(() => {
    setInputValue(currentPage.toString());
  }, [currentPage]);

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const pageNum = parseInt(inputValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      // Reset to current page if invalid
      setInputValue(currentPage.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(currentPage.toString());
      (e.target as HTMLInputElement).blur();
    }
  };

  // Keyboard shortcuts for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]); // Re-bind when handlers change

  return (
    <div className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2">
      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage <= 1}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
        title="Previous page (← or ↑)"
        aria-label="Previous page"
      >
        ←
      </button>

      {/* Page input and display */}
      <div className="flex items-center gap-2">
        <span className="text-sm">Page</span>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-12 px-2 py-1 bg-gray-700 text-white text-center rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Current page number"
        />
        <span className="text-sm text-gray-400">of {totalPages}</span>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
        title="Next page (→ or ↓)"
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}
