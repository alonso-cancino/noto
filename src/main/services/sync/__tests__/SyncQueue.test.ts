/**
 * Tests for SyncQueue
 */

import { SyncQueue } from '../SyncQueue';

describe('SyncQueue', () => {
  let queue: SyncQueue;

  beforeEach(() => {
    queue = new SyncQueue();
  });

  it('should initialize empty', () => {
    expect(queue.size()).toBe(0);
  });

  it('should enqueue operations', () => {
    queue.enqueue({
      path: 'test.md',
      content: 'test content',
      mimeType: 'text/markdown',
    });

    expect(queue.size()).toBe(1);
    expect(queue.has('test.md')).toBe(true);
  });

  it('should dequeue operations', () => {
    queue.enqueue({
      path: 'test.md',
      content: 'test content',
      mimeType: 'text/markdown',
    });

    queue.dequeue('test.md');
    expect(queue.size()).toBe(0);
  });

  it('should get operation', () => {
    queue.enqueue({
      path: 'test.md',
      content: 'test content',
      mimeType: 'text/markdown',
    });

    const op = queue.get('test.md');
    expect(op).toBeDefined();
    expect(op?.path).toBe('test.md');
  });

  it('should clear queue', () => {
    queue.enqueue({
      path: 'test1.md',
      content: 'content1',
      mimeType: 'text/markdown',
    });
    queue.enqueue({
      path: 'test2.md',
      content: 'content2',
      mimeType: 'text/markdown',
    });

    queue.clear();
    expect(queue.size()).toBe(0);
  });

  it('should pause and resume', () => {
    queue.pause();
    expect(queue.getOnlineStatus()).toBe(false);

    queue.resume();
    expect(queue.getOnlineStatus()).toBe(true);
  });

  it('should emit events', done => {
    queue.setProcessor(async () => {
      // Success
    });

    queue.on('upload:success', path => {
      expect(path).toBe('test.md');
      done();
    });

    queue.enqueue({
      path: 'test.md',
      content: 'test content',
      mimeType: 'text/markdown',
    });
  });
});
