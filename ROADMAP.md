# Noto Development Roadmap

**Current Version:** 0.2.0-alpha
**Target Version:** 1.0.0
**Last Updated:** 2025-01-17

---

## Current Status

**Completion:** 2/8 Phases (25%)

- ✅ **Phase 1:** Foundation & File System (Complete)
- ✅ **Phase 2:** Markdown Editor (Complete)
- 🚧 **Phase 0:** CI/CD & Testing (Next - MUST DO FIRST)
- 🚧 **Phase 3:** PDF Viewer
- 🚧 **Phase 4:** PDF Annotations
- 🚧 **Phase 5:** Citation System
- 🚧 **Phase 6:** Google Drive Sync
- 🚧 **Phase 7:** Polish & Features
- 🚧 **Phase 8:** Build & Distribution

---

## Detailed Documentation

For complete development plans, see:

- **[PR_ROADMAP.md](PR_ROADMAP.md)** - All 52 PRs with detailed specifications
- **[PR_DEPENDENCIES.md](PR_DEPENDENCIES.md)** - PR ordering and parallelization guide
- **[STATUS.md](STATUS.md)** - Current implementation audit
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

---

## Phase Overview

### ✅ Phase 1: Foundation (Complete)

**Status:** 100% Complete
**Time Spent:** 2 weeks

**Delivered:**
- Electron + Vite + React + TypeScript setup
- Local file storage system
- File explorer with tree view
- IPC infrastructure
- VSCode-inspired UI

### ✅ Phase 2: Markdown Editor (Complete)

**Status:** 100% Complete
**Time Spent:** 1 week

**Delivered:**
- Monaco Editor integration
- Live markdown preview
- LaTeX math rendering (KaTeX)
- Code syntax highlighting
- Auto-save (500ms debounce)
- Word count tracking

### 🚧 Phase 0: CI/CD & Testing (NEXT)

**Status:** Not Started
**Estimated Time:** 2 weeks
**PRs:** PR-001 through PR-005

**⚠️ CRITICAL: Must complete before other development**

**Goals:**
- Jest unit testing framework
- ESLint + Prettier code quality
- GitHub Actions CI pipeline
- Playwright E2E testing
- Contributing documentation

**Why First:**
All future PRs require passing tests and CI checks.

**Next Step:** Start with PR-001 (Jest setup)

### 🚧 Phase 3: PDF Viewer (After Phase 0)

**Status:** Not Started
**Estimated Time:** 2 weeks
**PRs:** PR-006 through PR-012

**Goals:**
- PDF.js integration
- Basic PDF rendering
- Page navigation (prev/next, jump to page)
- Zoom controls (fit-width, fit-page, custom)
- Thumbnail sidebar
- Text selection
- In-PDF search
- Drag-and-drop import

**Dependencies Ready:**
- ✅ pdfjs-dist installed
- ✅ Types defined
- ✅ UI placeholder ready

### 🚧 Phase 4: PDF Annotations (After Phase 3)

**Status:** Not Started
**Estimated Time:** 2 weeks
**PRs:** PR-013 through PR-020

**Goals:**
- Annotation storage service
- `.pdf.annotations.json` files
- SVG overlay layer
- Highlight tool (5 colors)
- Sticky note tool
- Area selection tool
- Annotations sidebar
- Edit/delete annotations

### 🚧 Phase 5: Citation System (After Phase 4)

**Status:** Not Started
**Estimated Time:** 2 weeks
**PRs:** PR-021 through PR-025

**Goals:**
- Custom `noto://` protocol handler
- Citation formatting service
- "Quote in Note" feature
- Citation link rendering in preview
- Backlinks panel

**Key Feature:**
Quote PDF highlights directly into markdown with bidirectional links.

### 🚧 Phase 6: Google Drive Sync (After Phase 5)

**Status:** Not Started
**Estimated Time:** 3 weeks
**PRs:** PR-026 through PR-035

**⚠️ Most Complex Phase**

**Goals:**
- Google Cloud Console setup
- OAuth 2.0 authentication
- Google Drive API integration
- IndexedDB cache layer
- Sync engine (upload/download)
- Sync queue with retry logic
- Conflict resolution
- Background watcher (poll every 30s)
- Sync status indicators
- Folder selection UI

**Prerequisites:**
- Google Cloud project
- OAuth credentials
- Drive API enabled

### 🚧 Phase 7: Polish & Features (After Phase 6)

**Status:** Not Started
**Estimated Time:** 2 weeks
**PRs:** PR-036 through PR-045

**Goals:**
- Full-text search (indexing + UI)
- Command palette (Cmd/Ctrl+P)
- Settings panel
- Dark/light theme toggle
- Keyboard shortcuts
- Export to PDF/HTML
- Multiple tabs
- Recent files list
- Performance optimization

### 🚧 Phase 8: Build & Distribution (Final)

**Status:** Not Started
**Estimated Time:** 3 weeks
**PRs:** PR-046 through PR-052

**Goals:**
- App icons for all platforms
- Code signing (macOS + Windows)
- Notarization (macOS)
- Auto-updater
- Crash reporting (optional)
- Complete E2E test suite
- Final documentation
- **v1.0.0 Release**

**Deliverables:**
- Windows installer (.exe)
- macOS installer (.dmg)
- Linux packages (AppImage, .deb)

---

## Timeline Estimates

### Sequential (1 instance):
**Total:** 20-24 weeks

