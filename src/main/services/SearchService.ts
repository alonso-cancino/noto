/**
 * SearchService - Full-text search indexing and querying
 *
 * Features:
 * - Indexes markdown and PDF files
 * - Fuzzy search with relevance scoring
 * - Incremental indexing on file changes
 * - Context snippets with match highlighting
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { SearchResult, SearchMatch, FileType, Annotation } from '../../shared/types';

interface IndexEntry {
  filePath: string;
  fileName: string;
  type: FileType;
  content: string;
  lines: string[];
  modifiedTime: number;
}

export class SearchService {
  private index: Map<string, IndexEntry> = new Map();
  private workspaceRoot: string;
  private isIndexing = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Index all files in the workspace
   */
  async indexWorkspace(): Promise<void> {
    if (this.isIndexing) {
      console.log('Indexing already in progress');
      return;
    }

    this.isIndexing = true;
    console.log('Starting workspace indexing...');

    try {
      await this.indexDirectory(this.workspaceRoot);
      console.log(`Indexing complete. ${this.index.size} files indexed.`);
    } catch (error) {
      console.error('Error during indexing:', error);
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Index a specific file
   */
  async indexFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.workspaceRoot, filePath);
      const stats = await fs.stat(fullPath);

      if (!stats.isFile()) {
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.md' && ext !== '.pdf') {
        return;
      }

      let content = '';
      let type: FileType = 'markdown';

      if (ext === '.md') {
        content = await fs.readFile(fullPath, 'utf-8');
        type = 'markdown';
      } else if (ext === '.pdf') {
        // For PDFs, we'll index the annotation file if it exists
        const annotationPath = fullPath + '.annotations.json';
        try {
          const annotationData = await fs.readFile(annotationPath, 'utf-8');
          const annotationFile = JSON.parse(annotationData);

          // Extract text from annotations and notes
          content = annotationFile.annotations
            .map((ann: Annotation) => {
              const parts = [];
              if (ann.text) parts.push(ann.text);
              if (ann.note) parts.push(ann.note);
              return parts.join(' ');
            })
            .join('\n');
        } catch {
          // No annotations file, skip this PDF
          content = '';
        }
        type = 'pdf';
      }

      const lines = content.split('\n');
      const entry: IndexEntry = {
        filePath,
        fileName: path.basename(filePath),
        type,
        content,
        lines,
        modifiedTime: stats.mtimeMs,
      };

      this.index.set(filePath, entry);
    } catch (error) {
      console.error(`Error indexing file ${filePath}:`, error);
    }
  }

  /**
   * Remove a file from the index
   */
  removeFile(filePath: string): void {
    this.index.delete(filePath);
  }

  /**
   * Search for a query string in indexed files
   */
  search(query: string, maxResults: number = 50): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    const results: SearchResult[] = [];

    for (const entry of this.index.values()) {
      const matches = this.findMatches(entry, queryLower, queryWords);

      if (matches.length > 0) {
        const score = this.calculateScore(entry, queryLower, queryWords, matches);
        results.push({
          filePath: entry.filePath,
          fileName: entry.fileName,
          type: entry.type,
          matches,
          score,
        });
      }
    }

    // Sort by score (descending) and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  /**
   * Get current index size
   */
  getIndexSize(): number {
    return this.index.size;
  }

  /**
   * Clear the entire index
   */
  clearIndex(): void {
    this.index.clear();
  }

  // Private helper methods

  private async indexDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files and annotation files
        if (entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.workspaceRoot, fullPath);

        if (entry.isDirectory()) {
          await this.indexDirectory(fullPath);
        } else if (entry.isFile()) {
          await this.indexFile(relativePath);
        }
      }
    } catch (error) {
      console.error(`Error indexing directory ${dirPath}:`, error);
    }
  }

  private findMatches(
    entry: IndexEntry,
    queryLower: string,
    queryWords: string[]
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const maxMatches = 10; // Limit matches per file

    for (let i = 0; i < entry.lines.length && matches.length < maxMatches; i++) {
      const line = entry.lines[i];
      const lineLower = line.toLowerCase();

      // Check if this line contains any query words
      const hasMatch = queryWords.some(word => lineLower.includes(word));

      if (hasMatch) {
        // Find the position of the first matching word for highlighting
        let highlightStart = -1;
        let highlightEnd = -1;

        for (const word of queryWords) {
          const index = lineLower.indexOf(word);
          if (index !== -1) {
            if (highlightStart === -1 || index < highlightStart) {
              highlightStart = index;
              highlightEnd = index + word.length;
            }
          }
        }

        // Trim the line if it's too long (keep context around match)
        let displayText = line;
        if (line.length > 200) {
          const contextRadius = 100;
          const start = Math.max(0, highlightStart - contextRadius);
          const end = Math.min(line.length, highlightEnd + contextRadius);
          displayText = (start > 0 ? '...' : '') +
                       line.substring(start, end) +
                       (end < line.length ? '...' : '');

          // Adjust highlight positions for trimmed text
          if (start > 0) {
            highlightStart = highlightStart - start + 3; // account for '...'
            highlightEnd = highlightEnd - start + 3;
          }
        }

        matches.push({
          line: i + 1, // 1-indexed line numbers
          text: displayText,
          highlight: [highlightStart, highlightEnd],
        });
      }
    }

    return matches;
  }

  private calculateScore(
    entry: IndexEntry,
    queryLower: string,
    queryWords: string[],
    matches: SearchMatch[]
  ): number {
    let score = 0;
    const contentLower = entry.content.toLowerCase();
    const fileNameLower = entry.fileName.toLowerCase();

    // Exact match in filename (highest priority)
    if (fileNameLower.includes(queryLower)) {
      score += 100;
    }

    // Individual words in filename
    for (const word of queryWords) {
      if (fileNameLower.includes(word)) {
        score += 50;
      }
    }

    // Number of matches (more matches = higher score)
    score += matches.length * 10;

    // Word frequency in content
    for (const word of queryWords) {
      const regex = new RegExp(word, 'gi');
      const occurrences = (contentLower.match(regex) || []).length;
      score += occurrences * 2;
    }

    // Exact phrase match bonus
    if (contentLower.includes(queryLower)) {
      score += 30;
    }

    // File type preference (markdown files slightly higher)
    if (entry.type === 'markdown') {
      score += 5;
    }

    return score;
  }
}
