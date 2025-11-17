# Noto Architecture Documentation

## System Overview

Noto is an Electron-based desktop application that provides a seamless research workflow combining PDF annotation, markdown note-taking, and cloud synchronization via Google Drive.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Noto Desktop App                        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   File Explorer  │  │  Editor/Viewer   │  │  Annotations │ │
│  │                  │  │                  │  │   Sidebar    │ │
│  │  - File Tree     │  │  - Monaco Editor │  │  - List      │ │
│  │  - Search        │  │  - PDF Viewer    │  │  - Filters   │ │
│  │  - Filters       │  │  - Split View    │  │  - Citations │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      Status Bar                           │ │
│  │  Sync Status | File Info | Word Count | Cursor Position  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ IPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Electron Main Process                        │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐  │
│  │  Google Drive  │  │  Sync Engine   │  │ Local Storage   │  │
│  │     Service    │  │                │  │   (IndexedDB)   │  │
│  │                │  │  - Queue       │  │                 │  │
│  │  - OAuth       │  │  - Conflict    │  │  - File Cache   │  │
│  │  - API Calls   │  │  - Watcher     │  │  - Metadata     │  │
│  └────────────────┘  └────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Google Drive    │  │   Sync Queue     │  │   Local Disk     │
│   (Cloud)        │  │   (In-Memory)    │  │   (User Data)    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Architecture Layers

### 1. Presentation Layer (Renderer Process)

**Technology:** React + TypeScript + Tailwind CSS

**Components:**

```
renderer/
├── App.tsx                          # Root component, routing
├── components/
│   ├── FileExplorer/
│   │   ├── FileTree.tsx            # Hierarchical file browser
│   │   ├── FileItem.tsx            # Individual file/folder item
│   │   ├── ContextMenu.tsx         # Right-click menu
│   │   └── SearchBar.tsx           # File search input
│   ├── Editor/
│   │   ├── MarkdownEditor.tsx      # Monaco editor wrapper
│   │   ├── MarkdownPreview.tsx     # Rendered markdown view
│   │   └── EditorToolbar.tsx       # Editor controls
│   ├── PDFViewer/
│   │   ├── PDFCanvas.tsx           # PDF.js rendering
│   │   ├── AnnotationLayer.tsx     # Overlay for annotations
│   │   ├── AnnotationToolbar.tsx   # Highlight/note tools
│   │   ├── PageNavigation.tsx      # Page controls
│   │   └── ZoomControls.tsx        # Zoom in/out
│   ├── Sidebar/
│   │   ├── LeftSidebar.tsx         # File explorer container
│   │   ├── RightSidebar.tsx        # Annotations list
│   │   └── OutlineView.tsx         # Markdown/PDF outline
│   ├── StatusBar/
│   │   └── StatusBar.tsx           # Bottom status display
│   ├── CommandPalette/
│   │   └── CommandPalette.tsx      # Cmd+P quick actions
│   └── shared/
│       ├── Button.tsx              # Reusable UI components
│       ├── Input.tsx
│       └── Modal.tsx
├── contexts/
│   ├── FilesContext.tsx            # Open files state
│   ├── SyncContext.tsx             # Sync status state
│   └── SettingsContext.tsx         # App settings
├── hooks/
│   ├── useFileOperations.ts        # File CRUD operations
│   ├── useSync.ts                  # Sync status and triggers
│   └── useAnnotations.ts           # PDF annotation management
└── services/
    └── ipc.ts                      # IPC communication wrapper
```

**State Management:**

- **React Context API** for global state (files, sync, settings)
- **Local component state** for UI interactions
- **No external state library** (Redux/MobX) - keep it simple

### 2. Application Layer (Main Process)

**Technology:** Electron + Node.js + TypeScript

**Services:**

