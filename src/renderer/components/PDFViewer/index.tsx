import React, { useState, useEffect } from 'react';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { usePDF } from '../../hooks/usePDF';
import { PDFCanvas } from './PDFCanvas';
import { PageNavigation } from './PageNavigation';
import { ZoomControls } from './ZoomControls';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { SearchBar } from './SearchBar';
import { PDFViewerProps } from './types';

export function PDFViewer({
  filePath,
  citationTarget,
  onError,
}: PDFViewerProps): JSX.Element {
  const { pdf, loading, error, currentPage, totalPages, getPage } =
    usePDF(filePath);
  const [currentPageProxy, setCurrentPageProxy] = useState<PDFPageProxy | null>(
    null
  );
  const [scale, setScale] = useState<number>(1.0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [highlightedAnnotation, setHighlightedAnnotation] = useState<
    string | null
  >(null);

  // Handle citation target when provided
  useEffect(() => {
    if (citationTarget && pdf) {
      console.log('Navigating to citation target:', citationTarget);
      // Navigate to the specified page
      handlePageChange(citationTarget.page);

      // Set the highlighted annotation if provided
      if (citationTarget.annotationId) {
        setHighlightedAnnotation(citationTarget.annotationId);
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedAnnotation(null), 3000);
      }
    }
  }, [citationTarget, pdf]);

  // Load page when PDF is ready or page changes
  useEffect(() => {
    if (pdf && currentPage > 0) {
      getPage(currentPage).then((page) => {
        setCurrentPageProxy(page);
      });
    }
  }, [pdf, currentPage, getPage]);

  const handlePageChange = (pageNumber: number) => {
    getPage(pageNumber).then((page) => {
      if (page) {
        setCurrentPageProxy(page);
      }
    });
  };

  // Call error callback if provided
  useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          <div className="font-semibold mb-2">Error loading PDF</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!pdf || !currentPageProxy) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No PDF loaded</div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer flex flex-col h-full bg-gray-100">
      {/* Toolbar with Page Navigation and Zoom Controls */}
      <div className="flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white ml-2"
            title="Toggle thumbnails"
          >
            {showThumbnails ? '◀' : '▶'} Pages
          </button>
          <PageNavigation
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
            title="Search in PDF"
          >
            🔍 Search
          </button>
          <ZoomControls scale={scale} onScaleChange={setScale} />
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <SearchBar pdf={pdf} onResultSelect={handlePageChange} />
      )}

      {/* Main Content Area with Thumbnails and PDF */}
      <div className="flex flex-1 overflow-hidden">
        {/* Thumbnail Sidebar */}
        {showThumbnails && (
          <ThumbnailSidebar
            pdf={pdf}
            currentPage={currentPage}
            onPageSelect={handlePageChange}
          />
        )}

        {/* PDF Content */}
        <div className="pdf-viewer-content flex-1 overflow-auto p-4">
          <div className="flex justify-center">
            <PDFCanvas page={currentPageProxy} scale={scale} />
          </div>
        </div>
      </div>
    </div>
  );
}
