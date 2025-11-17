/**
 * Citation Service
 * Handles creation and management of citations between notes and PDF annotations
 */

import { Annotation } from '../../shared/types';
import { annotationService } from './AnnotationService';
import path from 'path-browserify';

interface CitationLink {
  text: string; // The citation text (markdown link)
  url: string; // The noto:// URL
  displayText: string; // The link text shown to user
}

class CitationService {
  /**
   * Create a noto:// URL for a PDF citation
   */
  createPdfUrl(pdfPath: string, page: number, annotationId?: string): string {
    const encodedPath = encodeURIComponent(pdfPath);
    let url = `noto://pdf/${encodedPath}#page=${page}`;

    if (annotationId) {
      url += `&annotation=${annotationId}`;
    }

    return url;
  }

  /**
   * Format a citation link for an annotation
   * Returns markdown format: [paper.pdf, p. 42](noto://pdf/path#page=42&annotation=uuid)
   */
  formatCitation(
    pdfPath: string,
    page: number,
    annotationId?: string,
    customText?: string
  ): CitationLink {
    const url = this.createPdfUrl(pdfPath, page, annotationId);
    const fileName = path.basename(pdfPath);
    const displayText = customText || `${fileName}, p. ${page}`;

    return {
      text: `[${displayText}](${url})`,
      url,
      displayText,
    };
  }

  /**
   * Create a full citation block with quoted text and source
   * Returns markdown blockquote format:
   * > "Quoted text from the PDF"
   * > — [paper.pdf, p. 42](noto://pdf/...)
   */
  createQuoteCitation(
    pdfPath: string,
    annotation: Annotation,
    quoteText?: string
  ): string {
    const text = quoteText || annotation.text || '';
    const citation = this.formatCitation(
      pdfPath,
      annotation.pageNumber,
      annotation.id
    );

    // Format as blockquote
    const quotedText = text
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');

    return `${quotedText}\n> — ${citation.text}`;
  }

  /**
   * Update an annotation to track which note file cites it
   */
  async addBacklink(
    pdfPath: string,
    annotationId: string,
    notePath: string
  ): Promise<void> {
    try {
      const annotation = await annotationService.getAnnotation(
        pdfPath,
        annotationId
      );

      if (!annotation) {
        console.error('Annotation not found:', annotationId);
        return;
      }

      // Add notePath to citedIn array if not already present
      const citedIn = annotation.citedIn || [];
      if (!citedIn.includes(notePath)) {
        citedIn.push(notePath);

        const updated: Annotation = {
          ...annotation,
          citedIn,
          modifiedAt: new Date().toISOString(),
        };

        await annotationService.updateAnnotation(pdfPath, updated);
        console.log(`Added backlink from ${notePath} to annotation ${annotationId}`);
      }
    } catch (error) {
      console.error('Failed to add backlink:', error);
      throw error;
    }
  }

  /**
   * Remove a backlink from an annotation
   */
  async removeBacklink(
    pdfPath: string,
    annotationId: string,
    notePath: string
  ): Promise<void> {
    try {
      const annotation = await annotationService.getAnnotation(
        pdfPath,
        annotationId
      );

      if (!annotation) {
        return;
      }

      const citedIn = annotation.citedIn || [];
      const updatedCitedIn = citedIn.filter((path) => path !== notePath);

      if (updatedCitedIn.length !== citedIn.length) {
        const updated: Annotation = {
          ...annotation,
          citedIn: updatedCitedIn,
          modifiedAt: new Date().toISOString(),
        };

        await annotationService.updateAnnotation(pdfPath, updated);
        console.log(`Removed backlink from ${notePath} to annotation ${annotationId}`);
      }
    } catch (error) {
      console.error('Failed to remove backlink:', error);
      throw error;
    }
  }

  /**
   * Get all backlinks for a PDF (all notes that cite any annotation in this PDF)
   */
  async getBacklinksForPdf(pdfPath: string): Promise<Map<string, string[]>> {
    try {
      const annotations = await annotationService.getAnnotations(pdfPath);
      const backlinksMap = new Map<string, string[]>();

      for (const annotation of annotations) {
        if (annotation.citedIn && annotation.citedIn.length > 0) {
          backlinksMap.set(annotation.id, annotation.citedIn);
        }
      }

      return backlinksMap;
    } catch (error) {
      console.error('Failed to get backlinks:', error);
      return new Map();
    }
  }

  /**
   * Get all unique note files that cite this PDF
   */
  async getCitingNotes(pdfPath: string): Promise<string[]> {
    const backlinksMap = await this.getBacklinksForPdf(pdfPath);
    const uniqueNotes = new Set<string>();

    for (const [, notePaths] of backlinksMap) {
      notePaths.forEach((notePath) => uniqueNotes.add(notePath));
    }

    return Array.from(uniqueNotes).sort();
  }

  /**
   * Parse a noto:// URL to extract PDF path, page, and annotation ID
   */
  parseNotoUrl(url: string): {
    pdfPath: string;
    page: number;
    annotationId?: string;
  } | null {
    try {
      // Match noto://pdf/path#page=X&annotation=Y
      const match = url.match(/^noto:\/\/pdf\/([^#]+)#page=(\d+)(?:&annotation=(.+))?$/);

      if (!match) {
        return null;
      }

      return {
        pdfPath: decodeURIComponent(match[1]),
        page: parseInt(match[2], 10),
        annotationId: match[3] ? decodeURIComponent(match[3]) : undefined,
      };
    } catch (error) {
      console.error('Failed to parse noto:// URL:', url, error);
      return null;
    }
  }

  /**
   * Extract all noto:// citations from markdown content
   */
  extractCitations(markdownContent: string): Array<{
    pdfPath: string;
    page: number;
    annotationId?: string;
  }> {
    const citations: Array<{
      pdfPath: string;
      page: number;
      annotationId?: string;
    }> = [];

    // Match markdown links with noto:// URLs
    const linkRegex = /\[([^\]]+)\]\((noto:\/\/[^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(markdownContent)) !== null) {
      const url = match[2];
      const parsed = this.parseNotoUrl(url);

      if (parsed) {
        citations.push(parsed);
      }
    }

    return citations;
  }

  /**
   * Update backlinks when a note file is saved
   * This scans the note content for noto:// citations and updates annotation backlinks
   */
  async updateBacklinksForNote(
    notePath: string,
    noteContent: string
  ): Promise<void> {
    try {
      const citations = this.extractCitations(noteContent);

      // Group citations by PDF
      const citationsByPdf = new Map<string, Set<string>>();

      for (const citation of citations) {
        if (citation.annotationId) {
          if (!citationsByPdf.has(citation.pdfPath)) {
            citationsByPdf.set(citation.pdfPath, new Set());
          }
          citationsByPdf.get(citation.pdfPath)!.add(citation.annotationId);
        }
      }

      // Update backlinks for each PDF
      for (const [pdfPath, annotationIds] of citationsByPdf) {
        for (const annotationId of annotationIds) {
          await this.addBacklink(pdfPath, annotationId, notePath);
        }
      }

      console.log(`Updated backlinks for ${notePath}: ${citations.length} citations found`);
    } catch (error) {
      console.error('Failed to update backlinks for note:', error);
    }
  }
}

// Export singleton instance
export const citationService = new CitationService();
