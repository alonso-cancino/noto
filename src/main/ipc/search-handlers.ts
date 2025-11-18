/**
 * IPC handlers for search operations
 */

import { ipcMain } from 'electron';
import { SearchService } from '../services/SearchService';
import type { SearchResult } from '../../shared/types';

let searchService: SearchService | null = null;

/**
 * Initialize search service with workspace root
 */
export function initializeSearchService(workspaceRoot: string): void {
  searchService = new SearchService(workspaceRoot);

  // Start initial indexing in the background
  searchService.indexWorkspace().catch(error => {
    console.error('Failed to index workspace:', error);
  });
}

/**
 * Register all search-related IPC handlers
 */
export function registerSearchHandlers(): void {
  // Search query handler
  ipcMain.handle('search:query', async (_event, query: string): Promise<SearchResult[]> => {
    if (!searchService) {
      console.error('Search service not initialized');
      return [];
    }

    try {
      return searchService.search(query);
    } catch (error) {
      console.error('Search query failed:', error);
      return [];
    }
  });

  // Index file handler (for incremental updates)
  ipcMain.handle('search:index', async (_event, filePath: string): Promise<void> => {
    if (!searchService) {
      console.error('Search service not initialized');
      return;
    }

    try {
      await searchService.indexFile(filePath);
    } catch (error) {
      console.error('Failed to index file:', error);
      throw error;
    }
  });

  console.log('✓ Search handlers registered');
}

/**
 * Get the search service instance (for internal use)
 */
export function getSearchService(): SearchService | null {
  return searchService;
}
