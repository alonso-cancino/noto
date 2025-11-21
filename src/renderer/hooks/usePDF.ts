import { useState, useEffect, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { UsePDFReturn } from '../components/PDFViewer/types';

// Configure PDF.js worker
// Use CDN worker for reliability in both dev and production
if (GlobalWorkerOptions) {
  GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`;
}

export function usePDF(initialFilePath?: string): UsePDFReturn {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  const loadPDF = useCallback(async (filePath: string) => {
    setLoading(true);
    setError(null);

    try {
      // Read file as binary via IPC
      const fileBuffer = await window.api['file:read-binary'](filePath);

      // Convert ArrayBuffer to Uint8Array
      const uint8Array = new Uint8Array(fileBuffer);

      // Load PDF document
      const loadingTask = getDocument({ data: uint8Array });
      const pdfDocument = await loadingTask.promise;

      setPdf(pdfDocument);
      setTotalPages(pdfDocument.numPages);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load PDF';
      setError(errorMessage);
      console.error('PDF loading error:', err);
      setPdf(null);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPage = useCallback(
    async (pageNumber: number): Promise<PDFPageProxy | null> => {
      if (!pdf) {
        return null;
      }

      if (pageNumber < 1 || pageNumber > pdf.numPages) {
        console.warn(`Invalid page number: ${pageNumber}`);
        return null;
      }

      try {
        const page = await pdf.getPage(pageNumber);
        setCurrentPage(pageNumber);
        return page;
      } catch (err) {
        console.error('Error loading page:', err);
        return null;
      }
    },
    [pdf]
  );

  // Load initial file if provided
  useEffect(() => {
    if (initialFilePath) {
      loadPDF(initialFilePath);
    }
  }, [initialFilePath, loadPDF]);

  return {
    pdf,
    loading,
    error,
    currentPage,
    totalPages,
    loadPDF,
    getPage,
  };
}
