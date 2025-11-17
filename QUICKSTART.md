# Noto - Quick Start Guide

**Last Updated:** 2025-01-17
**Current Version:** 0.2.0-alpha

## What's Been Built

✅ **Phase 1 Complete: Foundation & File System**
✅ **Phase 2 Complete: Markdown Editor**

You now have a working markdown editor with:
- Local file storage system
- File explorer sidebar with tree view
- Monaco Editor (VSCode's editor)
- Live markdown preview
- LaTeX math rendering
- Code syntax highlighting
- Auto-save functionality
- Type-safe IPC communication

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development

```bash
npm run dev
```

This will:
- Start the Vite dev server for React
- Launch Electron with hot reload
- Open DevTools automatically

### 3. Try It Out

Once the app launches:

1. **Create a new file**
   - Click the "New File" icon (📄) in the sidebar header
   - Enter a filename (e.g., "notes.md")
   - The file will appear in the file explorer

2. **Create a new folder**
   - Click the "New Folder" icon (📁)
   - Enter a folder name
   - The folder will appear in the tree

3. **Open a file**
   - Click on any file in the sidebar
   - The editor pane will show placeholders for now

4. **Files are stored locally**
   - Location: `~/.config/noto/workspace/` (Linux/macOS)
   - Or: `%APPDATA%/noto/workspace/` (Windows)

## Project Structure (Completed)

```
src/
├── main/                           ✅ Complete
│   ├── index.ts                   # App entry, initialization
│   ├── ipc/
│   │   ├── index.ts              # IPC handler registration
│   │   └── file-handlers.ts      # File operation handlers
│   └── services/
│       └── LocalStorage.ts       # File system service
├── renderer/                       ✅ Complete
│   ├── App.tsx                    # Root component
│   ├── components/
│   │   ├── FileExplorer/          # Sidebar file browser
│   │   │   ├── index.tsx
│   │   │   ├── FileTree.tsx
│   │   │   └── FileItem.tsx
│   │   ├── Layout/                # Main app layout
│   │   │   ├── index.tsx
│   │   │   └── EditorPane.tsx
│   │   └── StatusBar/             # Bottom status bar
│   │       └── index.tsx
│   └── main.tsx                   # React entry point
├── shared/                         ✅ Complete
│   └── types.ts                   # Shared TypeScript types
└── preload/                        ✅ Complete
    └── index.ts                   # IPC bridge (secure)
```

## What Works Now

### Markdown Editing
- Full markdown support with live preview
- LaTeX math: `$inline$` and `$$block$$` equations
- Code blocks with syntax highlighting
- Auto-save (500ms after you stop typing)
- Word count in status bar
- "● Modified" indicator for unsaved changes

### File Management
- Create markdown files and folders
- File tree navigation
- Local storage in `~/.config/noto/workspace/` (or `%APPDATA%\noto\workspace\` on Windows)

### Editor Features
- Monaco Editor (same as VSCode)
- Syntax highlighting
- Find & Replace (Cmd/Ctrl+F)
- Multi-cursor editing
- Line numbers

## What's Next: Phase 0 - CI/CD & Testing

⚠️ **Before adding new features, we need testing infrastructure:**

1. **PR-001:** Jest unit testing
2. **PR-002:** ESLint + Prettier
3. **PR-003:** GitHub Actions CI
4. **PR-004:** Playwright E2E testing
5. **PR-005:** Documentation

**Why?** All future PRs require passing tests and CI checks.

**After Phase 0:** Begin Phase 3 (PDF Viewer)

See [ROADMAP.md](ROADMAP.md) and [PR_ROADMAP.md](PR_ROADMAP.md) for complete development plan.

## Development Tips

### Hot Reload

- **Renderer changes** (React components, CSS) - Hot reload automatically
- **Main process changes** (IPC handlers, services) - Restart with `Cmd/Ctrl + R`

### Debugging

- **Renderer**: DevTools open automatically (F12 or View → Toggle DevTools)
- **Main Process**: Run with `--inspect` flag and attach Chrome DevTools

### File Locations

- **Workspace**: `~/.config/noto/workspace/` (or `%APPDATA%/noto/workspace/`)
- **Logs**: Check console output when running `npm run dev`
- **Settings**: Will be stored in `~/.config/noto/config.json` (future)

### Common Issues

**"Cannot find module" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Electron won't start:**
```bash
npm run build:main  # Rebuild main process
npm run dev
```

**IPC not working:**
- Check `src/preload/index.ts` is exposing the API
- Verify handlers are registered in `src/main/ipc/index.ts`
- Look for errors in both main and renderer consoles

## Testing the File System

Try these commands in the DevTools console (renderer):

```javascript
// List all files
await window.api['file:list']('')

// Create a test file
await window.api['file:create']('test.md', 'markdown')

// Write content
await window.api['file:write']('test.md', '# Hello World\n\nThis is a test.')

// Read content
await window.api['file:read']('test.md')

// Delete file
await window.api['file:delete']('test.md')
```

## Building for Production

Once you're ready to create a distributable app:

```bash
# Build everything
npm run build

# Create installers
npm run make
```

Installers will be in the `release/` directory.

## Documentation

- **CLAUDE.md** - AI assistant guide (architecture, patterns, debugging)
- **ARCHITECTURE.md** - Technical architecture and system design
- **README.md** - User-facing documentation
- **docs/SYNC_STRATEGY.md** - Google Drive sync specification
- **docs/PDF_ANNOTATIONS.md** - PDF annotation system

## Next Steps

1. **Run the app**: `npm run dev`
2. **Create some test files** to see the file explorer in action
3. **Review CLAUDE.md** for guidance on adding Monaco Editor next
4. **Check the console** for log messages showing storage initialization

Happy coding! 🚀
