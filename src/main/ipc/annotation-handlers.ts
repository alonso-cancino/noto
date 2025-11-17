import { ipcMain } from 'electron';
import { localStorage } from '../services/LocalStorage';
import type { Annotation, AnnotationFile } from '../../shared/types';
import path from 'path';

/**
 * Register IPC handlers for PDF annotation operations
 */
export function registerAnnotationHandlers() {
  // Get annotation file path
  function getAnnotationPath(pdfPath: string): string {
    const dir = path.dirname(pdfPath);
    const basename = path.basename(pdfPath);
    return path.join(dir, `.${basename}.annotations.json`);
  }

  // Get all annotations for a PDF
  ipcMain.handle(
    'pdf:getAnnotations',
    async (_event, pdfPath: string): Promise<Annotation[]> => {
      try {
        const annotationPath = getAnnotationPath(pdfPath);
        const content = await localStorage.readFile(annotationPath);
        const file = JSON.parse(content) as AnnotationFile;
        return file.annotations || [];
      } catch (error) {
        // File doesn't exist yet - return empty array
        return [];
      }
    }
  );

  // Add a new annotation
  ipcMain.handle(
    'pdf:addAnnotation',
    async (_event, pdfPath: string, annotation: Annotation): Promise<void> => {
      try {
        const annotationPath = getAnnotationPath(pdfPath);

        let file: AnnotationFile;
        try {
          const content = await localStorage.readFile(annotationPath);
          file = JSON.parse(content) as AnnotationFile;
        } catch {
          // File doesn't exist - create new
          file = {
            version: 1,
            pdfPath,
            annotations: [],
          };
        }

        file.annotations.push(annotation);
        await localStorage.writeFile(annotationPath, JSON.stringify(file, null, 2));
      } catch (error) {
        console.error('Error adding annotation:', error);
        throw error;
      }
    }
  );

  // Update an existing annotation
  ipcMain.handle(
    'pdf:updateAnnotation',
    async (_event, pdfPath: string, annotation: Annotation): Promise<void> => {
      try {
        const annotationPath = getAnnotationPath(pdfPath);
        const content = await localStorage.readFile(annotationPath);
        const file = JSON.parse(content) as AnnotationFile;

        const index = file.annotations.findIndex((a) => a.id === annotation.id);
        if (index === -1) {
          throw new Error('Annotation not found');
        }

        file.annotations[index] = annotation;
        await localStorage.writeFile(annotationPath, JSON.stringify(file, null, 2));
      } catch (error) {
        console.error('Error updating annotation:', error);
        throw error;
      }
    }
  );

  // Delete an annotation
  ipcMain.handle(
    'pdf:deleteAnnotation',
    async (_event, pdfPath: string, annotationId: string): Promise<void> => {
      try {
        const annotationPath = getAnnotationPath(pdfPath);
        const content = await localStorage.readFile(annotationPath);
        const file = JSON.parse(content) as AnnotationFile;

        file.annotations = file.annotations.filter((a) => a.id !== annotationId);
        await localStorage.writeFile(annotationPath, JSON.stringify(file, null, 2));
      } catch (error) {
        console.error('Error deleting annotation:', error);
        throw error;
      }
    }
  );

  console.log('✓ Annotation IPC handlers registered');
}
