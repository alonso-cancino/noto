import React, { useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

interface SearchResult {
  pageNumber: number;
  text: string;
  index: number;
}

interface SearchBarProps {
  pdf: PDFDocumentProxy | null;
  onResultSelect: (pageNumber: number) => void;
}

export function SearchBar({ pdf, onResultSelect }: SearchBarProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const searchPDF = async () => {
    if (!pdf || !query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    const foundResults: SearchResult[] = [];

    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine all text items into a single string
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        // Find all occurrences in the page
        const lowerQuery = query.toLowerCase();
        const lowerPageText = pageText.toLowerCase();
        let index = 0;

        while ((index = lowerPageText.indexOf(lowerQuery, index)) !== -1) {
          // Get context around the match
          const contextStart = Math.max(0, index - 30);
          const contextEnd = Math.min(pageText.length, index + query.length + 30);
          const context = pageText.substring(contextStart, contextEnd);

          foundResults.push({
            pageNumber: pageNum,
            text: context,
            index: foundResults.length,
          });

          index += query.length;
        }
      }

      setResults(foundResults);
      setCurrentResultIndex(0);
      setShowResults(true);

      // Navigate to first result if found
      if (foundResults.length > 0) {
        onResultSelect(foundResults[0].pageNumber);
      }
    } catch (err) {
      console.error('Error searching PDF:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchPDF();
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setQuery('');
      setResults([]);
    }
  };

  const navigateResults = (direction: 'next' | 'prev') => {
    if (results.length === 0) return;

    let newIndex = currentResultIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % results.length;
    } else {
      newIndex = (currentResultIndex - 1 + results.length) % results.length;
    }

    setCurrentResultIndex(newIndex);
    onResultSelect(results[newIndex].pageNumber);
  };

  return (
    <div className="search-bar relative">
      <div className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in PDF..."
          className="flex-1 px-3 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={searchPDF}
          disabled={searching || !query.trim()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>

        {results.length > 0 && (
          <>
            <div className="text-xs text-gray-400">
              {currentResultIndex + 1} of {results.length}
            </div>
            <button
              onClick={() => navigateResults('prev')}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              title="Previous result"
            >
              ↑
            </button>
            <button
              onClick={() => navigateResults('next')}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              title="Next result"
            >
              ↓
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setQuery('');
                setResults([]);
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              title="Clear search"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-gray-800 text-white max-h-64 overflow-y-auto shadow-lg z-10 border-t border-gray-700">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentResultIndex(index);
                onResultSelect(result.pageNumber);
              }}
              className={`
                w-full text-left px-4 py-2 hover:bg-gray-700 text-sm border-b border-gray-700
                ${index === currentResultIndex ? 'bg-gray-700' : ''}
              `}
            >
              <div className="font-semibold text-xs text-gray-400 mb-1">
                Page {result.pageNumber}
              </div>
              <div className="text-xs truncate">{result.text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
