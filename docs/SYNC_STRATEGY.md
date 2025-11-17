# Sync Strategy Documentation

## Overview

Noto uses a **three-tier storage architecture** to provide fast local access while maintaining cloud synchronization across devices. This document details the synchronization strategy, conflict resolution, and implementation specifics.

## Storage Architecture

### Three Tiers

```
┌─────────────────────────────────────────────────────────────┐
│                     1. Google Drive (Cloud)                 │
│                    Source of Truth                          │
│  - All files permanently stored                             │
│  - Accessible from any device                               │
│  - Google's built-in versioning                             │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼
                        Sync Engine
                            ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                2. IndexedDB (Local Cache)                   │
│                   Fast Access Layer                         │
│  - Full copy of Drive contents                              │
│  - Metadata (file IDs, timestamps)                          │
│  - Sync queue and status                                    │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼
                        File Manager
                            ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│              3. Memory (Currently Open Files)               │
│                   Active Working Set                        │
│  - Files being actively edited                              │
│  - Dirty state tracking                                     │
│  - Auto-save debouncing                                     │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

1. **Google Drive** - Persistence, cross-device sync, built-in backup
2. **IndexedDB** - Instant app startup, offline access, fast reads
3. **Memory** - Real-time editing, minimal latency

## Sync Operations

### Initial Sync (App Startup)

```
1. User launches app
   ↓
2. Load metadata from IndexedDB
   ↓
3. Show file tree immediately (from cache)
   ↓
4. Background: Query Google Drive for changes
   ↓
5. If changes detected:
   - Download new/modified files
   - Update IndexedDB
   - Refresh UI
   ↓
6. Ready to work (offline or online)
```

**Implementation:**

```typescript
class SyncEngine {
  async initialSync(): Promise<void> {
    // 1. Load local cache
    const localFiles = await this.storage.getAllFiles();
    this.ui.showFileTree(localFiles);

    // 2. Check for remote changes
    const lastSyncToken = await this.storage.getSyncToken();
    const changes = await this.drive.getChanges(lastSyncToken);

    if (changes.files.length === 0) {
      console.log('Already up to date');
      return;
    }

    // 3. Download changes
    for (const change of changes.files) {
      if (change.removed) {
        await this.storage.deleteFile(change.fileId);
      } else {
        const content = await this.drive.downloadFile(change.fileId);
        await this.storage.saveFile(change.path, content, change.metadata);
      }
    }

    // 4. Update sync token
    await this.storage.setSyncToken(changes.newStartPageToken);

    // 5. Refresh UI
    this.ui.refreshFileTree();
  }
}
```

### Incremental Sync (Background)

Runs every 30 seconds (configurable) while app is running.

```
1. Query Google Drive API for changes since last sync
   ↓
2. For each change:
   a. New file → Download and add to cache
   b. Modified file → Check for conflicts → Download
   c. Deleted file → Remove from cache
   ↓
3. Update last sync token
   ↓
4. Notify UI of changes
```

**Implementation:**

```typescript
class SyncEngine {
  private syncIntervalMs = 30_000;  // 30 seconds
  private syncTimer: NodeJS.Timeout | null = null;

  startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      if (!navigator.onLine) return;  // Skip if offline

      try {
        await this.incrementalSync();
      } catch (error) {
        console.error('Sync failed:', error);
        // Continue - will retry on next interval
      }
    }, this.syncIntervalMs);
  }

  async incrementalSync(): Promise<void> {
    const lastToken = await this.storage.getSyncToken();
    const changes = await this.drive.getChanges(lastToken);

    for (const change of changes.files) {
      await this.handleRemoteChange(change);
    }

    await this.storage.setSyncToken(changes.newStartPageToken);
    this.emitEvent('sync:complete', { changesCount: changes.files.length });
  }

  private async handleRemoteChange(change: DriveChange): Promise<void> {
    if (change.removed) {
      await this.storage.deleteFile(change.fileId);
      this.emitEvent('file:deleted', { path: change.path });
      return;
    }

    const localFile = await this.storage.getFile(change.fileId);

    if (!localFile) {
      // New file
      await this.downloadAndCache(change);
      this.emitEvent('file:added', { path: change.path });
    } else if (localFile.modifiedTime < change.modifiedTime) {
      // Remote is newer
      if (this.isDirty(change.fileId)) {
        // Conflict! Local has unsaved changes
        await this.resolveConflict(change, localFile);
      } else {
        // Safe to download
        await this.downloadAndCache(change);
        this.emitEvent('file:updated', { path: change.path });
      }
    }
  }

  private isDirty(fileId: string): boolean {
    return this.dirtyFiles.has(fileId);
  }
}
```

### Upload on Save

When user saves a file (or auto-save triggers):

```
1. User edits file
   ↓
