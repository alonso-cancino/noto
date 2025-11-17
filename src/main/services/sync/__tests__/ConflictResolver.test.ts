/**
 * Tests for ConflictResolver
 */

import { ConflictResolver } from '../ConflictResolver';
import { FileState } from '../SyncEngine';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  it('should detect conflicts', () => {
    const local: FileState = {
      path: 'test.md',
      content: 'local content',
      modifiedTime: Date.now(),
      isDirty: true,
      lastSyncTime: Date.now() - 10000,
    };

    const remote: FileState = {
      path: 'test.md',
      content: 'remote content',
      modifiedTime: Date.now(),
      isDirty: false,
      lastSyncTime: Date.now() - 10000,
    };

    expect(resolver.isConflict(local, remote)).toBe(true);
  });

  it('should suggest resolution based on file type', () => {
    expect(resolver.suggestResolution('test.annotations.json')).toBe('merge');
    expect(resolver.suggestResolution('test.md')).toBe('manual');
    expect(resolver.suggestResolution('test.pdf')).toBe('keep-local');
  });

  it('should resolve with last-write-wins', () => {
    const now = Date.now();
    const local: FileState = {
      path: 'test.md',
      content: 'local',
      modifiedTime: now - 1000,
      isDirty: true,
    };

    const remote: FileState = {
      path: 'test.md',
      content: 'remote',
      modifiedTime: now,
      isDirty: false,
    };

    const resolved = resolver.resolveLastWriteWins(local, remote);
    expect(resolved.content).toBe('remote');
  });

  it('should create conflict copy', () => {
    const local: FileState = {
      path: 'test.md',
      content: 'local',
      modifiedTime: Date.now(),
      isDirty: true,
    };

    const remote: FileState = {
      path: 'test.md',
      content: 'remote',
      modifiedTime: Date.now(),
      isDirty: false,
    };

    const result = resolver.createConflictCopy(local, remote);
    expect(result.local.path).toBe('test.md');
    expect(result.conflict.path).toContain('test.md.conflict-');
  });

  it('should get diff', () => {
    const local = 'line1\nline2\nline3';
    const remote = 'line1\nmodified\nline3';

    const diff = resolver.getDiff(local, remote);
    expect(diff.unchanged).toContain('line1');
    expect(diff.deletions).toContain('line2');
    expect(diff.additions).toContain('modified');
  });
});
