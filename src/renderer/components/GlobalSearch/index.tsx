/**
 * GlobalSearch - Full-text search across all files
 *
 * Features:
 * - Search across markdown and PDF files
 * - Real-time results as you type
 * - Click result to open file
 * - Keyboard navigation
 * - Triggered by Cmd/Ctrl+Shift+F
 */

import React, { useState, useEffect, useRef } from 'react';
import type { SearchResult, FileMetadata } from '../../../shared/types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: FileMetadata) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onFileSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    const searchTimeout = setTimeout(async () => {
      try {
        const searchResults = await window.api['search:query'](query);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };

  // Handle result selection
  const handleResultClick = async (result: SearchResult) => {
    try {
      // Get file metadata
      const files = await window.api['file:list']();
      const file = files.find((f) => f.path === result.filePath);

      if (file) {
        onFileSelect(file);
        onClose();
        setQuery('');
        setResults([]);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
      <div className="bg-vscode-bg border border-vscode-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[70vh] flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-vscode-border">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in all files... (Esc to close)"
            className="w-full px-4 py-2 bg-vscode-input text-vscode-text border border-vscode-border rounded focus:outline-none focus:border-vscode-accent"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching && (
            <div className="p-4 text-vscode-text-secondary text-center">
              Searching...
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="p-4 text-vscode-text-secondary text-center">
              No results found for "{query}"
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="divide-y divide-vscode-border">
              {results.map((result, index) => (
                <div
                  key={result.filePath}
                  onClick={() => handleResultClick(result)}
                  className={`p-4 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-vscode-selection'
                      : 'hover:bg-vscode-hover'
                  }`}
                >
                  {/* File name */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-vscode-text font-medium">
                      {result.fileName}
                    </span>
                    <span className="text-xs text-vscode-text-secondary">
                      {result.type}
                    </span>
                    <span className="text-xs text-vscode-text-secondary ml-auto">
                      {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  {/* File path */}
                  <div className="text-xs text-vscode-text-secondary mb-2">
                    {result.filePath}
                  </div>

                  {/* Matches */}
                  <div className="space-y-1">
                    {result.matches.slice(0, 3).map((match, matchIndex) => (
                      <div
                        key={matchIndex}
                        className="text-sm text-vscode-text-secondary font-mono"
                      >
                        <span className="text-vscode-text-secondary mr-2">
                          L{match.line}:
                        </span>
                        <span>
                          {match.text.substring(0, match.highlight[0])}
                          <span className="bg-yellow-400/30 text-vscode-text">
                            {match.text.substring(match.highlight[0], match.highlight[1])}
                          </span>
                          {match.text.substring(match.highlight[1])}
                        </span>
                      </div>
                    ))}
                    {result.matches.length > 3 && (
                      <div className="text-xs text-vscode-text-secondary italic">
                        +{result.matches.length - 3} more matches
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-vscode-border text-xs text-vscode-text-secondary flex items-center gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
          {results.length > 0 && (
            <span className="ml-auto">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
