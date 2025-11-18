# Changelog

All notable changes to Noto will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - TBD

### Added

#### Phase 1: Foundation
- Local file storage with workspace management
- File explorer with tree view for markdown and PDF files
- IPC infrastructure for secure main-renderer communication
- VSCode-inspired UI with dark theme
- Type-safe IPC handlers using TypeScript

#### Phase 2: Markdown Editor
- Monaco Editor integration (same editor as VSCode)
- Live markdown preview with bidirectional scrolling
- LaTeX math rendering (inline `$...$` and block `$$...$$`)
- Syntax highlighting for code blocks
- Auto-save with 500ms debounce
- Word count display in status bar
- WYSIWYG editing experience

#### Phase 3: PDF Viewer
- Full PDF rendering with PDF.js integration
- Page navigation and thumbnails
- Zoom controls (50%-300%)
- Text selection and copying
- In-document search
- Performance optimization with page virtualization

#### Phase 4: PDF Annotations
- Highlight tool with 5 color options
- Sticky note annotations
- Area selection tool
- Annotations sidebar with filtering
- Context menu for edit/delete operations
- JSON-based storage (`.pdf.annotations.json` files)
- Percentage-based coordinates (zoom-independent)

#### Phase 5: Citation System
- Custom `noto://` protocol handler
- "Quote in Note" feature for PDF highlights
- Citation link rendering in markdown preview
- Backlinks panel showing all citations
- Bidirectional linking between notes and PDFs
- Click citations to jump to specific PDF annotations

#### Phase 6: Google Drive Sync
- OAuth 2.0 authentication flow
- Google Drive API integration
- IndexedDB cache for offline access
- Sync queue with automatic retry logic
- Conflict resolution (last-write-wins)
- Background watcher for changes
- Sync status indicators in UI
- Folder picker for Drive workspace

#### Phase 7: Polish & Features
- Full-text search across notes and PDFs
- Command palette (Cmd/Ctrl+P) for quick navigation
- Settings panel with user preferences
- Keyboard shortcuts system
- Export to HTML and PDF
- Multiple tabs support
- Recent files tracking
- Enhanced UI/UX polish

#### Phase 8: Build & Distribution
- Application icons for macOS, Windows, and Linux
- Code signing configuration for macOS and Windows
- Auto-updater with electron-updater
- DMG installer for macOS (with custom background)
- NSIS installer for Windows (with license agreement)
- AppImage, deb, and rpm packages for Linux
- Multi-architecture support (x64, arm64)
- GitHub Actions release workflow
- Build validation scripts
- Comprehensive release process

### Technical Highlights

- **Electron** - Desktop framework with main/renderer process separation
- **React + TypeScript** - Strict type safety throughout
- **Monaco Editor** - Professional code editing experience
- **PDF.js** - Robust PDF rendering
- **markdown-it + KaTeX** - Markdown and LaTeX support
- **Tailwind CSS** - Utility-first styling
- **Google Drive API** - Cloud synchronization
- **electron-builder** - Multi-platform builds
- **Jest + Playwright** - Unit and E2E testing
- **GitHub Actions** - Automated CI/CD

### Security

- Context isolation enabled (no nodeIntegration)
- Sandboxed renderer process
- Type-safe IPC with contextBridge
- OAuth token encryption with safeStorage
- Input validation for file paths
- Content Security Policy (CSP)
- Code signing for distribution

### Documentation

- ARCHITECTURE.md - Technical architecture
- ROADMAP.md - Development phases
- QUICKSTART.md - Getting started guide
- CODE_SIGNING.md - Code signing setup
- docs/SYNC_STRATEGY.md - Google Drive sync details
- docs/PDF_ANNOTATIONS.md - Annotation system details
- CLAUDE.md - AI assistant guidance

### Known Limitations

- Google Drive sync requires internet connection
- Auto-updates not available on Linux (use package managers)
- Large PDFs (>100 pages) may have slower initial load
- LaTeX rendering limited to KaTeX-supported commands

### Upgrade Notes

This is the initial v1.0.0 release. Future versions will include upgrade notes here.

---

## [Unreleased]

### Planned Features

- Additional cloud storage providers (Dropbox, OneDrive)
- Collaborative editing
- Mobile companion apps
- Advanced PDF editing (not just annotations)
- Bibliography management (BibTeX integration)
- Custom themes and UI customization
- Plugin system for extensions
- Zotero integration

---

[1.0.0]: https://github.com/your-username/noto/releases/tag/v1.0.0
[Unreleased]: https://github.com/your-username/noto/compare/v1.0.0...HEAD
