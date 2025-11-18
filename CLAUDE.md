# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Noto** is a desktop research and note-taking application for academic workflows. It combines Obsidian-style markdown editing with Zotero-like PDF annotation in a VSCode-inspired interface.

### Core Features
1. Markdown editor with LaTeX support (Monaco Editor)
2. PDF annotation (highlights, notes, bidirectional linking)
3. Quote PDF segments directly into markdown notes
4. Google Drive synchronization with offline support
5. Full-text search across notes and PDFs
6. Command palette for quick navigation (Cmd/Ctrl+P)
7. Multiple tabs support
8. Export to HTML/PDF
9. Recent files tracking
10. Keyboard shortcuts

### Tech Stack
- **Electron** - Desktop framework with main/renderer process separation
- **React + TypeScript** - UI with strict type safety
- **Monaco Editor** - Same editor as VSCode
- **PDF.js** - PDF rendering and text extraction
- **markdown-it + KaTeX** - Markdown and LaTeX rendering
- **Tailwind CSS** - Styling
- **Google Drive API** - Cloud sync (planned)

## Development Commands

```bash
# Development (concurrent main + renderer processes)
npm run dev

# Build
npm run build              # Build both main and renderer
npm run build:renderer     # Vite build (React app)
npm run build:main         # TypeScript build (Electron main)

# Testing
npm run test              # Run Jest tests
npm run test:watch        # Watch mode

# Linting
npm run lint              # ESLint

# Production
npm run start             # Run built app
npm run package           # Package as executable
npm run make              # Create installers (DMG, EXE, AppImage)

# Cleanup
npm run clean             # Remove dist/
```

## Project Structure

```
noto/
├── src/
│   ├── main/                    # Electron main process (Node.js)
│   │   ├── index.ts            # App lifecycle, window creation
│   │   ├── ipc/                # IPC handler registration
│   │   │   ├── index.ts        # Central handler registry
│   │   │   └── file-handlers.ts # File operation handlers
│   │   └── services/
│   │       └── LocalStorage.ts  # File system operations
│   ├── renderer/                # React app (browser)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── FileExplorer/   # Sidebar file tree
│   │   │   ├── Editor/         # Monaco + markdown preview
│   │   │   ├── Layout/         # Main layout container
│   │   │   └── StatusBar/      # Bottom status bar
│   │   ├── services/
│   │   │   └── markdown.ts     # Markdown rendering utilities
│   │   └── hooks/
│   │       └── useFileContent.ts # File load/save with auto-save
│   ├── preload/                # Electron preload (IPC bridge)
│   │   └── index.ts            # Exposes type-safe IPC API
│   └── shared/                  # Shared types (main + renderer)
│       └── types.ts            # All TypeScript interfaces
├── docs/                        # Architecture documentation
├── resources/                   # App icons, assets
└── scripts/                     # Build scripts
```

## Architecture: Main vs Renderer

### Main Process (src/main/)
- **Owns**: File system, Google Drive API, background sync, OAuth tokens
- **Runs**: Node.js with full system access
- **Communication**: Receives IPC requests from renderer

### Renderer Process (src/renderer/)
- **Owns**: UI, user interactions, React state
- **Runs**: Chromium (browser context, sandboxed)
- **Communication**: Sends IPC requests to main, receives events

### Preload Script (src/preload/)
- **Bridge**: Safely exposes main process APIs to renderer
- **Security**: Uses `contextBridge` (NOT `nodeIntegration`)
- **Type Safety**: Enforces `IpcHandlers` interface

## Type-Safe IPC Pattern

**Critical**: All IPC communication follows this pattern for type safety.

### 1. Define Handler Signature (src/shared/types.ts)
```typescript
export interface IpcHandlers {
  'file:read': (path: string) => Promise<string>;
  'file:write': (path: string, content: string) => Promise<void>;
  // ... all handlers
}
```

### 2. Implement Handler (src/main/ipc/)
```typescript
import { ipcMain } from 'electron';

ipcMain.handle('file:read', async (event, path: string) => {
  return await localStorageService.readFile(path);
});
```

### 3. Expose in Preload (src/preload/index.ts)
```typescript
const api: {
  [K in keyof IpcHandlers]: (...args: Parameters<IpcHandlers[K]>) => ReturnType<IpcHandlers[K]>
} = {
  'file:read': (path: string) => ipcRenderer.invoke('file:read', path),
  // ... all handlers
};

contextBridge.exposeInMainWorld('api', api);
```

### 4. Use in Renderer
```typescript
const content = await window.api['file:read']('path/to/file.md');
```

**Why this pattern?**
- Compile-time type checking prevents mismatches
- Auto-completion in IDE
- Single source of truth (IpcHandlers interface)
- No runtime type errors

## Current Implementation Status

### ✅ Phase 0: CI/CD & Testing (Complete)
- Jest unit testing framework
- ESLint + Prettier code quality
- GitHub Actions CI pipeline
- Playwright E2E testing setup