```
main/
├── index.ts                         # Entry point, app lifecycle
├── window.ts                        # Window creation/management
├── menu.ts                          # Application menu
├── ipc/
│   ├── handlers.ts                 # IPC handler registration
│   ├── file-handlers.ts            # File operation handlers
│   ├── drive-handlers.ts           # Google Drive handlers
│   └── annotation-handlers.ts      # Annotation handlers
├── services/
│   ├── drive/
│   │   ├── DriveService.ts         # Google Drive API client
│   │   ├── auth.ts                 # OAuth 2.0 flow
│   │   └── operations.ts           # CRUD operations
│   ├── sync/
│   │   ├── SyncEngine.ts           # Main sync orchestrator
│   │   ├── SyncQueue.ts            # Operation queue
│   │   ├── ConflictResolver.ts     # Conflict resolution
│   │   └── Watcher.ts              # Drive change watcher
│   ├── storage/
│   │   ├── StorageService.ts       # IndexedDB wrapper
│   │   ├── FileCache.ts            # File content cache
│   │   └── MetadataStore.ts        # File metadata
│   ├── search/
│   │   ├── SearchService.ts        # Full-text search
│   │   └── Indexer.ts              # Content indexing
│   └── annotations/
│       ├── AnnotationService.ts    # Annotation CRUD
│       └── CitationService.ts      # Citation link handling
└── utils/
    ├── logger.ts                    # Logging utility
    └── errors.ts                    # Error handling
```

### 3. Data Layer

**Three-tier storage:**

1. **Google Drive (Cloud)** - Source of truth
2. **IndexedDB (Local)** - Fast access cache
3. **Memory (Runtime)** - Currently active files

**Data Flow:**

```
User Action (Save File)
    ↓
Renderer (IPC call)
    ↓
Main Process
    ↓
┌───────────────────────────────────┐
│  1. Write to IndexedDB (fast)    │
│  2. Add to Sync Queue             │
│  3. Return success to renderer    │
└───────────────────────────────────┘
    ↓
Background Sync
    ↓
Upload to Google Drive
    ↓
Update local metadata (Drive file ID, version)
```

## Core Subsystems

### Google Drive Integration

**Authentication Flow:**

```
1. User clicks "Sign in with Google"
2. Main process opens OAuth consent screen
3. User authorizes app
4. Receive authorization code
5. Exchange for access + refresh tokens
6. Store tokens in Electron safeStorage (encrypted)
7. Use access token for API calls
8. Refresh when expired
```

**API Operations:**

```typescript
class DriveService {
  // File operations
  async listFiles(folderId: string): Promise<DriveFile[]>
  async readFile(fileId: string): Promise<string>
  async createFile(name: string, content: string, parent: string): Promise<DriveFile>
  async updateFile(fileId: string, content: string): Promise<void>
  async deleteFile(fileId: string): Promise<void>

  // Folder operations
  async createFolder(name: string, parent: string): Promise<DriveFile>

  // Watch for changes
  async getChanges(pageToken: string): Promise<ChangeList>
  async startPageToken(): Promise<string>
}
```

**Quota & Rate Limiting:**

- Google Drive API: 20,000 requests/100 seconds/user
- Implement exponential backoff for errors
- Batch operations where possible
- Cache aggressively

### Sync Engine

**Sync Strategy:**

```typescript
interface SyncStrategy {
  // On app start
  fullSync(): Promise<void>  // Download all files from Drive

  // During app usage
  incrementalSync(): Promise<void>  // Poll for changes every 30s

  // On user action
  pushChanges(files: string[]): Promise<void>  // Upload modified files

  // On file open
  ensureLatest(filePath: string): Promise<void>  // Check for updates
}
```

**Conflict Resolution:**

```
Local Change + Remote Change = Conflict

Resolution strategies:
1. Last-write-wins (compare timestamps)
2. Manual resolution (show diff, let user choose)
3. Merge (for annotations - merge by ID)

For annotations:
- Annotations have unique IDs
- Merge both sets, deduplicate by ID
- Update modifiedAt timestamp
```

**Sync Queue:**

```typescript
interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'delete';
  localPath: string;
  driveFileId?: string;
  priority: number;        // Higher = process first
  retries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: Error;
}

class SyncQueue {
  operations: SyncOperation[] = [];

  add(op: SyncOperation): void
  process(): Promise<void>  // Process queue (FIFO with priority)
  retry(id: string): void
  cancel(id: string): void
}
```

### PDF Annotation System

**Architecture:**