2. Debounced auto-save (500ms after typing stops)
   ↓
3. Save to IndexedDB immediately (fast)
   ↓
4. Mark file as dirty
   ↓
5. Add to upload queue
   ↓
6. Return success to user (don't block on upload)
   ↓
7. Background: Process upload queue
   ↓
8. Upload to Google Drive
   ↓
9. Update metadata (Drive file ID, version)
   ↓
10. Mark as clean (remove from dirty set)
```

**Implementation:**

```typescript
class SyncEngine {
  private uploadQueue: Map<string, UploadOperation> = new Map();
  private dirtyFiles: Set<string> = new Set();

  async saveFile(path: string, content: string): Promise<void> {
    // 1. Save locally first (fast, user sees immediate feedback)
    await this.storage.saveFile(path, content);

    // 2. Mark as dirty
    this.dirtyFiles.add(path);

    // 3. Queue for upload
    this.queueUpload(path, content);

    // 4. Process queue (non-blocking)
    this.processUploadQueue().catch(error => {
      console.error('Upload failed:', error);
      this.emitEvent('sync:error', { path, error });
    });
  }

  private queueUpload(path: string, content: string): void {
    this.uploadQueue.set(path, {
      path,
      content,
      timestamp: Date.now(),
      retries: 0
    });
  }

  private async processUploadQueue(): Promise<void> {
    if (this.uploadQueue.size === 0) return;
    if (!navigator.onLine) return;  // Wait until online

    // Process one at a time to avoid rate limits
    const [path, operation] = this.uploadQueue.entries().next().value;

    try {
      const fileId = await this.storage.getFileId(path);

      if (fileId) {
        // Update existing file
        await this.drive.updateFile(fileId, operation.content);
      } else {
        // Create new file
        const newFileId = await this.drive.createFile(path, operation.content);
        await this.storage.setFileId(path, newFileId);
      }

      // Success
      this.uploadQueue.delete(path);
      this.dirtyFiles.delete(path);
      this.emitEvent('sync:uploaded', { path });

      // Continue with next file
      this.processUploadQueue();

    } catch (error) {
      operation.retries++;

      if (operation.retries >= 3) {
        // Give up after 3 retries
        this.uploadQueue.delete(path);
        this.emitEvent('sync:failed', { path, error });
      } else {
        // Retry with exponential backoff
        setTimeout(() => this.processUploadQueue(), 1000 * Math.pow(2, operation.retries));
      }
    }
  }
}
```

## Conflict Resolution

### Conflict Detection

A conflict occurs when:
1. Local file has unsaved changes (is dirty)
2. Remote file has been modified by another device
3. Both modifications happened after the last sync

```typescript
function isConflict(local: FileState, remote: FileState): boolean {
  return (
    local.isDirty &&
    remote.modifiedTime > local.lastSyncTime &&
    local.modifiedTime > local.lastSyncTime
  );
}
```

### Resolution Strategies

#### Strategy 1: Last-Write-Wins (Default for most files)

```typescript
async function resolveConflict_LastWriteWins(
  local: FileState,
  remote: FileState
): Promise<void> {
  if (remote.modifiedTime > local.modifiedTime) {
    // Remote is newer → download and overwrite local
    await this.downloadAndCache(remote);
    this.dirtyFiles.delete(remote.fileId);

    // Notify user
    this.notify(`"${remote.path}" was updated from another device`, {
      action: 'Show File',
      onClick: () => this.openFile(remote.path)
    });
  } else {
    // Local is newer → upload and overwrite remote
    await this.uploadFile(local);
  }
}
```

#### Strategy 2: Merge (For Annotations)

Annotations can be safely merged because each has a unique ID.

```typescript
async function resolveConflict_MergeAnnotations(
  local: AnnotationFile,
  remote: AnnotationFile
): Promise<void> {
  // Merge annotations by ID
  const merged = new Map<string, Annotation>();

  // Add all local annotations
  for (const ann of local.annotations) {
    merged.set(ann.id, ann);
  }

  // Add/update with remote annotations
  for (const ann of remote.annotations) {
    const existing = merged.get(ann.id);

    if (!existing || ann.modifiedAt > existing.modifiedAt) {
      merged.set(ann.id, ann);
    }
  }

  const result: AnnotationFile = {
    pdfPath: local.pdfPath,
    annotations: Array.from(merged.values()),
    version: Math.max(local.version, remote.version)
  };

  // Save merged result
  await this.storage.saveFile(local.path, JSON.stringify(result, null, 2));
  await this.uploadFile(local.path);
}
```

#### Strategy 3: Manual Resolution (User Chooses)

For critical files or when automatic resolution isn't safe:

```typescript
async function resolveConflict_Manual(
  local: FileState,
  remote: FileState
): Promise<void> {
  // Save remote version as conflict copy
  const conflictPath = `${local.path}.conflict-${Date.now()}`;
  await this.storage.saveFile(conflictPath, remote.content);

  // Show UI for user to resolve
  this.ui.showConflictDialog({
    localPath: local.path,
    remotePath: conflictPath,
    onResolve: async (choice: 'local' | 'remote' | 'manual') => {
      if (choice === 'local') {
        await this.uploadFile(local);
        await this.storage.deleteFile(conflictPath);
      } else if (choice === 'remote') {
        await this.downloadAndCache(remote);
        this.dirtyFiles.delete(remote.fileId);
      } else {
        // User will manually merge and save
        this.openFile(local.path);
        this.openFile(conflictPath);
      }
    }
  });
}
```

### Conflict UI

When a conflict occurs, show a notification:

```
┌───────────────────────────────────────────────────┐
│  ⚠️  Sync Conflict: research-notes.md             │
│                                                   │
│  This file was modified on another device.        │
│                                                   │
│  [Keep Local Version] [Use Remote Version]        │
│  [Show Diff]                                      │
└───────────────────────────────────────────────────┘
```

## Offline Support

### Going Offline

```
User loses internet connection
   ↓
Sync engine detects offline state (navigator.onLine)
   ↓
Pause background sync
   ↓
Queue all uploads
   ↓
Show "Offline" indicator in status bar
   ↓
User continues working normally (from cache)
```

### Coming Back Online

```
Internet connection restored
   ↓
Sync engine detects online state
   ↓
Resume background sync
   ↓
Process upload queue
   ↓
Pull remote changes
   ↓
Resolve any conflicts
   ↓
Show "Synced" indicator
```

**Implementation:**

```typescript
class SyncEngine {
  private isOnline = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.emitEvent('sync:online');

    // Process queued uploads
    this.processUploadQueue();

    // Pull remote changes
    this.incrementalSync();

    // Resume periodic sync
    this.startPeriodicSync();
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.emitEvent('sync:offline');

    // Stop periodic sync
    this.stopPeriodicSync();
  }
}
```

## Google Drive API Integration

### OAuth 2.0 Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Open OAuth consent screen
   ↓
3. User authorizes app
   ↓
4. Receive authorization code
   ↓
5. Exchange code for tokens:
   - access_token (expires in 1 hour)
   - refresh_token (long-lived)
   ↓
6. Store tokens securely (Electron safeStorage)
   ↓
7. Use access_token for API requests
   ↓
8. When access_token expires:
   - Use refresh_token to get new access_token
```