### ✅ Phase 1: Foundation (Complete)
- Local file storage with LocalStorage service
- File explorer with tree view
- IPC infrastructure
- VSCode-inspired UI

### ✅ Phase 2: Markdown Editor (Complete)
- Monaco Editor integration
- Live markdown preview
- LaTeX math rendering ($inline$, $$block$$)
- Code syntax highlighting
- Auto-save (500ms debounce)
- Word count in status bar

### ✅ Phase 3: PDF Viewer (Complete)
- PDF.js integration with worker
- Full PDF rendering with navigation
- Zoom controls (50%-300%)
- Thumbnail sidebar
- Text selection and copying
- In-PDF search

### ✅ Phase 4: PDF Annotations (Complete)
- AnnotationService with CRUD operations
- JSON storage (.pdf.annotations.json files)
- SVG overlay layer
- Highlight tool with 5 colors
- Sticky note tool
- Area selection tool
- Annotations sidebar
- Context menu for edit/delete

### ✅ Phase 5: Citation System (Complete)
- Custom noto:// protocol handler
- Citation formatting service
- "Quote in Note" feature
- Citation link rendering in preview
- Backlinks panel

### ✅ Phase 6: Google Drive Sync (Complete)
- OAuth 2.0 authentication
- Google Drive API integration
- IndexedDB cache layer
- Sync queue with retry logic
- Conflict resolution
- Background watcher
- Sync status indicators

### ✅ Phase 7: Polish & Features (Complete)
- **Full-text search** across notes and PDFs (PR-036)
- **Command palette** for quick navigation (PR-038)
- **Settings panel** for preferences (PR-039)
- **Keyboard shortcuts** system (PR-041)
- **Export to HTML/PDF** (PR-042)
- **Multiple tabs** support (PR-043)
- **Recent files** tracking (PR-044)

### ✅ Phase 8: Build & Distribution (Complete)
- App icons for all platforms (macOS .icns, Windows .ico, Linux .png)
- Code signing configuration (macOS hardened runtime + entitlements, Windows Authenticode)
- Auto-updater with electron-updater (background checks, download progress, install & restart)
- Enhanced installers (DMG with custom window, NSIS with license, deb/rpm packages)
- Multi-architecture support (x64, arm64)
- GitHub Actions release workflow (automated builds for all platforms)
- Build validation and smoke tests
- Comprehensive documentation (CODE_SIGNING.md, release scripts)
- Final release v1.0.0 preparation

## Critical Implementation Details

### Annotation Storage Format

Annotations stored as JSON alongside PDFs:
```
MyResearch/
├── paper.pdf
└── .paper.pdf.annotations.json
```

**Schema:**
```typescript
interface AnnotationFile {
  version: number;               // Schema version for migrations
  pdfPath: string;
  annotations: Annotation[];
}

interface Annotation {
  id: string;                    // UUID v4
  type: 'highlight' | 'note' | 'area';
  pageNumber: number;            // 1-indexed
  bounds: Rectangle;             // % coordinates (scale-independent)
  color?: string;                // Hex color
  text?: string;                 // Extracted text (highlights)
  note?: string;                 // User comment
  createdAt: string;             // ISO 8601
  modifiedAt: string;
  citedIn?: string[];            // Markdown files citing this annotation
}

interface Rectangle {
  x: number;      // % from left (0-100)
  y: number;      // % from top (0-100)
  width: number;  // % of page width
  height: number; // % of page height
}
```

**Why percentages?** PDFs can be zoomed; percentages are scale-independent.

### Citation Link Format

When quoting PDF highlights into markdown:

```markdown
> "Quoted text from the PDF"
> — [paper.pdf, p. 42](noto://pdf/path/to/paper.pdf#page=42&annotation=uuid-here)
```

**Custom URL scheme breakdown:**
```
noto://pdf/MyResearch/paper.pdf#page=42&annotation=a1b2c3d4
  │    │   │                      │         │
  │    │   │                      │         └─ Annotation ID (to highlight)
  │    │   │                      └─────────── Page number
  │    │   └──────────────────────────────────Relative path from workspace root
  │    └──────────────────────────────────────Resource type (pdf/note)
  └───────────────────────────────────────────Custom protocol
```

The app registers `noto://` protocol to open PDFs at specific annotations.

### Sync Strategy (Planned - Phase 6)

**Three-tier architecture:**
1. **Google Drive** - Cloud source of truth
2. **IndexedDB** - Local cache (fast access)
3. **Memory** - Currently open files

**Flow:**
- **App start**: Sync down from Drive → IndexedDB
- **File open**: Load from IndexedDB (instant) → check Drive in background
- **File save**: Write to IndexedDB → queue for Drive upload
- **Background**: Poll Drive every 30s for changes

**Conflict resolution:**
- **Files**: Last-write-wins (timestamp comparison)
- **Annotations**: Merge by ID (annotations are append-only)
- **Failed merge**: Show conflict UI

### Auto-Save Implementation