```
PDF Display
    ↓
PDF.js renders pages to canvas
    ↓
Annotation Layer (SVG overlay)
    ↓
Renders highlights/notes on top
    ↓
User interactions (click, drag)
    ↓
Create/update annotation data
    ↓
Save to .annotations.json
    ↓
Sync to Google Drive
```

**Annotation Data Model:**

```typescript
interface Annotation {
  id: string;                 // UUID v4
  type: 'highlight' | 'note' | 'area';
  pageNumber: number;         // 1-indexed
  bounds: Rectangle;          // Position on page
  color?: string;             // Hex color for highlights
  text?: string;              // Extracted text (for highlights)
  note?: string;              // User's comment
  createdAt: string;          // ISO 8601
  modifiedAt: string;
  citedIn?: string[];         // Markdown files that reference this
}

interface Rectangle {
  x: number;                  // % from left (0-100)
  y: number;                  // % from top (0-100)
  width: number;              // % of page width
  height: number;             // % of page height
}

// Why percentages? PDFs can be zoomed, percentages are scale-independent
```

**Storage:**

```
/MyResearch/
├── paper.pdf                        # Original PDF
└── .paper.pdf.annotations.json      # Annotations (hidden file)
```

Both files sync to Google Drive.

**Rendering Pipeline:**

```typescript
// 1. Load PDF
const pdf = await pdfjsLib.getDocument(url);

// 2. Render page to canvas
const page = await pdf.getPage(pageNum);
const canvas = document.getElementById('pdf-canvas');
await page.render({ canvasContext, viewport });

// 3. Load annotations for this page
const annotations = await loadAnnotations(pdfPath, pageNum);

// 4. Render annotation SVG layer over canvas
annotations.forEach(ann => {
  renderAnnotation(ann, viewport);
});

// 5. Add interaction handlers
canvas.addEventListener('mousedown', handleAnnotationStart);
canvas.addEventListener('mousemove', handleAnnotationDrag);
canvas.addEventListener('mouseup', handleAnnotationEnd);
```

### Citation & Linking System

**Citation Format:**

```markdown
> "This is a quote from the PDF that I highlighted"
> — [paper.pdf, p. 42](noto://pdf/MyResearch/paper.pdf#page=42&annotation=a1b2c3d4)
```

**URL Scheme Breakdown:**

```
noto://pdf/path/to/file.pdf#page=42&annotation=a1b2c3d4
  │    │   │                │         │
  │    │   │                │         └─ Annotation ID (highlight to focus)
  │    │   │                └─────────── Page number
  │    │   └──────────────────────────── Relative path from Drive root
  │    └──────────────────────────────── Resource type (pdf, note)
  └───────────────────────────────────── Custom protocol
```

**Link Handling:**

```typescript
// Register protocol handler in main process
protocol.registerStringProtocol('noto', (request, callback) => {
  const url = new URL(request.url);
  const resourceType = url.hostname;  // 'pdf' or 'note'
  const filePath = url.pathname;
  const page = url.searchParams.get('page');
  const annotationId = url.searchParams.get('annotation');

  // Send to renderer to open file and navigate
  mainWindow.webContents.send('open-resource', {
    type: resourceType,
    path: filePath,
    page: parseInt(page),
    annotationId
  });
});
```

**Bidirectional Links:**

```
PDF Annotation → Markdown Note
    ↓
When user clicks "Quote in note" on annotation:
1. Show file picker (or create new note)
2. Insert citation at cursor position
3. Update annotation.citedIn[] array
4. Save both files

Markdown Note → PDF Annotation
    ↓
When user clicks noto:// link:
1. Parse URL
2. Open PDF in viewer
3. Navigate to page
4. Highlight and scroll to annotation
5. Show annotation note if exists
```

### Search System

**Full-Text Search:**

```typescript
interface SearchIndex {
  // File metadata
  files: Map<string, FileMetadata>;

  // Inverted index: word → [files containing it]
  index: Map<string, Set<string>>;

  // Methods
  indexFile(path: string, content: string): void;
  search(query: string): SearchResult[];
  remove(path: string): void;
}

interface SearchResult {
  filePath: string;
  fileName: string;
  type: 'markdown' | 'pdf';
  matches: SearchMatch[];
  score: number;
}

interface SearchMatch {
  line: number;
  text: string;          // Surrounding context
  highlight: [number, number];  // Start/end of match in text
}
```