**Implementation:**

```typescript
class DriveAuthService {
  async authenticate(): Promise<OAuthTokens> {
    // 1. Generate authorization URL
    const authUrl = this.buildAuthUrl({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: 'http://localhost:3000/oauth/callback',
      scope: 'https://www.googleapis.com/auth/drive.file',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    // 2. Open browser for user consent
    const authCode = await this.openAuthWindow(authUrl);

    // 3. Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(authCode);

    // 4. Store securely
    await this.saveTokens(tokens);

    return tokens;
  }

  async getAccessToken(): Promise<string> {
    const tokens = await this.loadTokens();

    if (!tokens) {
      throw new Error('Not authenticated');
    }

    // Check if expired
    if (Date.now() > tokens.expiresAt) {
      // Refresh
      const newTokens = await this.refreshAccessToken(tokens.refresh_token);
      await this.saveTokens(newTokens);
      return newTokens.access_token;
    }

    return tokens.access_token;
  }

  private async saveTokens(tokens: OAuthTokens): Promise<void> {
    const { safeStorage } = require('electron');
    const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
    await store.set('oauth_tokens', encrypted.toString('base64'));
  }
}
```

### API Operations

```typescript
class DriveService {
  private baseUrl = 'https://www.googleapis.com/drive/v3';

  async listFiles(folderId: string): Promise<DriveFile[]> {
    const token = await this.auth.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/files?q='${folderId}' in parents and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    return data.files;
  }

  async downloadFile(fileId: string): Promise<string> {
    const token = await this.auth.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.text();
  }

  async uploadFile(name: string, content: string, folderId: string): Promise<string> {
    const token = await this.auth.getAccessToken();

    const metadata = {
      name,
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/plain' }));

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      }
    );

    const data = await response.json();
    return data.id;
  }

  async updateFile(fileId: string, content: string): Promise<void> {
    const token = await this.auth.getAccessToken();

    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain'
        },
        body: content
      }
    );
  }
}
```