Current implementation in `useFileContent.ts`:
```typescript
// Debounce saves to 500ms after user stops typing
const debouncedSave = useDebouncedCallback(
  async (path: string, content: string) => {
    await window.api['file:write'](path, content);
    setIsDirty(false);
  },
  500
);

// Also save on file switch or unmount
useEffect(() => {
  return () => {
    if (isDirty && currentFile) {
      window.api['file:write'](currentFile, content);
    }
  };
}, [currentFile, content, isDirty]);
```

## Common Development Tasks

### Adding a New IPC Handler

1. **Define type** in `src/shared/types.ts`:
   ```typescript
   export interface IpcHandlers {
     'new:operation': (arg: string) => Promise<Result>;
   }
   ```

2. **Implement handler** in `src/main/ipc/`:
   ```typescript
   ipcMain.handle('new:operation', async (event, arg: string) => {
     return await someService.doOperation(arg);
   });
   ```

3. **Expose in preload** (`src/preload/index.ts`):
   ```typescript
   const api = {
     'new:operation': (arg: string) => ipcRenderer.invoke('new:operation', arg),
   };
   ```

4. **Use in renderer**:
   ```typescript
   const result = await window.api['new:operation'](arg);
   ```

### Debugging

**Renderer Process:**
- DevTools: F12 or View → Toggle DevTools
- Logs go to browser console
- React DevTools available

**Main Process:**
```bash
npm run dev:main -- --inspect
# Then attach Chrome DevTools to node process
```

**IPC Issues:**
- Check both main and renderer console outputs
- Verify handler is registered in `src/main/ipc/index.ts`
- Verify API is exposed in `src/preload/index.ts`
- Check that `IpcHandlers` interface matches

### Hot Reload Behavior

- **Renderer changes** (React, CSS): Hot reload automatically
- **Main process changes** (IPC, services): Restart with Cmd/Ctrl+R in app
- **Preload changes**: Full restart required

## File Locations

- **Workspace**: `~/.config/noto/workspace/` (Linux/macOS) or `%APPDATA%/noto/workspace/` (Windows)
- **Logs**: Electron console when running `npm run dev`
- **Settings**: Future - will be in `~/.config/noto/config.json`

## Performance Patterns

### File Loading
- Lazy load file contents (don't load all files into memory)
- Only load when file is opened
- Unload when file is closed
- Use Map for open files cache

### PDF Rendering (Phase 3)
- Only render visible pages ± 2 page buffer
- Use web workers for PDF.js parsing
- Cache rendered canvas elements
- Unload off-screen pages

### Auto-Save
- Debounce to 500ms (current implementation)
- Batch sync uploads (don't upload every keystroke)
- Flush sync queue on app blur/close

### Search (Phase 7)
- Index files on startup in background
- Incremental indexing on file changes
- Use Fuse.js or similar for fuzzy search

## Security

### OAuth Tokens (Phase 6)
```typescript
import { safeStorage } from 'electron';

// Encrypt before storing
const encrypted = safeStorage.encryptString(JSON.stringify(tokens));
store.set('oauth_tokens', encrypted);

// Decrypt when reading
const decrypted = safeStorage.decryptString(encrypted);
const tokens = JSON.parse(decrypted);
```

### Input Validation
Always validate file paths to prevent directory traversal:
```typescript
function validatePath(path: string): void {
  if (path.startsWith('/') || path.includes('..')) {
    throw new Error('Invalid path');
  }
}
```

### Content Security Policy
Already configured in `index.html` to restrict external resources.

## Known Patterns & Conventions

### Component Organization
```
ComponentName/
├── index.tsx              # Main component
├── types.ts              # Component-specific types (if needed)
└── hooks/                # Component-specific hooks
    └── useComponentName.ts
```

### State Management
- **Local UI**: `useState` / `useReducer`
- **File state**: React Context (future FilesContext)
- **Sync state**: React Context (future SyncContext)
- **Settings**: Electron Store (persisted to disk)

**No Redux/MobX** - Keep it simple with Context API.

### Error Handling
Always wrap IPC calls:
```typescript
try {
  const result = await window.api['file:read'](path);
  return result;
} catch (error) {
  console.error('Failed to read file:', error);
  // Show user-friendly notification
  // Graceful degradation
}
```

## Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [KaTeX](https://katex.org/docs/api.html)

## Documentation Files

- **ARCHITECTURE.md** - Detailed technical architecture and diagrams
- **ROADMAP.md** - Development phases and current status
- **QUICKSTART.md** - Getting started guide
- **PHASE2_COMPLETE.md** - Phase 2 completion summary
- **docs/SYNC_STRATEGY.md** - Google Drive sync specification
- **docs/PDF_ANNOTATIONS.md** - PDF annotation system details

## Key Principles

1. **Type Safety First** - Use TypeScript strictly, no `any` types
2. **Offline-First** - Assume network can fail anytime
3. **Test Sync** - It's the most critical feature
4. **Keep It Simple** - Avoid over-engineering
5. **Security** - Use `contextBridge`, validate inputs, encrypt tokens
6. **Performance** - Lazy load, debounce, virtual scroll for large lists
