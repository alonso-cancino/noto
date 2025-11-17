/**
 * Shared type definitions used across main and renderer processes
 */

// ============================================================================
// File System Types
// ============================================================================

export interface FileMetadata {
  path: string;
  name: string;
  type: FileType;
  size: number;
  modifiedTime: string;
  driveFileId?: string;
  lastSyncTime?: string;
}

export type FileType = 'markdown' | 'pdf' | 'folder';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: number;
  parents?: string[];
}

// ============================================================================
// Annotation Types
// ============================================================================

export interface Annotation {
  id: string;
  type: AnnotationType;
  pageNumber: number;
  bounds: Rectangle;
  color?: string;
  opacity?: number;
  text?: string;
  note?: string;
  createdAt: string;
  modifiedAt: string;
  citedIn?: string[];
}

export type AnnotationType = 'highlight' | 'note' | 'area';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationFile {
  version: number;
  pdfPath: string;
  pdfHash?: string;
  annotations: Annotation[];
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncStatus {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime?: string;
  queueSize?: number;
  error?: string;
}

export interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'delete';
  localPath: string;
  driveFileId?: string;
  priority: number;
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: Error;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expiresAt: number;
  token_type: string;
  scope: string;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  filePath: string;
  fileName: string;
  type: FileType;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  line: number;
  text: string;
  highlight: [number, number];
}

// ============================================================================
// Settings Types
// ============================================================================

export interface AppSettings {
  driveFolderId?: string;
  driveFolderName?: string;
  autoSaveInterval: number;
  syncInterval: number;
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  defaultHighlightColor: string;
  showLineNumbers: boolean;
  wordWrap: boolean;
}

// ============================================================================
// IPC Types
// ============================================================================

/**
 * Type-safe IPC channel definitions
 * Maps channel names to handler function signatures
 */
export interface IpcHandlers {
  // File operations
  'file:read': (path: string) => Promise<string>;
  'file:write': (path: string, content: string) => Promise<void>;
  'file:delete': (path: string) => Promise<void>;
  'file:rename': (oldPath: string, newPath: string) => Promise<void>;
  'file:list': (folderPath?: string) => Promise<FileMetadata[]>;
  'file:create': (path: string, type: FileType) => Promise<void>;
  'file:import-pdf': (fileName: string, base64Data: string) => Promise<void>;

  // Google Drive operations
  'drive:auth': () => Promise<boolean>;
  'drive:signout': () => Promise<void>;
  'drive:sync': () => Promise<SyncStatus>;
  'drive:status': () => Promise<SyncStatus>;
  'drive:selectFolder': () => Promise<string | null>;

  // PDF annotation operations
  'pdf:getAnnotations': (pdfPath: string) => Promise<Annotation[]>;
  'pdf:addAnnotation': (pdfPath: string, annotation: Annotation) => Promise<void>;
  'pdf:updateAnnotation': (pdfPath: string, annotation: Annotation) => Promise<void>;
  'pdf:deleteAnnotation': (pdfPath: string, annotationId: string) => Promise<void>;

  // Search operations
  'search:query': (query: string) => Promise<SearchResult[]>;
  'search:index': (filePath: string) => Promise<void>;

  // Settings operations
  'settings:get': () => Promise<AppSettings>;
  'settings:set': (settings: Partial<AppSettings>) => Promise<void>;

  // Citation operations
  'citation:create': (
    annotation: Annotation,
    targetPath: string,
    insertPosition?: number
  ) => Promise<void>;
  'citation:getBacklinks': (pdfPath: string) => Promise<Map<string, Annotation[]>>;

  // App operations
  'app:getVersion': () => Promise<string>;
  'app:openExternal': (url: string) => Promise<void>;
}

/**
 * Events sent from main to renderer
 */
export interface IpcEvents {
  'sync:status': (status: SyncStatus) => void;
  'sync:complete': (data: { changesCount: number }) => void;
  'sync:error': (error: { message: string }) => void;
  'file:created': (data: { path: string }) => void;
  'file:updated': (data: { path: string }) => void;
  'file:deleted': (data: { path: string }) => void;
  'open-citation': (data: { pdfPath: string; page: number; annotationId?: string }) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