### With 6 Parallel Instances:
**Total:** 12-14 weeks
- Phase 0: 2 weeks (mostly sequential)
- Phase 3: 1-2 weeks (high parallelization)
- Phase 4: 1-2 weeks (medium parallelization)
- Phase 5: 1-2 weeks (mostly sequential)
- Phase 6: 2-3 weeks (complex, some parallelization)
- Phase 7: 1-2 weeks (high parallelization)
- Phase 8: 2-3 weeks (mixed)

### With 10+ Parallel Instances:
**Total:** 10-12 weeks
- Maximum parallelization
- Requires careful coordination
- See [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md)

---

## Feature Roadmap

### v0.2.0 (Current) ✅
- Markdown editor with Monaco
- LaTeX math rendering
- Local file storage
- Auto-save

### v0.3.0 (Phase 3 Complete)
- PDF viewing with navigation
- PDF zoom controls
- Text selection in PDFs
- In-PDF search

### v0.5.0 (Phase 4 Complete)
- PDF annotations (highlights, notes)
- Annotation management
- Annotation sidebar

### v0.7.0 (Phase 5 Complete)
- Citation system
- Quote PDFs in markdown
- Bidirectional links
- Backlinks panel

### v0.9.0 (Phase 6 Complete)
- Google Drive sync
- Offline support
- Conflict resolution
- Cross-device synchronization

### v1.0.0 (All Phases Complete) 🎯
- All features above
- Full-text search
- Command palette
- Settings UI
- Multiple themes
- Windows/Mac/Linux installers
- Auto-updates
- Production ready

### v2.0+ (Future)
- Real-time collaboration
- Graph view of notes
- Zotero integration
- BibTeX reference manager
- Mobile companion app
- Plugin system
- Web clipper extension
- OCR for scanned PDFs

---

## Critical Path

**These PRs cannot be parallelized (must be sequential):**

1. PR-001 (Jest) - Foundation for all testing
2. PR-003 (GitHub Actions) - Enables CI/CD
3. PR-004 (Playwright) - E2E testing framework
4. PR-006 (PDF.js) - Foundation for all PDF work
5. PR-013 (Annotation Storage) - Foundation for annotations
6. PR-014 (SVG Layer) - Required for rendering annotations
7. PR-026 (OAuth) - Foundation for sync
8. PR-027 (Drive API) - Required for sync operations
9. PR-029 (Sync Queue) - Required for sync orchestration
10. PR-030 (Download) - First sync direction
11. PR-031 (Upload) - Second sync direction
12. PR-032 (Conflicts) - Handle merge conflicts
13. PR-047 (Code Signing) - Required for distribution
14. PR-048 (Auto-Updater) - Final distribution feature
15. PR-052 (Release) - Final release

**Keep the critical path moving!** Always have at least one instance working on these PRs.

---

## Parallelization Opportunities

**High Parallelization (6+ instances):**
- Phase 3: PR-007, PR-008, PR-009, PR-010, PR-012 (after PR-006)
- Phase 4: PR-015, PR-016, PR-017, PR-019 (after PR-014)
- Phase 7: PR-036, PR-038, PR-039, PR-041, PR-042, PR-043, PR-044

**Medium Parallelization (3-4 instances):**
- Phase 5: PR-021, PR-022 can start together
- Phase 6: PR-028 parallel with PR-027

**Low Parallelization (1-2 instances):**
- Phase 0: Mostly sequential (foundation)
- Phase 5: Mostly sequential (complex dependencies)
- Phase 8: Mixed (some parallel, some sequential)

See [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md) for detailed parallelization strategies.

---

## Success Metrics

**Code Quality:**
- 500+ tests passing
- 80%+ code coverage
- Zero TypeScript errors
- Zero ESLint errors
- < 5 minute CI runs

**Features:**
- All 8 phases complete
- All 52 PRs merged
- All acceptance criteria met
- Windows installer working
- Auto-updates working

**Documentation:**
- All docs up to date
- API documentation complete
- User guide complete
- Contributing guide complete

---

## Current Priorities

### Week 1-2 (Immediate):
1. **PR-001:** Jest setup - ⚠️ START HERE
2. **PR-002:** ESLint/Prettier (parallel with PR-001)
3. **PR-003:** GitHub Actions CI
4. **PR-004:** Playwright E2E
5. **PR-005:** Documentation

### Week 3-4 (After Phase 0):
6. **PR-006:** PDF.js integration
7. Then parallelize Phase 3 PRs

### Week 5+ (Long-term):
8. Continue through Phase 4-8
9. See [PR_ROADMAP.md](PR_ROADMAP.md) for details

---

## How to Get Started

### For Contributors:
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Check [STATUS.md](STATUS.md) for current state
3. Pick a PR from [PR_ROADMAP.md](PR_ROADMAP.md)
4. Check dependencies in [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md)
5. Create branch and start coding

### For Project Manager:
1. Read [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md)
2. Assign instances using suggested strategies
3. Track progress with INSTANCE_STATUS.md
4. Monitor critical path
5. Coordinate parallel work

---

## Resources

- [CLAUDE.md](CLAUDE.md) - Architecture guide for Claude Code
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical deep dive
- [PR_ROADMAP.md](PR_ROADMAP.md) - All 52 PRs detailed
- [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md) - Dependency management
- [STATUS.md](STATUS.md) - Current implementation state
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guide
- [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md) - Phase 2 summary

---

**Ready to start?**

👉 Begin with PR-001: [PR_ROADMAP.md](PR_ROADMAP.md#pr-001-jest--react-testing-library-setup)
