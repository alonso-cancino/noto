import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PDFViewer } from '../index';

// Mock usePDF hook
const mockLoadPDF = jest.fn();
const mockGetPage = jest.fn();

// Create a mock PDF document
const mockPDF = {
  numPages: 5,
  getPage: jest.fn(),
};

// Create a mock page
const mockPage = {
  getViewport: jest.fn(() => ({
    width: 612,
    height: 792,
    scale: 1,
  })),
  render: jest.fn(() => ({
    promise: Promise.resolve(),
  })),
  getTextContent: jest.fn(() => Promise.resolve({ items: [] })),
};

mockGetPage.mockResolvedValue(mockPage);

jest.mock('../../../hooks/usePDF', () => ({
  usePDF: (filePath: string | undefined) => ({
    pdf: filePath ? mockPDF : null,
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: filePath ? 5 : 0,
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
    it('should render without crashing', async () => {
      render(<PDFViewer filePath={mockFilePath} />);
      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });
    });


    it('should render "No PDF loaded" when no filePath provided', () => {
      render(<PDFViewer filePath={undefined} />);

      expect(screen.getByText('No PDF loaded')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept filePath prop', async () => {
      const { rerender } = render(<PDFViewer filePath="file1.pdf" />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      rerender(<PDFViewer filePath="file2.pdf" />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });
    });

    it('should handle undefined filePath', () => {
      render(<PDFViewer filePath={undefined} />);

      expect(screen.getByText('No PDF loaded')).toBeInTheDocument();
    });
  });

});
