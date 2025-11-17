/**
 * ConflictResolver - Handles sync conflicts
 *
 * Strategies:
 * 1. Last-Write-Wins (default for text files)
 * 2. Merge (for annotations)
 * 3. Manual (user chooses)
 */

import { FileState } from './SyncEngine';

export interface Annotation {
  id: string;
  type: 'highlight' | 'note' | 'area';
  modifiedAt: string;
  [key: string]: any;
}

export interface AnnotationFile {
  version: number;
  pdfPath: string;
  annotations: Annotation[];
}

export type ConflictResolution = 'keep-local' | 'use-remote' | 'merge' | 'manual';

export interface ConflictInfo {
  path: string;
  local: FileState;
  remote: FileState;
  suggestedResolution: ConflictResolution;
}

export class ConflictResolver {
  /**
   * Detect if there's a conflict
   */
  isConflict(local: FileState, remote: FileState): boolean {
    return (
      local.isDirty &&
      remote.modifiedTime > (local.lastSyncTime || 0) &&
      local.modifiedTime > (local.lastSyncTime || 0)
    );
  }

  /**
   * Suggest resolution strategy based on file type
   */
  suggestResolution(path: string): ConflictResolution {
    if (path.endsWith('.annotations.json')) {
      return 'merge'; // Annotations can be merged
    } else if (path.endsWith('.md') || path.endsWith('.txt')) {
      return 'manual'; // Text files should be manually reviewed
    } else {
      return 'keep-local'; // Binary files - last write wins (prefer local)
    }
  }

  /**
   * Resolve conflict using Last-Write-Wins strategy
   */
  resolveLastWriteWins(local: FileState, remote: FileState): FileState {
    if (remote.modifiedTime > local.modifiedTime) {
      // Remote is newer
      return {
        ...remote,
        isDirty: false,
        lastSyncTime: Date.now(),
      };
    } else {
      // Local is newer (or equal)
      return {
        ...local,
        isDirty: true, // Keep dirty to upload
      };
    }
  }

  /**
   * Merge annotations from local and remote
   */
  mergeAnnotations(local: FileState, remote: FileState): FileState {
    try {
      const localData: AnnotationFile = JSON.parse(local.content as string);
      const remoteData: AnnotationFile = JSON.parse(remote.content as string);

      // Merge annotations by ID (latest modified wins)
      const merged = new Map<string, Annotation>();

      // Add all local annotations
      for (const ann of localData.annotations) {
        merged.set(ann.id, ann);
      }

      // Add/update with remote annotations
      for (const ann of remoteData.annotations) {
        const existing = merged.get(ann.id);
        if (!existing || new Date(ann.modifiedAt) > new Date(existing.modifiedAt)) {
          merged.set(ann.id, ann);
        }
      }

      // Create merged result
      const result: AnnotationFile = {
        version: Math.max(localData.version, remoteData.version),
        pdfPath: localData.pdfPath,
        annotations: Array.from(merged.values()),
      };

      return {
        ...local,
        content: JSON.stringify(result, null, 2),
        modifiedTime: Date.now(),
        isDirty: true, // Upload merged result
      };
    } catch (error) {
      console.error('Failed to merge annotations:', error);
      // Fallback to last-write-wins
      return this.resolveLastWriteWins(local, remote);
    }
  }

  /**
   * Create conflict copy for manual resolution
   */
  createConflictCopy(local: FileState, remote: FileState): {
    local: FileState;
    conflict: FileState;
  } {
    const timestamp = Date.now();
    const conflictPath = `${local.path}.conflict-${timestamp}`;

    return {
      local, // Keep local as-is
      conflict: {
        // Save remote as conflict copy
        ...remote,
        path: conflictPath,
        isDirty: false,
      },
    };
  }

  /**
   * Resolve conflict automatically
   */
  async resolveAuto(
    local: FileState,
    remote: FileState,
    strategy?: ConflictResolution
  ): Promise<FileState> {
    const resolution = strategy || this.suggestResolution(local.path);

    switch (resolution) {
      case 'keep-local':
        return {
          ...local,
          isDirty: true, // Upload to overwrite remote
        };

      case 'use-remote':
        return {
          ...remote,
          isDirty: false,
          lastSyncTime: Date.now(),
        };

      case 'merge':
        return this.mergeAnnotations(local, remote);

      case 'manual':
      default:
        // For manual, return local and let UI handle it
        return local;
    }
  }

  /**
   * Get conflict details for UI
   */
  getConflictInfo(local: FileState, remote: FileState): ConflictInfo {
    return {
      path: local.path,
      local,
      remote,
      suggestedResolution: this.suggestResolution(local.path),
    };
  }

  /**
   * Compare file contents (for diff UI)
   */
  getDiff(local: string, remote: string): {
    additions: string[];
    deletions: string[];
    unchanged: string[];
  } {
    const localLines = local.split('\n');
    const remoteLines = remote.split('\n');

    const additions: string[] = [];
    const deletions: string[] = [];
    const unchanged: string[] = [];

    // Simple line-by-line diff
    const maxLength = Math.max(localLines.length, remoteLines.length);

    for (let i = 0; i < maxLength; i++) {
      const localLine = localLines[i];
      const remoteLine = remoteLines[i];

      if (localLine === remoteLine) {
        unchanged.push(localLine);
      } else {
        if (localLine !== undefined) {
          deletions.push(localLine);
        }
        if (remoteLine !== undefined) {
          additions.push(remoteLine);
        }
      }
    }

    return { additions, deletions, unchanged };
  }
}
