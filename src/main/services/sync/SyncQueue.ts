/**
 * SyncQueue - Manages upload queue with retry logic
 *
 * Features:
 * - Queue file uploads
 * - Retry failed uploads with exponential backoff
 * - Process queue asynchronously
 * - Pause/resume on offline/online
 */

import EventEmitter from 'events';

export interface UploadOperation {
  path: string;
  content: string | Buffer;
  mimeType: string;
  driveFileId?: string;
  timestamp: number;
  retries: number;
  lastError?: string;
}

export interface SyncQueueEvents {
  'upload:start': (path: string) => void;
  'upload:success': (path: string) => void;
  'upload:failed': (path: string, error: Error) => void;
  'upload:retry': (path: string, attempt: number) => void;
  'queue:empty': () => void;
  'queue:processing': () => void;
}

export declare interface SyncQueue {
  on<U extends keyof SyncQueueEvents>(event: U, listener: SyncQueueEvents[U]): this;
  emit<U extends keyof SyncQueueEvents>(event: U, ...args: Parameters<SyncQueueEvents[U]>): boolean;
}

export class SyncQueue extends EventEmitter {
  private queue: Map<string, UploadOperation> = new Map();
  private processing = false;
  private maxRetries = 3;
  private baseDelayMs = 1000;
  private isOnline = true;

  constructor() {
    super();
  }

  /**
   * Add operation to queue
   */
  enqueue(operation: Omit<UploadOperation, 'timestamp' | 'retries'>): void {
    const fullOperation: UploadOperation = {
      ...operation,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.set(operation.path, fullOperation);

    // Start processing if not already running
    if (!this.processing && this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Remove operation from queue
   */
  dequeue(path: string): void {
    this.queue.delete(path);
  }

  /**
   * Get operation from queue
   */
  get(path: string): UploadOperation | undefined {
    return this.queue.get(path);
  }

  /**
   * Check if path is in queue
   */
  has(path: string): boolean {
    return this.queue.has(path);
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Get all operations
   */
  getAll(): UploadOperation[] {
    return Array.from(this.queue.values());
  }

  /**
   * Clear entire queue
   */
  clear(): void {
    this.queue.clear();
  }

  /**
   * Process queue (private, runs automatically)
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.size === 0 || !this.isOnline) {
      return;
    }

    this.processing = true;
    this.emit('queue:processing');

    // Process operations one at a time
    while (this.queue.size > 0 && this.isOnline) {
      // Get first operation (FIFO)
      const [path, operation] = this.queue.entries().next().value;

      try {
        this.emit('upload:start', path);

        // Perform upload (will be handled by caller via callback)
        const shouldRetry = await this.processOperation(operation);

        if (!shouldRetry) {
          // Success - remove from queue
          this.queue.delete(path);
          this.emit('upload:success', path);
        }
      } catch (error) {
        // Handle error
        await this.handleError(operation, error as Error);
      }
    }

    this.processing = false;

    if (this.queue.size === 0) {
      this.emit('queue:empty');
    }
  }

  /**
   * Process a single operation
   * Returns true if operation should be retried, false if successful
   */
  private async processOperation(operation: UploadOperation): Promise<boolean> {
    // This will be overridden by the sync engine
    // For now, just return false (success)
    return false;
  }

  /**
   * Set operation processor (callback from sync engine)
   */
  setProcessor(processor: (operation: UploadOperation) => Promise<void>): void {
    this.processOperation = async (operation: UploadOperation): Promise<boolean> => {
      try {
        await processor(operation);
        return false; // Success
      } catch (error) {
        throw error; // Will be caught and handled
      }
    };
  }

  /**
   * Handle operation error
   */
  private async handleError(operation: UploadOperation, error: Error): Promise<void> {
    operation.retries++;
    operation.lastError = error.message;

    if (operation.retries >= this.maxRetries) {
      // Max retries reached - remove from queue and emit failure
      this.queue.delete(operation.path);
      this.emit('upload:failed', operation.path, error);
    } else {
      // Retry with exponential backoff
      const delay = this.baseDelayMs * Math.pow(2, operation.retries - 1);
      this.emit('upload:retry', operation.path, operation.retries);

      setTimeout(() => {
        if (this.isOnline && !this.processing) {
          this.processQueue();
        }
      }, delay);
    }
  }

  /**
   * Pause queue (when going offline)
   */
  pause(): void {
    this.isOnline = false;
  }

  /**
   * Resume queue (when coming online)
   */
  resume(): void {
    this.isOnline = true;
    if (!this.processing && this.queue.size > 0) {
      this.processQueue();
    }
  }

  /**
   * Check if queue is processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Check if online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): UploadOperation[] {
    return Array.from(this.queue.values()).filter(op => op.retries > 0);
  }

  /**
   * Retry failed operation
   */
  retryOperation(path: string): void {
    const operation = this.queue.get(path);
    if (operation) {
      operation.retries = 0;
      operation.lastError = undefined;
      if (!this.processing && this.isOnline) {
        this.processQueue();
      }
    }
  }

  /**
   * Retry all failed operations
   */
  retryAllFailed(): void {
    for (const operation of this.queue.values()) {
      if (operation.retries > 0) {
        operation.retries = 0;
        operation.lastError = undefined;
      }
    }
    if (!this.processing && this.isOnline) {
      this.processQueue();
    }
  }
}
