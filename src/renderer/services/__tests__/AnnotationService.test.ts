/**
 * Tests for Annotation Storage Service
 */

import { annotationService } from '../AnnotationService';
import { Annotation, AnnotationFile } from '../../../shared/types';

// Mock the window.api
const mockFileRead = jest.fn();
const mockFileWrite = jest.fn();

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  annotationService.clearAllCache();

  // Set up window.api methods
  Object.defineProperty(global, 'window', {
    value: {
      api: {
        'file:read': mockFileRead,
        'file:write': mockFileWrite,
      },
    },
    writable: true,
  });
});

describe('AnnotationService', () => {
  const testPdfPath = 'test/document.pdf';
  const testAnnotation: Annotation = {
    id: 'test-id-123',
    type: 'highlight',
    pageNumber: 1,
    bounds: { x: 10, y: 20, width: 50, height: 5 },
    color: '#FFEB3B',
    opacity: 0.4,
    text: 'Test highlight text',
    createdAt: '2025-01-17T12:00:00.000Z',
    modifiedAt: '2025-01-17T12:00:00.000Z',
  };

  describe('getAnnotations', () => {
    it('should return empty array if annotation file does not exist', async () => {
      mockFileRead.mockRejectedValue(new Error('File not found'));

      const result = await annotationService.getAnnotations(testPdfPath);

      expect(result).toEqual([]);
      expect(mockFileRead).toHaveBeenCalledWith(
        'test/.document.pdf.annotations.json'
      );
    });

    it('should return annotations from file', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [testAnnotation],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));

      const result = await annotationService.getAnnotations(testPdfPath);

      expect(result).toEqual([testAnnotation]);
    });

    it('should use cache on subsequent calls', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [testAnnotation],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));

      // First call
      await annotationService.getAnnotations(testPdfPath);
      // Second call
      await annotationService.getAnnotations(testPdfPath);

      // Should only read file once
      expect(mockFileRead).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAnnotation', () => {
    it('should return null if annotation not found', async () => {
      mockFileRead.mockRejectedValue(new Error('File not found'));

      const result = await annotationService.getAnnotation(
        testPdfPath,
        'non-existent-id'
      );

      expect(result).toBeNull();
    });

    it('should return specific annotation by ID', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [
          testAnnotation,
          { ...testAnnotation, id: 'other-id', pageNumber: 2 },
        ],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));

      const result = await annotationService.getAnnotation(
        testPdfPath,
        'test-id-123'
      );

      expect(result).toEqual(testAnnotation);
    });
  });

  describe('addAnnotation', () => {
    it('should create new annotation file and add annotation', async () => {
      mockFileRead.mockRejectedValue(new Error('File not found'));
      mockFileWrite.mockResolvedValue(undefined);

      await annotationService.addAnnotation(testPdfPath, testAnnotation);

      expect(mockFileWrite).toHaveBeenCalledWith(
        'test/.document.pdf.annotations.json',
        expect.stringContaining('test-id-123')
      );

      // Verify the written content
      const writtenContent = JSON.parse(mockFileWrite.mock.calls[0][1]);
      expect(writtenContent.annotations).toEqual([testAnnotation]);
    });

    it('should add annotation to existing file', async () => {
      const existingAnnotation: Annotation = {
        ...testAnnotation,
        id: 'existing-id',
      };
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [existingAnnotation],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));
      mockFileWrite.mockResolvedValue(undefined);

      const newAnnotation: Annotation = {
        ...testAnnotation,
        id: 'new-id',
      };
      await annotationService.addAnnotation(testPdfPath, newAnnotation);

      const writtenContent = JSON.parse(mockFileWrite.mock.calls[0][1]);
      expect(writtenContent.annotations).toHaveLength(2);
      expect(writtenContent.annotations[0]).toEqual(existingAnnotation);
      expect(writtenContent.annotations[1]).toEqual(newAnnotation);
    });
  });

  describe('updateAnnotation', () => {
    it('should throw error if file does not exist', async () => {
      mockFileRead.mockRejectedValue(new Error('File not found'));

      await expect(
        annotationService.updateAnnotation(testPdfPath, testAnnotation)
      ).rejects.toThrow('Annotation file not found');
    });

    it('should throw error if annotation not found', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));
      mockFileWrite.mockResolvedValue(undefined);

      await expect(
        annotationService.updateAnnotation(testPdfPath, testAnnotation)
      ).rejects.toThrow('Annotation not found');
    });

    it('should update existing annotation', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [testAnnotation],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));
      mockFileWrite.mockResolvedValue(undefined);

      const updatedAnnotation: Annotation = {
        ...testAnnotation,
        note: 'Updated note',
      };

      await annotationService.updateAnnotation(testPdfPath, updatedAnnotation);

      const writtenContent = JSON.parse(mockFileWrite.mock.calls[0][1]);
      expect(writtenContent.annotations[0].note).toBe('Updated note');
      // Should update modifiedAt timestamp
      expect(writtenContent.annotations[0].modifiedAt).not.toBe(
        testAnnotation.modifiedAt
      );
    });
  });

  describe('deleteAnnotation', () => {
    it('should do nothing if file does not exist', async () => {
      mockFileRead.mockRejectedValue(new Error('File not found'));

      await annotationService.deleteAnnotation(testPdfPath, 'test-id');

      expect(mockFileWrite).not.toHaveBeenCalled();
    });

    it('should remove annotation from file', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [
          testAnnotation,
          { ...testAnnotation, id: 'other-id' },
        ],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));
      mockFileWrite.mockResolvedValue(undefined);

      await annotationService.deleteAnnotation(testPdfPath, 'test-id-123');

      const writtenContent = JSON.parse(mockFileWrite.mock.calls[0][1]);
      expect(writtenContent.annotations).toHaveLength(1);
      expect(writtenContent.annotations[0].id).toBe('other-id');
    });
  });

  describe('getAnnotationsByPage', () => {
    it('should group annotations by page number', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [
          { ...testAnnotation, id: 'page1-1', pageNumber: 1, bounds: { x: 0, y: 10, width: 10, height: 10 } },
          { ...testAnnotation, id: 'page1-2', pageNumber: 1, bounds: { x: 0, y: 5, width: 10, height: 10 } },
          { ...testAnnotation, id: 'page2-1', pageNumber: 2, bounds: { x: 0, y: 0, width: 10, height: 10 } },
        ],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));

      const result = await annotationService.getAnnotationsByPage(testPdfPath);

      expect(result.size).toBe(2);
      expect(result.get(1)).toHaveLength(2);
      expect(result.get(2)).toHaveLength(1);

      // Should be sorted by y position (ascending)
      const page1Annotations = result.get(1)!;
      expect(page1Annotations[0].id).toBe('page1-2'); // y: 5
      expect(page1Annotations[1].id).toBe('page1-1'); // y: 10
    });
  });

  describe('cache management', () => {
    it('should clear cache for specific PDF', async () => {
      const mockFile: AnnotationFile = {
        version: 1,
        pdfPath: testPdfPath,
        annotations: [testAnnotation],
      };
      mockFileRead.mockResolvedValue(JSON.stringify(mockFile));

      // Load annotations (caches them)
      await annotationService.getAnnotations(testPdfPath);
      expect(mockFileRead).toHaveBeenCalledTimes(1);

      // Clear cache
      annotationService.clearCache(testPdfPath);

      // Load again (should read file again)
      await annotationService.getAnnotations(testPdfPath);
      expect(mockFileRead).toHaveBeenCalledTimes(2);
    });
  });
});