**Search Sources:**

1. **Markdown files:** Search full content
2. **PDF files:** Search extracted text (via PDF.js)
3. **PDF annotations:** Search highlighted text and notes

**Indexing Strategy:**

```
On App Start:
  ↓
Load all file paths from IndexedDB
  ↓
Index files in background (low priority)
  ↓
Update index on file changes (high priority)
  ↓
Persist index to IndexedDB (for fast startup)
```

## Inter-Process Communication (IPC)

**Pattern:**

```typescript
// Shared types (src/shared/types.ts)
interface IpcHandlers {
  'file:read': (path: string) => Promise<string>;
  'file:write': (path: string, content: string) => Promise<void>;
  'drive:sync': () => Promise<SyncStatus>;
  // ... more handlers
}

// Main process (src/main/ipc/handlers.ts)
ipcMain.handle('file:read', async (event, path: string) => {
  return await storageService.readFile(path);
});

// Renderer preload (src/preload/index.ts)
contextBridge.exposeInMainWorld('api', {
  readFile: (path: string) => ipcRenderer.invoke('file:read', path),
});

// Renderer usage (src/renderer/services/ipc.ts)
export const ipc = {
  async readFile(path: string): Promise<string> {
    return window.api.readFile(path);
  }
};
```

**Security:**

- Use `contextBridge` (not `nodeIntegration`)
- Validate all IPC inputs in main process
- Sanitize file paths (prevent directory traversal)
- Rate limit IPC calls if needed

## Performance Optimizations

### 1. Lazy Loading

```typescript
// Don't load all files into memory
// Load on-demand when opened

class FileManager {
  openFiles: Map<string, FileContent> = new Map();

  async open(path: string): Promise<FileContent> {
    if (this.openFiles.has(path)) {
      return this.openFiles.get(path);
    }

    const content = await ipc.readFile(path);
    this.openFiles.set(path, content);
    return content;
  }

  close(path: string): void {
    this.openFiles.delete(path);  // Free memory
  }
}
```

### 2. Virtual Scrolling

```typescript
// For large file trees, only render visible items
// Use react-window or react-virtualized

<FixedSizeList
  height={600}
  itemCount={files.length}
  itemSize={24}
>
  {({ index, style }) => (
    <FileItem file={files[index]} style={style} />
  )}
</FixedSizeList>
```

### 3. Debouncing

```typescript
// Auto-save: debounce writes to avoid excessive saves
const debouncedSave = debounce(async (path: string, content: string) => {
  await ipc.writeFile(path, content);
}, 500);

// User types → wait 500ms → save
editor.onChange((content) => {
  debouncedSave(currentFile, content);
});
```

### 4. PDF Rendering

```typescript
// Only render visible pages + buffer
const visiblePages = getCurrentVisiblePages(scrollTop, viewportHeight);
const pagesToRender = [
  visiblePages[0] - 2,  // Buffer above
  ...visiblePages,
  visiblePages[visiblePages.length - 1] + 2  // Buffer below
];

// Unload pages far from viewport
unloadPagesNotIn(pagesToRender);

// Render needed pages
for (const pageNum of pagesToRender) {
  if (!isRendered(pageNum)) {
    await renderPage(pageNum);
  }
}
```

### 5. Sync Batching

```typescript
// Don't upload every keystroke
// Batch file changes and sync periodically

class SyncBatcher {
  dirtyFiles: Set<string> = new Set();

  markDirty(path: string): void {
    this.dirtyFiles.add(path);
  }

  async flush(): Promise<void> {
    const files = Array.from(this.dirtyFiles);
    this.dirtyFiles.clear();
    await syncService.uploadFiles(files);
  }
}

// Flush every 10 seconds or on app blur
setInterval(() => batcher.flush(), 10000);
window.addEventListener('blur', () => batcher.flush());
```

## Security Considerations

### 1. OAuth Token Storage

```typescript
import { safeStorage } from 'electron';

// Encrypt tokens before storing
function storeTokens(tokens: OAuthTokens): void {
  const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
  store.set('oauth_tokens', encrypted);
}

// Decrypt when reading
function loadTokens(): OAuthTokens | null {
  const encrypted = store.get('oauth_tokens');
  if (!encrypted) return null;

  const decrypted = safeStorage.decryptString(encrypted);
  return JSON.parse(decrypted);
}
```

