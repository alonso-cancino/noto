/**
 * Annotation Storage Service
 * Handles CRUD operations for PDF annotations
 */

import { Annotation, AnnotationFile } from '../../shared/types';
import path from 'path-browserify';

class AnnotationService {
  private cache = new Map<string, AnnotationFile>();

  /**
   * Get all annotations for a PDF
   */
  async getAnnotations(pdfPath: string): Promise<Annotation[]> {
    const file = await this.getAnnotationFile(pdfPath);
    return file?.annotations || [];
  }

  /**
   * Get a single annotation by ID
   */
  async getAnnotation(
    pdfPath: string,
    id: string
  ): Promise<Annotation | null> {
    const annotations = await this.getAnnotations(pdfPath);
    return annotations.find((a) => a.id === id) || null;
  }

  /**
   * Add a new annotation
   */
  async addAnnotation(
    pdfPath: string,
    annotation: Annotation
  ): Promise<void> {
    const file = await this.getOrCreateAnnotationFile(pdfPath);
    file.annotations.push(annotation);
    await this.saveAnnotationFile(pdfPath, file);
  }

  /**
   * Update an existing annotation
   */
  async updateAnnotation(
    pdfPath: string,
    annotation: Annotation
  ): Promise<void> {
    const file = await this.getAnnotationFile(pdfPath);
    if (!file) throw new Error('Annotation file not found');

    const index = file.annotations.findIndex((a) => a.id === annotation.id);
    if (index === -1) throw new Error('Annotation not found');

    // Update modified timestamp
    annotation.modifiedAt = new Date().toISOString();
    file.annotations[index] = annotation;
    await this.saveAnnotationFile(pdfPath, file);
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(pdfPath: string, id: string): Promise<void> {
    const file = await this.getAnnotationFile(pdfPath);
    if (!file) return;

    file.annotations = file.annotations.filter((a) => a.id !== id);
    await this.saveAnnotationFile(pdfPath, file);
  }

  /**
   * Get annotations grouped by page
   */
  async getAnnotationsByPage(
    pdfPath: string
  ): Promise<Map<number, Annotation[]>> {
    const annotations = await this.getAnnotations(pdfPath);
    const byPage = new Map<number, Annotation[]>();

    for (const annotation of annotations) {
      if (!byPage.has(annotation.pageNumber)) {
        byPage.set(annotation.pageNumber, []);
      }
      byPage.get(annotation.pageNumber)!.push(annotation);
    }

    // Sort each page's annotations by y position
    for (const [, anns] of byPage) {
      anns.sort((a, b) => a.bounds.y - b.bounds.y);
    }

    return byPage;
  }

  /**
   * Clear cache for a PDF
   */
  clearCache(pdfPath: string): void {
    this.cache.delete(pdfPath);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  // Private helper methods

  private async getAnnotationFile(
    pdfPath: string
  ): Promise<AnnotationFile | null> {
    // Check cache first
    if (this.cache.has(pdfPath)) {
      return this.cache.get(pdfPath)!;
    }

    const annotationPath = this.getAnnotationPath(pdfPath);

    try {
      const content = await window.api['file:read'](annotationPath);
      const file = JSON.parse(content) as AnnotationFile;
      this.cache.set(pdfPath, file);
      return file;
    } catch (error) {
      // File doesn't exist yet
      return null;
    }
  }

  private async getOrCreateAnnotationFile(
    pdfPath: string
  ): Promise<AnnotationFile> {
    const existing = await this.getAnnotationFile(pdfPath);

    if (existing) {
      return existing;
    }

    const newFile: AnnotationFile = {
      version: 1,
      pdfPath,
      annotations: [],
    };

    this.cache.set(pdfPath, newFile);
    return newFile;
  }

  private async saveAnnotationFile(
    pdfPath: string,
    file: AnnotationFile
  ): Promise<void> {
    const annotationPath = this.getAnnotationPath(pdfPath);
    const content = JSON.stringify(file, null, 2);

    await window.api['file:write'](annotationPath, content);
    this.cache.set(pdfPath, file);
  }

  private getAnnotationPath(pdfPath: string): string {
    // Get the directory and filename
    const dir = path.dirname(pdfPath);
    const basename = path.basename(pdfPath);

    // Create hidden annotation file: .filename.pdf.annotations.json
    return path.join(dir, `.${basename}.annotations.json`);
  }
}

// Export singleton instance
export const annotationService = new AnnotationService();
