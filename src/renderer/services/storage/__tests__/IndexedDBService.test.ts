/**
 * Tests for IndexedDBService
 */

import { IndexedDBService } from '../IndexedDBService';

// Mock idb
jest.mock('idb', () => ({
  openDB: jest.fn(() =>
    Promise.resolve({
      put: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(() => Promise.resolve([])),
      getAllFromIndex: jest.fn(() => Promise.resolve([])),
      delete: jest.fn(),
      clear: jest.fn(),
      close: jest.fn(),
    })
  ),
}));

describe('IndexedDBService', () => {
  let service: IndexedDBService;

  beforeEach(async () => {
    service = new IndexedDBService();
    await service.init();
  });

  afterEach(async () => {
    await service.close();
  });

  it('should initialize successfully', async () => {
    expect(service).toBeDefined();
  });

  it('should get all files', async () => {
    const files = await service.getAllFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  it('should get stats', async () => {
    const stats = await service.getStats();
    expect(stats).toHaveProperty('totalFiles');
    expect(stats).toHaveProperty('dirtyFiles');
    expect(stats).toHaveProperty('totalSize');
    expect(stats).toHaveProperty('lastSyncTime');
  });

  // Note: Full IndexedDB testing requires integration tests with a real browser environment
  // These are unit tests for the service structure
});
