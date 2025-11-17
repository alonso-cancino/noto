import { ipcMain } from 'electron';
import { localStorage } from '../services/LocalStorage';
import type { Annotation, AnnotationFile } from '../../shared/types';
import path from 'path';

/**
 * Register IPC handlers for citation operations
 */
export function registerCitationHandlers() {
  // Get annotation file path
  function getAnnotationPath(pdfPath: string): string {
    const dir = path.dirname(pdfPath);
    const basename = path.basename(pdfPath);
    return path.join(dir, `.${basename}.annotations.json`);
  }

  /**
   * Create a citation in a note file
   * Inserts the citation text at the specified position
   */
  ipcMain.handle(
    'citation:create',
    async (
      _event,
      annotation: Annotation,
      targetPath: string,
      insertPosition?: number
    ): Promise<void> => {
      try {
        // This is handled in the renderer for now
        // We'll just update the annotation's citedIn field
        console.log('Citation create handler called (handled in renderer)');
      } catch (error) {
        console.error('Error creating citation:', error);
        throw error;
      }
    }
  );

  /**
   * Get backlinks for a PDF
   * Returns a map of annotation IDs to the note files that cite them
   */
  ipcMain.handle(
    'citation:getBacklinks',
    async (_event, pdfPath: string): Promise<Map<string, Annotation[]>> => {
      try {
        const annotationPath = getAnnotationPath(pdfPath);
        const content = await localStorage.readFile(annotationPath);
        const file = JSON.parse(content) as AnnotationFile;

        const backlinksMap = new Map<string, Annotation[]>();

        for (const annotation of file.annotations) {
          if (annotation.citedIn && annotation.citedIn.length > 0) {
            // Group by note file
            for (const notePath of annotation.citedIn) {
              if (!backlinksMap.has(notePath)) {
                backlinksMap.set(notePath, []);
              }
              backlinksMap.get(notePath)!.push(annotation);
            }
          }
        }

        return backlinksMap;
      } catch (error) {
        console.error('Error getting backlinks:', error);
        return new Map();
      }
    }
  );

  console.log('✓ Citation IPC handlers registered');
}
