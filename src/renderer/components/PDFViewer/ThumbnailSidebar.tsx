import React, { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

interface ThumbnailProps {
  page: PDFPageProxy;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}

function Thumbnail({ page, pageNumber, isActive, onClick }: ThumbnailProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!page || !canvasRef.current || rendered) {
        return;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        return;
      }

      // Small scale for thumbnails
      const scale = 0.25;
      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      try {
        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
        setRendered(true);
      } catch (err) {
        console.error('Error rendering thumbnail:', err);
      }
    };

    renderThumbnail();
  }, [page, rendered]);

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full p-2 mb-2 rounded cursor-pointer transition-all
        ${isActive ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'}
      `}
      aria-label={`Go to page ${pageNumber}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-auto border border-gray-600"
      />
      <div className="text-xs text-white mt-1">
        Page {pageNumber}
      </div>
    </button>
  );
}

interface ThumbnailSidebarProps {
  pdf: PDFDocumentProxy | null;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export function ThumbnailSidebar({
  pdf,
  currentPage,
  onPageSelect,
}: ThumbnailSidebarProps): JSX.Element {
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllPages = async () => {
      if (!pdf) {
        return;
      }

      setLoading(true);
      const pagePromises: Promise<PDFPageProxy>[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(pdf.getPage(i));
      }

      try {
        const loadedPages = await Promise.all(pagePromises);
        setPages(loadedPages);
      } catch (err) {
        console.error('Error loading pages for thumbnails:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllPages();
  }, [pdf]);

  if (loading) {
    return (
      <div className="w-48 bg-gray-800 text-white p-4 overflow-y-auto flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading thumbnails...</div>
      </div>
    );
  }

  return (
    <div className="w-48 bg-gray-800 text-white p-2 overflow-y-auto border-r border-gray-700">
      <div className="text-xs text-gray-400 mb-2 px-2">
        Pages ({pages.length})
      </div>
      {pages.map((page, index) => (
        <Thumbnail
          key={index + 1}
          page={page}
          pageNumber={index + 1}
          isActive={currentPage === index + 1}
          onClick={() => onPageSelect(index + 1)}
        />
      ))}
    </div>
  );
}

// Import type for PDFDocumentProxy
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