### 2. Input Validation

```typescript
// Validate file paths to prevent directory traversal
function validatePath(path: string): void {
  // Must be relative path
  if (path.startsWith('/') || path.startsWith('\\')) {
    throw new Error('Absolute paths not allowed');
  }

  // No parent directory access
  if (path.includes('..')) {
    throw new Error('Parent directory access not allowed');
  }

  // No suspicious characters
  if (/[<>:"|?*]/.test(path)) {
    throw new Error('Invalid characters in path');
  }
}
```

### 3. Content Security Policy

```html
<!-- In renderer HTML -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:;
               connect-src 'self' https://www.googleapis.com;">
```

## Error Handling

### Strategy

```typescript
// 1. Catch errors at boundaries
try {
  await operation();
} catch (error) {
  handleError(error);
}

// 2. Categorize errors
class NetworkError extends Error {}
class AuthError extends Error {}
class StorageError extends Error {}

// 3. Handle appropriately
function handleError(error: Error): void {
  if (error instanceof NetworkError) {
    // Queue for retry, show "offline" indicator
    showNotification('Network error. Will retry when online.');
  } else if (error instanceof AuthError) {
    // Prompt re-authentication
    showAuthDialog();
  } else {
    // Log and show generic error
    logger.error(error);
    showNotification('An error occurred: ' + error.message);
  }
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoff = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      await sleep(backoff * Math.pow(2, i));
    }
  }
  throw new Error('Unreachable');
}

// Usage
const file = await withRetry(() => driveService.readFile(fileId));
```

## Deployment

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Build renderer (Vite)
npm run build:renderer

# 3. Build main process (TypeScript)
npm run build:main

# 4. Package Electron app
npm run package  # Creates executable

# 5. Create installers
npm run make     # DMG, EXE, AppImage, etc.
```

### Platform-Specific

```json
{
  "build": {
    "appId": "com.noto.app",
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Office"
    }
  }
}
```

### Auto-Update

```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    message: 'A new update is available. Downloading now...'
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    message: 'Update downloaded. Restart to apply?',
    buttons: ['Restart', 'Later']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
```

## Testing Strategy

### Overview

Noto uses a comprehensive testing strategy combining unit tests, integration tests, and end-to-end tests to ensure reliability across all features.

**Testing Tools:**
- **Jest** - Unit and integration testing for TypeScript/React
- **React Testing Library** - Component testing with user-centric queries
- **Playwright** - End-to-end testing of the full Electron application

**Coverage Goals:**
- **Overall:** 80%+ code coverage
- **Critical paths:** 90%+ (authentication, file operations, sync, IPC handlers)
- **New code:** Must maintain or improve overall coverage

For detailed testing guidelines, see [docs/TESTING.md](docs/TESTING.md).

### Unit Tests

Unit tests verify individual functions, services, and components in isolation using Jest and React Testing Library.

**Location:** `__tests__/` directory next to source code

**Examples:**

```typescript
// src/renderer/services/__tests__/markdown.test.ts
import { renderMarkdown, countWords } from '../markdown';

describe('markdown service', () => {
  describe('renderMarkdown', () => {
    it('should render markdown to HTML', () => {
      const result = renderMarkdown('# Hello');
      expect(result).toContain('<h1>');
      expect(result).toContain('Hello');
    });

    it('should render LaTeX math inline', () => {
      const result = renderMarkdown('$E = mc^2$');
      expect(result).toContain('katex');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world test')).toBe(3);
    });

    it('should exclude code blocks', () => {
      const markdown = 'Text\n```\ncode\n```';
      expect(countWords(markdown)).toBe(1);
    });
  });
});

// src/renderer/components/StatusBar/__tests__/StatusBar.test.tsx
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../index';

describe('StatusBar', () => {
  it('should display word count', () => {
    render(<StatusBar wordCount={42} />);
    expect(screen.getByText(/42 words/i)).toBeInTheDocument();
  });

  it('should show dirty indicator when unsaved', () => {
    render(<StatusBar isDirty={true} />);
    expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
  });
});