### Change Detection

Use Google Drive's Changes API to efficiently detect modifications:

```typescript
class DriveWatcher {
  async getChanges(pageToken: string): Promise<ChangeList> {
    const token = await this.auth.getAccessToken();

    const response = await fetch(
      `${this.baseUrl}/changes?pageToken=${pageToken}&includeRemoved=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.json();
  }

  async startWatching(): Promise<string> {
    // Get initial page token
    const response = await fetch(
      `${this.baseUrl}/changes/startPageToken`,
      {
        headers: {
          Authorization: `Bearer ${await this.auth.getAccessToken()}`
        }
      }
    );

    const data = await response.json();
    return data.startPageToken;
  }
}
```

## Performance Optimizations

### 1. Batch Operations

Instead of uploading files one-by-one, batch them:

```typescript
async function uploadBatch(files: FileOperation[]): Promise<void> {
  // Google Drive supports batch requests
  const boundary = 'batch_boundary';

  let body = '';
  for (const file of files) {
    body += `--${boundary}\n`;
    body += `Content-Type: application/http\n\n`;
    body += `PATCH /drive/v3/files/${file.id}\n`;
    body += `Content-Type: text/plain\n\n`;
    body += file.content + '\n';
  }
  body += `--${boundary}--`;

  await fetch('https://www.googleapis.com/batch/drive/v3', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/mixed; boundary=${boundary}`,
      Authorization: `Bearer ${token}`
    },
    body
  });
}
```

### 2. Differential Sync

Only upload changed portions of large files:

```typescript
async function uploadDiff(fileId: string, oldContent: string, newContent: string): Promise<void> {
  // Compute diff
  const diff = computeDiff(oldContent, newContent);

  if (diff.changes.length < newContent.length / 10) {
    // Diff is small, upload patches
    await this.drive.patchFile(fileId, diff);
  } else {
    // Diff is large, upload full content
    await this.drive.updateFile(fileId, newContent);
  }
}
```

### 3. Compression

Compress large files before uploading:

```typescript
async function uploadCompressed(path: string, content: string): Promise<void> {
  if (content.length > 100_000) {  // > 100KB
    const compressed = await gzip(content);
    await this.drive.uploadFile(path + '.gz', compressed);
  } else {
    await this.drive.uploadFile(path, content);
  }
}
```

## Error Handling

### Network Errors

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff: 1s, 2s, 4s
      await sleep(1000 * Math.pow(2, i));
    }
  }
  throw new Error('Unreachable');
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private requests: number = 0;
  private window: number = 100_000;  // 100 seconds
  private limit: number = 20_000;    // Google Drive limit

  async throttle(): Promise<void> {
    if (this.requests >= this.limit) {
      // Wait for window to reset
      await sleep(this.window);
      this.requests = 0;
    }

    this.requests++;
  }
}
```

### Quota Exceeded

```typescript
async function handleQuotaError(error: DriveError): Promise<void> {
  if (error.code === 403 && error.message.includes('quota')) {
    this.emitEvent('sync:quota-exceeded', {
      message: 'Google Drive storage full',
      action: 'Manage Storage',
      onClick: () => openExternal('https://drive.google.com/settings/storage')
    });
  }
}
```

## Monitoring & Debugging

### Sync Status Events

```typescript
interface SyncEvents {
  'sync:started': {};
  'sync:complete': { changesCount: number };
  'sync:error': { error: Error };
  'sync:online': {};
  'sync:offline': {};
  'sync:uploading': { path: string; progress: number };
  'sync:uploaded': { path: string };
  'sync:conflict': { path: string };
  'sync:quota-exceeded': { message: string };
}

// Usage
syncEngine.on('sync:uploading', ({ path, progress }) => {
  statusBar.showProgress(`Uploading ${path}... ${progress}%`);
});
```

### Logging

```typescript
class SyncLogger {
  log(event: string, data?: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };

    console.log('[Sync]', entry);
    this.writeToFile(entry);
  }

  private writeToFile(entry: LogEntry): void {
    // Append to sync.log
    fs.appendFileSync(
      path.join(app.getPath('userData'), 'sync.log'),
      JSON.stringify(entry) + '\n'
    );
  }
}
```

---

**Last updated:** 2025-10-18
