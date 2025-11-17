// PDF Viewer Types

import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

export interface PDFViewerProps {
  filePath: string;
  citationTarget?: { page: number; annotationId?: string } | null;
  onError?: (error: Error) => void;
}

export interface PDFCanvasProps {
  page: PDFPageProxy;
  scale: number;
  onRenderComplete?: () => void;
}

export interface PDFState {
  pdf: PDFDocumentProxy | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
}

export interface UsePDFReturn extends PDFState {
  loadPDF: (filePath: string) => Promise<void>;
  getPage: (pageNumber: number) => Promise<PDFPageProxy | null>;
}
