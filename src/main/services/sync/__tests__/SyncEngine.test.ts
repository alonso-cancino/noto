/**
 * Tests for SyncEngine
 */

import { SyncEngine } from '../SyncEngine';
import { DriveService } from '../../drive/DriveService';

// Mock DriveService
jest.mock('../../drive/DriveService');

describe('SyncEngine', () => {
  let driveService: DriveService;
  let syncEngine: SyncEngine;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    driveService = new DriveService(null as any);
    syncEngine = new SyncEngine(driveService);

    // Set up mock callbacks
    syncEngine.setStorageCallbacks({
      getFile: async () => null,
      saveFile: async () => {},
      deleteFile: async () => {},
    });
  });

  afterEach(() => {
    syncEngine.stopPeriodicSync();
  });

  it('should initialize correctly', () => {
    expect(syncEngine).toBeDefined();
  });

  it('should get sync status', () => {
    const status = syncEngine.getStatus();
    expect(status).toHaveProperty('isOnline');
    expect(status).toHaveProperty('isSyncing');
    expect(status).toHaveProperty('queueSize');
    expect(status).toHaveProperty('dirtyFiles');
  });

  it('should handle online/offline', () => {
    syncEngine.handleOffline();
    expect(syncEngine.getStatus().isOnline).toBe(false);

    syncEngine.handleOnline();
    expect(syncEngine.getStatus().isOnline).toBe(true);
  });

  it('should clear queue', () => {
    syncEngine.clearQueue();
    expect(syncEngine.getStatus().queueSize).toBe(0);
  });

  // Note: Full sync testing requires integration tests with Drive API
  // These are unit tests for the engine structure
});
