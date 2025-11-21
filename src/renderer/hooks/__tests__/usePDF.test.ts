import { renderHook, waitFor, act } from '@testing-library/react';
import { usePDF } from '../usePDF';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Mock pdfjs-dist
const mockGetDocument = jest.fn();
const mockGetPage = jest.fn();

jest.mock('pdfjs-dist', () => ({
  __esModule: true,
  ...jest.requireActual('pdfjs-dist'),
  getDocument: (config: any) => mockGetDocument(config),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  version: '3.11.174',
}));

// Mock window.api
const mockFileReadBinary = jest.fn();

global.window.api = {
  'file:read-binary': mockFileReadBinary,
} as any;

describe('usePDF', () => {
  const mockPdfPath = 'test.pdf';
  const mockPdfBuffer = new ArrayBuffer(100);
  const mockPdfDocument: Partial<PDFDocumentProxy> = {
    numPages: 5,
    getPage: mockGetPage,
  };
  const mockPage: Partial<PDFPageProxy> = {
    pageNumber: 1,
    getViewport: jest.fn(),
    render: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful mock implementations
    mockFileReadBinary.mockResolvedValue(mockPdfBuffer);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockPdfDocument),
    });
    mockGetPage.mockResolvedValue(mockPage);
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => usePDF());

      expect(result.current.pdf).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(0);
      expect(typeof result.current.loadPDF).toBe('function');
      expect(typeof result.current.getPage).toBe('function');
    });

    it('should not load PDF automatically without initialFilePath', () => {
      renderHook(() => usePDF());

      expect(mockFileReadBinary).not.toHaveBeenCalled();
      expect(mockGetDocument).not.toHaveBeenCalled();
    });

    it('should load PDF automatically when initialFilePath is provided', async () => {
      const { result } = renderHook(() => usePDF(mockPdfPath));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.pdf).toEqual(mockPdfDocument);
        expect(result.current.totalPages).toBe(5);
      });

      expect(mockFileReadBinary).toHaveBeenCalledWith(mockPdfPath);
      expect(mockGetDocument).toHaveBeenCalled();
    });
  });

  describe('loadPDF', () => {
    it('should load PDF successfully', async () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.pdf).toEqual(mockPdfDocument);
        expect(result.current.totalPages).toBe(5);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.error).toBeNull();
      });

      expect(mockFileReadBinary).toHaveBeenCalledWith(mockPdfPath);
      expect(mockGetDocument).toHaveBeenCalledWith({
        data: expect.any(Uint8Array),
      });
    });

    it('should handle file read errors', async () => {
      const error = new Error('Failed to read file');
      mockFileReadBinary.mockRejectedValueOnce(error);

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Failed to read file');
        expect(result.current.pdf).toBeNull();
        expect(result.current.totalPages).toBe(0);
      });
    });

    it('should handle PDF parsing errors', async () => {
      mockGetDocument.mockReturnValueOnce({
        promise: Promise.reject(new Error('Invalid PDF')),
      });

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Invalid PDF');
        expect(result.current.pdf).toBeNull();
        expect(result.current.totalPages).toBe(0);
      });
    });

    it('should handle generic errors', async () => {
      mockFileReadBinary.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Failed to load PDF');
      });
    });

    it('should reset error state when loading new PDF', async () => {
      // First load with error
      mockFileReadBinary.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF('error.pdf');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Second load successfully
      mockFileReadBinary.mockResolvedValueOnce(mockPdfBuffer);

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      // Error should be cleared immediately
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });
    });
  });

  describe('getPage', () => {
    it('should get PDF page successfully', async () => {
      const { result } = renderHook(() => usePDF());

      // First load PDF
      await act(async () => {
        await result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });

      // Then get page
      let page: PDFPageProxy | null = null;
      await act(async () => {
        page = await result.current.getPage(2);
      });

      expect(page).toEqual(mockPage);
      expect(mockGetPage).toHaveBeenCalledWith(2);
      expect(result.current.currentPage).toBe(2);
    });

    it('should return null when PDF is not loaded', async () => {
      const { result } = renderHook(() => usePDF());

      let page: PDFPageProxy | null = null;
      await act(async () => {
        page = await result.current.getPage(1);
      });

      expect(page).toBeNull();
      expect(mockGetPage).not.toHaveBeenCalled();
    });

    it('should return null for invalid page number (too low)', async () => {
      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });

      let page: PDFPageProxy | null = null;
      await act(async () => {
        page = await result.current.getPage(0);
      });

      expect(page).toBeNull();
      expect(mockGetPage).not.toHaveBeenCalled();
    });

    it('should return null for invalid page number (too high)', async () => {
      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });

      let page: PDFPageProxy | null = null;
      await act(async () => {
        page = await result.current.getPage(10);
      });

      expect(page).toBeNull();
      expect(mockGetPage).not.toHaveBeenCalled();
    });

    it('should handle page loading errors', async () => {
      mockGetPage.mockRejectedValueOnce(new Error('Page load error'));

      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });

      let page: PDFPageProxy | null = null;
      await act(async () => {
        page = await result.current.getPage(1);
      });

      expect(page).toBeNull();
    });

    it('should update currentPage when page is loaded successfully', async () => {
      const { result } = renderHook(() => usePDF());

      await act(async () => {
        await result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });

      expect(result.current.currentPage).toBe(1);

      await act(async () => {
        await result.current.getPage(3);
      });

      expect(result.current.currentPage).toBe(3);

      await act(async () => {
        await result.current.getPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });
  });

  describe('Loading State', () => {
    it('should set loading to true when loading PDF', async () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after successful load', async () => {
      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });
    });

    it('should set loading to false after failed load', async () => {
      mockFileReadBinary.mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => usePDF());

      act(() => {
        result.current.loadPDF(mockPdfPath);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Failed');
      });
    });
  });

  describe('Initial File Path', () => {
    it('should reload when initialFilePath changes', async () => {
      const { result, rerender } = renderHook(
        ({ filePath }) => usePDF(filePath),
        { initialProps: { filePath: 'file1.pdf' } }
      );

      await waitFor(() => {
        expect(result.current.pdf).toEqual(mockPdfDocument);
      });

      expect(mockFileReadBinary).toHaveBeenCalledWith('file1.pdf');

      // Change initial file path
      rerender({ filePath: 'file2.pdf' });

      await waitFor(() => {
        expect(mockFileReadBinary).toHaveBeenCalledWith('file2.pdf');
      });
    });
  });
});
