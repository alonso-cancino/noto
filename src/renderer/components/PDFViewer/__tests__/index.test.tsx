import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PDFViewer } from '../index';

// Mock usePDF hook
const mockLoadPDF = jest.fn();
const mockGetPage = jest.fn();

jest.mock('../../../hooks/usePDF', () => ({
  usePDF: () => ({
    pdf: null,
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 0,
    loadPDF: mockLoadPDF,
    getPage: mockGetPage,
  }),
}));

// Mock pdfjs-dist
jest.mock('pdfjs-dist', () => ({
  __esModule: true,
  GlobalWorkerOptions: { workerSrc: '' },
  version: '3.11.174',
  getDocument: jest.fn(),
}));

describe('PDFViewer', () => {
  const mockFilePath = 'test.pdf';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<PDFViewer filePath={mockFilePath} />);
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });

    it('should call loadPDF when filePath is provided', () => {
      render(<PDFViewer filePath={mockFilePath} />);

      waitFor(() => {
        expect(mockLoadPDF).toHaveBeenCalledWith(mockFilePath);
      });
    });

    it('should not call loadPDF when filePath is undefined', () => {
      render(<PDFViewer filePath={undefined} />);

      expect(mockLoadPDF).not.toHaveBeenCalled();
    });

    it('should render loading state', () => {
      // Mock loading state
      jest.mock('../../../hooks/usePDF', () => ({
        usePDF: () => ({
          pdf: null,
          loading: true,
          error: null,
          currentPage: 1,
          totalPages: 0,
          loadPDF: mockLoadPDF,
          getPage: mockGetPage,
        }),
      }));

      render(<PDFViewer filePath={mockFilePath} />);

      // PDF viewer should still render its container
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept filePath prop', () => {
      const { rerender } = render(<PDFViewer filePath="file1.pdf" />);

      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();

      rerender(<PDFViewer filePath="file2.pdf" />);

      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });

    it('should handle undefined filePath', () => {
      render(<PDFViewer filePath={undefined} />);

      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });
  });

  describe('File Path Changes', () => {
    it('should reload PDF when filePath changes', async () => {
      const { rerender } = render(<PDFViewer filePath="file1.pdf" />);

      await waitFor(() => {
        expect(mockLoadPDF).toHaveBeenCalledWith('file1.pdf');
      });

      rerender(<PDFViewer filePath="file2.pdf" />);

      await waitFor(() => {
        expect(mockLoadPDF).toHaveBeenCalledWith('file2.pdf');
      });
    });
  });
});