// Testing annotation service
describe('AnnotationService', () => {
  it('should merge annotations by ID', () => {
    const local = [{ id: '1', text: 'A' }];
    const remote = [{ id: '1', text: 'A' }, { id: '2', text: 'B' }];

    const merged = mergeAnnotations(local, remote);

    expect(merged).toHaveLength(2);
    expect(merged.map(a => a.id)).toEqual(['1', '2']);
  });
});
```

### E2E Tests (Playwright)

End-to-end tests verify complete user workflows in the actual Electron application.

**Location:** `e2e/` directory at project root

**Examples:**

```typescript
// e2e/app.spec.ts
import { test, expect } from '@playwright/test';
import { launchApp } from './setup';

test('app launches successfully', async () => {
  const app = await launchApp();
  const window = await app.firstWindow();

  expect(await window.title()).toBe('Noto');

  await app.close();
});

// e2e/markdown-editor.spec.ts
test('complete markdown editing workflow', async () => {
  const app = await launchApp();
  const window = await app.firstWindow();

  // Create new file
  await window.click('[data-testid="new-file"]');
  await window.fill('[data-testid="filename-input"]', 'test.md');
  await window.press('[data-testid="filename-input"]', 'Enter');

  // Type markdown content
  await window.fill('.monaco-editor textarea', '# Test Note\n\nSome content');

  // Wait for auto-save
  await window.waitForSelector('[data-testid="saved-indicator"]');

  // Verify word count
  const statusBar = await window.textContent('.status-bar');
  expect(statusBar).toContain('3 words');

  // Verify preview updates
  const preview = await window.textContent('.markdown-preview');
  expect(preview).toContain('Test Note');

  await app.close();
});

// e2e/pdf-viewer.spec.ts (Phase 3+)
test('create note and sync', async () => {
  const app = await launchApp();
  const window = await app.firstWindow();

  // Launch app
  await window.goto('app://.');

  // Create new note
  await window.click('[data-testid="new-file"]');
  await window.fill('[data-testid="filename"]', 'test.md');

  // Write content
  await window.click('[data-testid="editor"]');
  await window.keyboard.type('# Test Note');

  // Wait for auto-save
  await window.waitForSelector('[data-testid="sync-done"]');

  // Verify synced to Drive
  const files = await driveService.listFiles();
  expect(files).toContainEqual(
    expect.objectContaining({ name: 'test.md' })
  );

  await app.close();
});
```

### Continuous Integration

All tests run automatically via GitHub Actions on:
- Every push to `main` branch
- Every pull request

**CI Workflow:**
1. Lint code (`npm run lint`)
2. Run unit tests with coverage (`npm run test:coverage`)
3. Build application (`npm run build`)
4. Run E2E tests (`npm run test:e2e`)

**Coverage reporting:**
- Coverage reports uploaded to Codecov
- PR comments show coverage diff
- Build fails if coverage drops below threshold

## Monitoring & Logging

```typescript
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Log file location
console.log(log.transports.file.getFile().path);
// macOS: ~/Library/Logs/Noto/main.log
// Windows: %USERPROFILE%\AppData\Roaming\Noto\logs\main.log
// Linux: ~/.config/Noto/logs/main.log

// Usage
log.info('App started');
log.error('Sync failed', error);
log.debug('File opened', { path });
```

## Future Enhancements

### Plugin System

```typescript
interface Plugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

interface PluginContext {
  registerCommand(id: string, handler: () => void): void;
  registerFileType(extension: string, viewer: React.Component): void;
  registerTheme(theme: Theme): void;
}

// Example plugin
class VimModePlugin implements Plugin {
  activate(context: PluginContext): void {
    context.registerCommand('toggle-vim-mode', () => {
      editor.setOption('keyMap', 'vim');
    });
  }
}
```

### Graph View

```typescript
// Visualize connections between notes
// Parse [[wikilinks]] from markdown
// Build graph with D3.js or Cytoscape

interface NoteGraph {
  nodes: Array<{ id: string; label: string; type: 'note' | 'pdf' }>;
  edges: Array<{ source: string; target: string; type: 'link' | 'citation' }>;
}
```

---

**Last updated:** 2025-10-18
**Version:** 1.0.0
