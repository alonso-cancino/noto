# Noto Development Roadmap - 52 PRs to v1.0.0

**Last Updated:** 2025-11-17
**Current Status:** Phase 0, Phase 3, and Phase 4 Complete (PRs 1-20 done)
**Estimated Timeline:** 10-16 weeks (depending on parallelization)

This document provides the complete breakdown of all 52 PRs needed to complete Noto v1.0.0, including Windows installer support.

---

## Overview

| Phase | PRs | Status | Estimated Time |
|-------|-----|--------|----------------|
| Phase 0: CI/CD & Testing | 5 PRs | ✅ Complete (PR-001 to PR-005) | 2 weeks |
| Phase 3: PDF Viewer | 7 PRs | ✅ Complete (PR-006 to PR-012) | 2 weeks |
| Phase 4: PDF Annotations | 8 PRs | ✅ Complete (PR-013 to PR-020) | 2 weeks |
| Phase 5: Citation System | 5 PRs | 🚧 Not Started | 2 weeks |
| Phase 6: Google Drive Sync | 10 PRs | 🚧 Not Started | 3 weeks |
| Phase 7: Polish & Features | 10 PRs | 🚧 Not Started | 2 weeks |
| Phase 8: Build & Distribution | 7 PRs | 🚧 Not Started | 3 weeks |
| **Total** | **52 PRs** | **20/52 Complete (38%)** | **16 weeks** |

With parallelization (6-10 instances): **10-12 weeks**

---

## Phase 0: CI/CD & Testing Infrastructure (Week 1-2)

**⚠️ CRITICAL: Must complete Phase 0 before any other development.**

All future PRs require passing tests and CI checks.

### PR-001: Jest + React Testing Library Setup
**Complexity:** Small (4 hours)
**Dependencies:** None
**Can Parallelize:** No (foundation)

**Description:**
Set up comprehensive unit testing infrastructure for React components and utility functions. This is the foundation for all future testing.

**Files to Create:**
- `jest.config.js` - Jest configuration with TypeScript support
- `jest.setup.js` - Test setup (jsdom environment, jest-dom matchers)
- `src/__mocks__/electron.ts` - Mock Electron APIs for testing
- `src/__mocks__/fileMocks.js` - Mock CSS/image imports
- `src/renderer/components/Editor/__tests__/MonacoEditor.test.tsx` - Example component test
- `src/renderer/services/__tests__/markdown.test.ts` - Example utility test

**Files to Modify:**
- `package.json` - Add jest dependencies, add test scripts
  ```json
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@types/jest": "^29.5.0"
  }
  ```
- `tsconfig.json` - Add jest types to compilerOptions.types

**Testing Requirements:**
```bash
npm run test
# Should show 2+ tests passing
# Coverage report should generate
```

**Acceptance Criteria:**
- [ ] Jest runs successfully
- [ ] Can test React components with React Testing Library
- [ ] Electron APIs properly mocked (ipcRenderer, etc.)
- [ ] Coverage reporting works (`npm run test:coverage`)
- [ ] Example tests demonstrate best practices
- [ ] At least 2 passing tests included

**Example Test to Include:**
```typescript
// src/renderer/services/__tests__/markdown.test.ts
import { renderMarkdown, countWords } from '../markdown';

describe('markdown service', () => {
  it('should render markdown to HTML', () => {
    const result = renderMarkdown('# Hello');
    expect(result).toContain('<h1>');
    expect(result).toContain('Hello');
  });

  it('should count words correctly', () => {
    const count = countWords('Hello world test');
    expect(count).toBe(3);
  });
});
```

---

### PR-002: ESLint + Prettier Configuration
**Complexity:** Small (3 hours)
**Dependencies:** None
**Can Parallelize:** Yes (parallel with PR-001)

**Description:**
Establish code quality standards with linting and formatting tools. Ensures consistent code style across all contributors.

**Files to Create:**
- `.eslintrc.json` - ESLint rules for TypeScript + React
  ```json
  {
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint", "react"],
    "rules": {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/react-in-jsx-scope": "off"
    }
  }
  ```
- `.prettierrc.json` - Prettier formatting rules
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2
  }
  ```
- `.eslintignore` - Ignore dist/, node_modules/
- `.prettierignore` - Ignore dist/, coverage/

**Files to Modify:**
- `package.json` - Add lint scripts and dependencies
  ```json
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  },
  "devDependencies": {
    "eslint": "^8.54.0",
    "@typescript-eslint/eslint-plugin": "^6.11.0",
    "@typescript-eslint/parser": "^6.11.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.0"
  }
  ```
- `.vscode/settings.json` - Enable format on save (create if doesn't exist)
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
  ```

**Testing Requirements:**
```bash
npm run lint
# Should pass or show fixable issues

npm run lint:fix
# Should auto-fix issues

npm run format
# Should format all files
```

**Acceptance Criteria:**
- [ ] ESLint configured for TypeScript + React
- [ ] Prettier formats code consistently
- [ ] VSCode auto-formats on save (if using VSCode)
- [ ] No linting errors in existing code (run `npm run lint:fix`)
- [ ] All scripts work correctly
- [ ] `.gitignore` includes `.eslintcache`

---

### PR-003: GitHub Actions CI Pipeline
**Complexity:** Medium (6 hours)
**Dependencies:** PR-001, PR-002
**Can Parallelize:** No (needs tests and lint)

**Description:**
Automated testing and building on every push and PR. This ensures code quality is maintained as the project grows.

**Files to Create:**
- `.github/workflows/ci.yml` - Main CI workflow
  ```yaml
  name: CI

  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '18'
            cache: 'npm'
        - run: npm ci
        - run: npm run lint
        - run: npm run test:coverage
        - run: npm run build
        - uses: actions/upload-artifact@v3
          with:
            name: coverage
            path: coverage/
  ```

**Files to Modify:**
- `README.md` - Add CI status badge
  ```markdown
  ![CI](https://github.com/yourusername/noto/workflows/CI/badge.svg)
  ```

**Testing Requirements:**
- Create a test branch
- Push to GitHub
- Verify GitHub Actions runs successfully
- All checks (lint, test, build) should pass

**Acceptance Criteria:**
- [ ] CI runs on every push to main
- [ ] CI runs on all pull requests
- [ ] Workflow runs: lint → tests → build
- [ ] Coverage artifacts uploaded
- [ ] Build artifacts cached for speed
- [ ] Status badge shows in README
- [ ] Average run time < 5 minutes

---

### PR-004: Playwright E2E Testing Setup
**Complexity:** Medium (8 hours)
**Dependencies:** PR-001
**Can Parallelize:** No (needs test infrastructure)

**Description:**
End-to-end testing for critical user flows. Ensures the app actually works from a user's perspective.

**Files to Create:**
- `playwright.config.ts` - Playwright configuration
  ```typescript
  import { defineConfig } from '@playwright/test';

  export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    retries: 1,
    use: {
      headless: true,
      viewport: { width: 1280, height: 720 },
      screenshot: 'only-on-failure',
    },
    projects: [
      {
        name: 'electron',
        use: { ...devices['Desktop Electron'] },
      },
    ],
  });
  ```
- `e2e/setup.ts` - E2E test helpers
  ```typescript
  import { _electron as electron } from 'playwright';

  export async function launchApp() {
    const app = await electron.launch({
      args: ['dist/main/index.js'],
    });
    return app;
  }
  ```
- `e2e/app.spec.ts` - Basic app launch test
  ```typescript
  import { test, expect } from '@playwright/test';
  import { launchApp } from './setup';

  test('app launches successfully', async () => {
    const app = await launchApp();
    const window = await app.firstWindow();

    expect(await window.title()).toBe('Noto');

    await app.close();
  });
  ```
- `e2e/markdown-editor.spec.ts` - Markdown editing flow
  ```typescript
  test('can create and edit markdown file', async () => {
    const app = await launchApp();
    const window = await app.firstWindow();

    // Click new file
    await window.click('[data-testid="new-file"]');

    // Type filename
    await window.fill('[data-testid="filename-input"]', 'test.md');
    await window.press('[data-testid="filename-input"]', 'Enter');

    // Type markdown
    await window.fill('.monaco-editor textarea', '# Test Note');

    // Wait for auto-save
    await window.waitForSelector('[data-testid="saved-indicator"]');

    expect(await window.textContent('.status-bar')).toContain('2 words');

    await app.close();
  });
  ```

**Files to Modify:**
- `package.json` - Add Playwright dependencies and scripts
  ```json
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "playwright": "^1.40.0"
  }
  ```
- `.github/workflows/ci.yml` - Add E2E tests
  ```yaml
  - run: npm run test:e2e
  ```

**Testing Requirements:**
```bash
npm run test:e2e
# Should launch app and run tests
# Screenshots saved on failure
```

**Acceptance Criteria:**
- [ ] Playwright installed and configured for Electron
- [ ] Can launch Electron app in test mode
- [ ] Basic smoke test passes (app launches)
- [ ] Markdown editor test passes
- [ ] Screenshots captured on failure
- [ ] Runs in CI (headless mode)
- [ ] Tests run in < 2 minutes

---

### PR-005: Documentation + Contributing Guide
**Complexity:** Small (4 hours)
**Dependencies:** PR-001, PR-002, PR-003
**Can Parallelize:** No (needs CI/testing setup to document)

**Description:**
Create comprehensive contributor documentation so new developers (and Claude instances) can contribute effectively.

**Files to Create:**
- `CONTRIBUTING.md` - How to contribute (see separate task)
- `docs/TESTING.md` - Testing guidelines
  ```markdown
  # Testing Guide

  ## Running Tests

  - Unit tests: `npm run test`
  - E2E tests: `npm run test:e2e`
  - Coverage: `npm run test:coverage`

  ## Writing Tests

  ### Unit Tests
  - Place in `__tests__` directory next to source
  - Name: `ComponentName.test.tsx`
  - Mock Electron APIs using `src/__mocks__/electron.ts`

  ### E2E Tests
  - Place in `e2e/` directory
  - Name: `feature-name.spec.ts`
  - Use helper functions from `e2e/setup.ts`

  ## Test Requirements
  - All new components must have unit tests
  - All new features must have E2E tests
  - Minimum 80% coverage for new code
  - Tests must pass before PR merge
  ```
- `.github/PULL_REQUEST_TEMPLATE.md` - Auto-filled PR template
  ```markdown
  ## Summary
  [One-line description]

  ## Changes
  - [ ] Files created
  - [ ] Files modified

  ## Testing
  - [ ] Unit tests added/updated
  - [ ] E2E tests added/updated
  - [ ] Manual testing performed

  ## Checklist
  - [ ] Tests pass (`npm run test`)
  - [ ] Linting passes (`npm run lint`)
  - [ ] Build succeeds (`npm run build`)
  ```

**Files to Modify:**
- `README.md` - Add CI badges, link to contributing guide
  ```markdown
  ![CI](https://github.com/yourusername/noto/workflows/CI/badge.svg)
  ![Coverage](https://img.shields.io/codecov/c/github/yourusername/noto)

  ## Contributing

  See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.
  ```
- `ARCHITECTURE.md` - Add testing section
  ```markdown
  ## Testing Strategy

  ### Unit Tests
  - React components (React Testing Library)
  - Services and utilities (Jest)
  - IPC handlers (mocked electron)

  ### E2E Tests
  - Critical user flows (Playwright)
  - Cross-platform testing

  ### Coverage Goals
  - Overall: 80%+
  - Critical paths: 90%+
  ```

**Testing Requirements:**
- Read through all documentation
- Verify all links work
- Verify code examples are accurate

**Acceptance Criteria:**
- [ ] Clear setup instructions for new contributors
- [ ] Testing guidelines documented
- [ ] PR template auto-fills on GitHub
- [ ] Architecture docs updated
- [ ] All links functional
- [ ] Examples tested and working

---

## Phase 3: PDF Viewer (Week 3-4)

**Goal:** Basic PDF viewing with navigation, zoom, and text selection.

**Dependencies:** Phase 0 complete

### PR-006: PDF.js Integration + Basic Rendering
**Complexity:** Medium (8 hours)
**Dependencies:** PR-001 (for tests)
**Can Parallelize:** No (foundation for all PDF work)

**Description:**
Integrate PDF.js library and create basic PDF rendering component. This is the foundation for all PDF functionality.

**Files to Create:**
- `src/renderer/components/PDFViewer/index.tsx` - Main PDF viewer container
- `src/renderer/components/PDFViewer/PDFCanvas.tsx` - Canvas renderer using PDF.js
- `src/renderer/components/PDFViewer/types.ts` - PDF-specific types
- `src/renderer/hooks/usePDF.ts` - PDF loading and state management hook
- `src/renderer/components/PDFViewer/__tests__/PDFCanvas.test.tsx` - Component tests
- `public/pdf.worker.min.js` - Copy PDF.js worker (from node_modules)

**Files to Modify:**
- `src/renderer/components/Layout/EditorPane.tsx` - Show PDF viewer for .pdf files
  ```typescript
  if (currentFile?.endsWith('.pdf')) {
    return <PDFViewer filePath={currentFile} />;
  }
  ```
- `vite.config.ts` - Configure PDF.js worker path
  ```typescript
  export default defineConfig({
    // ... existing config
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
  });
  ```
- `package.json` - Verify pdfjs-dist dependency (already installed)

**Key Implementation Details:**
```typescript
// src/renderer/hooks/usePDF.ts
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export function usePDF(filePath: string) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPDF() {
      try {
        const fileContent = await window.api['file:read'](filePath);
        const doc = await pdfjsLib.getDocument({ data: fileContent }).promise;
        setPdf(doc);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPDF();
  }, [filePath]);

  return { pdf, loading, error };
}
```

**Testing Requirements:**
```bash
npm run test
# PDF loading tests pass

npm run dev
# Can open and view .pdf files
# First page renders correctly
```

**Acceptance Criteria:**
- [ ] PDF.js initializes correctly
- [ ] Can load PDF from file path
- [ ] Renders first page to canvas
- [ ] Loading state shows spinner
- [ ] Error state shows error message
- [ ] Worker runs in separate thread (no main thread blocking)
- [ ] Unit tests cover loading, error states
- [ ] Works with sample PDF

**Test PDF:** Include a simple test.pdf in `resources/` for testing

---

### PR-007: PDF Page Navigation
**Complexity:** Small (4 hours)
**Dependencies:** PR-006
**Can Parallelize:** No

**Description:**
Add controls to navigate between pages (previous, next, jump to page number).

**Files to Create:**
- `src/renderer/components/PDFViewer/PageNavigation.tsx`
  ```typescript
  interface Props {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/PageNavigation.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/index.tsx` - Integrate navigation controls
- `src/renderer/components/PDFViewer/PDFCanvas.tsx` - Add page state

**Features:**
- Previous/Next buttons
- Page number input (jump to page)
- Page X of Y display
- Keyboard shortcuts (←/→ arrows)
- Edge case handling (page 0, page > max)

**Testing Requirements:**
```bash
npm run test
# Navigation tests pass

npm run test:e2e
# E2E test: Navigate through PDF pages
```

**Acceptance Criteria:**
- [ ] Previous/Next buttons work
- [ ] Page input allows jumping to specific page
- [ ] Keyboard shortcuts work (←/→)
- [ ] Disabled state for prev (page 1) and next (last page)
- [ ] Invalid page numbers handled gracefully
- [ ] Unit tests pass
- [ ] E2E test covers full navigation flow

---

### PR-008: Zoom Controls
**Complexity:** Small (4 hours)
**Dependencies:** PR-006
**Can Parallelize:** Yes (parallel with PR-007)

**Description:**
Add zoom in/out controls to adjust PDF scale for better readability of small text or large diagrams.

**Files to Create:**
- `src/renderer/components/PDFViewer/ZoomControls.tsx`
  ```typescript
  interface Props {
    scale: number;
    onScaleChange: (scale: number) => void;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/ZoomControls.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/index.tsx` - Integrate zoom controls
- `src/renderer/components/PDFViewer/PDFCanvas.tsx` - Add scale state, apply to canvas rendering

**Features:**
- Zoom in button (+25% increments)
- Zoom out button (-25% increments)
- Reset to 100% button
- Zoom levels: 50%, 75%, 100%, 125%, 150%, 200%, 300%
- Display current zoom percentage
- Keyboard shortcuts (Cmd/Ctrl + +/-, Cmd/Ctrl + 0)

**Testing Requirements:**
```bash
npm run test
# Zoom controls tests pass

npm run dev
# Can zoom in/out on PDF
# Reset button returns to 100%
```

**Acceptance Criteria:**
- [ ] Zoom in/out buttons work
- [ ] Zoom levels constrained to 50%-300%
- [ ] Reset button returns to 100%
- [ ] Current zoom percentage displayed
- [ ] Keyboard shortcuts work (Cmd/Ctrl + +/-, 0)
- [ ] PDF re-renders at new scale
- [ ] Unit tests pass
- [ ] No performance issues at high zoom levels

---

### PR-009: PDF Page Thumbnails
**Complexity:** Medium (6 hours)
**Dependencies:** PR-006, PR-007
**Can Parallelize:** No

**Description:**
Add a sidebar showing thumbnail previews of all pages for quick navigation and overview of document structure.

**Files to Create:**
- `src/renderer/components/PDFViewer/ThumbnailSidebar.tsx`
  ```typescript
  interface Props {
    pdf: PDFDocumentProxy;
    currentPage: number;
    onPageSelect: (page: number) => void;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/ThumbnailSidebar.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/index.tsx` - Add toggle button and sidebar
- `src/renderer/components/PDFViewer/PDFCanvas.tsx` - Adjust width when sidebar visible

**Features:**
- Render all pages as thumbnails at 25% scale
- Highlight current page thumbnail
- Click thumbnail to jump to that page
- Toggle button to show/hide sidebar
- Lazy render thumbnails (only visible ones)
- Scrollable thumbnail list

**Key Implementation Details:**
```typescript
// Render thumbnails at low scale for performance
const THUMBNAIL_SCALE = 0.25;

// Only render visible thumbnails (virtual scrolling)
const visibleThumbnails = useMemo(() => {
  const start = Math.max(0, scrollTop / thumbnailHeight - 2);
  const end = Math.min(numPages, start + visibleCount + 4);
  return Array.from({ length: end - start }, (_, i) => start + i + 1);
}, [scrollTop, numPages]);
```

**Testing Requirements:**
```bash
npm run test
# Thumbnail sidebar tests pass

npm run dev
# Thumbnails render for all pages
# Clicking thumbnail navigates to page
# Toggle button shows/hides sidebar
```

**Acceptance Criteria:**
- [ ] All pages rendered as thumbnails
- [ ] Thumbnails render at 25% scale
- [ ] Current page highlighted
- [ ] Click thumbnail navigates to page
- [ ] Toggle button works
- [ ] Performance acceptable for large PDFs (100+ pages)
- [ ] Lazy rendering implemented
- [ ] Unit tests pass

---

### PR-010: Text Selection in PDF Viewer
**Complexity:** Medium (6 hours)
**Dependencies:** PR-006
**Can Parallelize:** Yes (parallel with PR-007, PR-008, PR-009)

**Description:**
Enable native text selection and copying from PDFs using PDF.js text layer overlay.

**Files to Create:**
- `src/renderer/components/PDFViewer/TextLayer.tsx`
  ```typescript
  interface Props {
    page: PDFPageProxy;
    scale: number;
    viewport: PageViewport;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/TextLayer.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/PDFCanvas.tsx` - Overlay TextLayer on canvas

**Key Implementation Details:**
```typescript
// Use PDF.js text content API
const textContent = await page.getTextContent();

// Render text layer with proper positioning
pdfjsLib.renderTextLayer({
  textContentSource: textContent,
  container: textLayerDiv,
  viewport: viewport,
  textDivs: [],
});
```

**Testing Requirements:**
```bash
npm run test
# Text layer tests pass

npm run dev
# Can select text in PDF
# Cmd/Ctrl+C copies selected text
# Text selection works at different zoom levels
```

**Acceptance Criteria:**
- [ ] Text layer overlays canvas correctly
- [ ] Text is selectable with mouse
- [ ] Selected text can be copied (Cmd/Ctrl+C)
- [ ] Text layer follows zoom changes
- [ ] Text layer positioned correctly at all scales
- [ ] No visual artifacts (transparent background)
- [ ] Unit tests pass

---

### PR-011: PDF Search Functionality
**Complexity:** Medium (8 hours)
**Dependencies:** PR-006, PR-010
**Can Parallelize:** No (needs text layer)

**Description:**
Add search bar to find text across all pages of PDF, with navigation between results.

**Files to Create:**
- `src/renderer/components/PDFViewer/SearchBar.tsx`
  ```typescript
  interface Props {
    pdf: PDFDocumentProxy;
    onResultSelect: (pageNumber: number, resultIndex: number) => void;
  }

  interface SearchResult {
    pageNumber: number;
    text: string;
    context: string; // Surrounding text
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/SearchBar.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/index.tsx` - Add search bar with toggle

**Features:**
- Search input with Enter to search
- Search across all pages (extract text content)
- Display results with page numbers and context
- Navigate between results (prev/next arrows)
- Highlight current result
- Show "X results found" count
- Keyboard shortcuts (Enter, Escape to clear)
- Case-insensitive search

**Key Implementation Details:**
```typescript
async function searchPDF(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');

    const regex = new RegExp(query, 'gi');
    const matches = [...pageText.matchAll(regex)];

    matches.forEach(match => {
      results.push({
        pageNumber: i,
        text: match[0],
        context: pageText.substring(match.index - 50, match.index + 50),
      });
    });
  }

  return results;
}
```

**Testing Requirements:**
```bash
npm run test
# Search bar tests pass

npm run dev
# Can search for text in PDF
# Results show with page numbers
# Navigate between results works
# Clicking result jumps to page
```

**Acceptance Criteria:**
- [ ] Search input works
- [ ] Searches across all pages
- [ ] Results show page numbers and context
- [ ] Navigate prev/next between results
- [ ] Click result jumps to page
- [ ] Shows result count
- [ ] Keyboard shortcuts work (Enter, Escape)
- [ ] Case-insensitive search
- [ ] Unit tests pass
- [ ] Performance acceptable for large PDFs

---

### PR-012: Drag and Drop PDF Import
**Complexity:** Small (4 hours)
**Dependencies:** PR-006
**Can Parallelize:** Yes (parallel with other Phase 3 PRs)

**Description:**
Allow users to drag and drop PDF files into the file explorer to import them into the workspace.

**Files to Create:**
- None (modifies existing component)

**Files to Modify:**
- `src/renderer/components/FileExplorer/index.tsx` - Add drag/drop handlers
  ```typescript
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(f => f.name.endsWith('.pdf'));

    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      await window.api['file:import-pdf'](file.name, base64);
    }

    // Refresh file list
    loadFiles();
  };
  ```
- `src/shared/types.ts` - Add IPC handler type
  ```typescript
  export interface IpcHandlers {
    'file:import-pdf': (filename: string, content: string) => Promise<void>;
    // ... existing handlers
  }
  ```
- `src/main/ipc/file-handlers.ts` - Implement import handler
- `src/renderer/components/FileExplorer/__tests__/FileExplorer.test.tsx` - Add drag/drop tests

**Features:**
- Drag and drop zone in file explorer
- Visual feedback when dragging over (border highlight)
- Accept only PDF files (filter)
- Multiple file import support
- Auto-refresh file list after import
- Error handling for invalid files

**Testing Requirements:**
```bash
npm run test
# File explorer tests pass (with drag/drop simulation)

npm run dev
# Can drag PDF from desktop into file explorer
# Visual feedback when dragging over
# PDF appears in file list after drop
```

**Acceptance Criteria:**
- [ ] Drag and drop zone works
- [ ] Visual feedback when dragging
- [ ] Accepts only PDF files
- [ ] Multiple files can be dropped at once
- [ ] Files saved to workspace directory
- [ ] File list refreshes after import
- [ ] Error handling for non-PDF files
- [ ] Unit tests pass
- [ ] Works on all platforms (Windows, macOS, Linux)

---

## Phase 4: PDF Annotations (Week 5-6)

**Goal:** Full annotation system with highlights, notes, and areas.

**Dependencies:** Phase 3 complete

### PR-013: Annotation Storage Service
**Complexity:** Medium (6 hours)
**Dependencies:** PR-012
**Can Parallelize:** No (foundation for all annotation work)

**Description:**
Create a service to manage annotation CRUD operations, storing annotations as JSON files alongside PDFs. This is the foundation for all annotation features.

**Files to Create:**
- `src/renderer/services/AnnotationService.ts`
  ```typescript
  export interface Annotation {
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

  export interface Rectangle {
    x: number;      // % from left (0-100)
    y: number;      // % from top (0-100)
    width: number;  // % of page width
    height: number; // % of page height
  }

  export interface AnnotationFile {
    version: number;               // Schema version for migrations
    pdfPath: string;
    annotations: Annotation[];
  }

  export class AnnotationService {
    async loadAnnotations(pdfPath: string): Promise<Annotation[]>;
    async saveAnnotation(pdfPath: string, annotation: Annotation): Promise<void>;
    async updateAnnotation(pdfPath: string, annotation: Annotation): Promise<void>;
    async deleteAnnotation(pdfPath: string, annotationId: string): Promise<void>;
    getAnnotationsForPage(annotations: Annotation[], pageNumber: number): Annotation[];
  }
  ```
- `src/renderer/services/__tests__/AnnotationService.test.ts`
- `src/shared/types.ts` - Add annotation-related IPC handlers
  ```typescript
  export interface IpcHandlers {
    'annotations:read': (pdfPath: string) => Promise<string | null>;
    'annotations:write': (pdfPath: string, content: string) => Promise<void>;
    // ... existing handlers
  }
  ```

**Files to Modify:**
- `src/main/ipc/file-handlers.ts` - Implement annotation file IPC handlers
- `src/preload/index.ts` - Expose annotation IPC handlers

**Storage Format:**
```
MyResearch/
├── paper.pdf
└── .paper.pdf.annotations.json
```

**Key Implementation Details:**
```typescript
export class AnnotationService {
  private cache = new Map<string, AnnotationFile>();

  async loadAnnotations(pdfPath: string): Promise<Annotation[]> {
    // Check cache first
    if (this.cache.has(pdfPath)) {
      return this.cache.get(pdfPath)!.annotations;
    }

    // Load from file
    const annotationPath = this.getAnnotationPath(pdfPath);
    const content = await window.api['annotations:read'](annotationPath);

    if (!content) {
      return [];
    }

    const file: AnnotationFile = JSON.parse(content);
    this.cache.set(pdfPath, file);
    return file.annotations;
  }

  async saveAnnotation(pdfPath: string, annotation: Annotation): Promise<void> {
    const annotations = await this.loadAnnotations(pdfPath);
    annotations.push(annotation);
    await this.writeAnnotations(pdfPath, annotations);
  }

  getAnnotationsForPage(annotations: Annotation[], pageNumber: number): Annotation[] {
    return annotations.filter(a => a.pageNumber === pageNumber);
  }

  private getAnnotationPath(pdfPath: string): string {
    return `.${pdfPath}.annotations.json`;
  }

  private async writeAnnotations(pdfPath: string, annotations: Annotation[]): Promise<void> {
    const file: AnnotationFile = {
      version: 1,
      pdfPath,
      annotations,
    };

    const annotationPath = this.getAnnotationPath(pdfPath);
    await window.api['annotations:write'](annotationPath, JSON.stringify(file, null, 2));
    this.cache.set(pdfPath, file);
  }
}
```

**Testing Requirements:**
```bash
npm run test
# AnnotationService tests pass
# Test CRUD operations
# Test cache invalidation
# Test page filtering
```

**Acceptance Criteria:**
- [ ] Can create annotations (save to JSON)
- [ ] Can read annotations (load from JSON)
- [ ] Can update existing annotations
- [ ] Can delete annotations
- [ ] Annotations cached in memory
- [ ] Annotations grouped by page number
- [ ] JSON schema version included
- [ ] Percentage-based bounds (scale-independent)
- [ ] Unit tests pass (90%+ coverage)
- [ ] IPC handlers implemented

---

### PR-014: SVG Overlay Layer
**Complexity:** Medium (8 hours)
**Dependencies:** PR-013
**Can Parallelize:** No

**Description:**
Create an SVG layer that overlays the PDF canvas to render annotations (highlights, notes, areas). Converts percentage-based bounds to pixel coordinates.

**Files to Create:**
- `src/renderer/components/PDFViewer/AnnotationLayer.tsx`
  ```typescript
  interface Props {
    annotations: Annotation[];
    pageNumber: number;
    viewport: PageViewport;
    scale: number;
    onAnnotationClick: (annotation: Annotation) => void;
    onAnnotationContextMenu: (annotation: Annotation, e: React.MouseEvent) => void;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/AnnotationLayer.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/PDFCanvas.tsx` - Overlay AnnotationLayer on canvas
- `src/renderer/components/PDFViewer/index.tsx` - Load annotations for current PDF

**Key Implementation Details:**
```typescript
// Convert percentage bounds to pixel coordinates
function boundsToPixels(bounds: Rectangle, viewport: PageViewport): DOMRect {
  return {
    x: (bounds.x / 100) * viewport.width,
    y: (bounds.y / 100) * viewport.height,
    width: (bounds.width / 100) * viewport.width,
    height: (bounds.height / 100) * viewport.height,
  };
}

// Render different annotation types
function renderAnnotation(annotation: Annotation) {
  const pixels = boundsToPixels(annotation.bounds, viewport);

  switch (annotation.type) {
    case 'highlight':
      return (
        <rect
          x={pixels.x}
          y={pixels.y}
          width={pixels.width}
          height={pixels.height}
          fill={annotation.color}
          opacity={0.3}
          onClick={() => onAnnotationClick(annotation)}
          onContextMenu={(e) => onAnnotationContextMenu(annotation, e)}
        />
      );
    case 'note':
      return (
        <g onClick={() => onAnnotationClick(annotation)}>
          {/* Sticky note icon */}
        </g>
      );
    case 'area':
      return (
        <rect
          x={pixels.x}
          y={pixels.y}
          width={pixels.width}
          height={pixels.height}
          fill={annotation.color}
          stroke={annotation.color}
          strokeWidth={2}
          fillOpacity={0.1}
          onClick={() => onAnnotationClick(annotation)}
        />
      );
  }
}
```

**Testing Requirements:**
```bash
npm run test
# AnnotationLayer tests pass
# Test coordinate conversion
# Test click handlers

npm run dev
# Annotations render on PDF
# Annotations follow zoom changes
# Click annotation triggers handler
```

**Acceptance Criteria:**
- [ ] SVG layer overlays canvas correctly
- [ ] Annotations render at correct positions
- [ ] Percentage bounds converted to pixels
- [ ] Annotations scale with zoom level
- [ ] Click handlers work
- [ ] Context menu handlers work
- [ ] Different annotation types render correctly (highlight, note, area)
- [ ] Opacity correct (highlights 30%, areas 10%)
- [ ] Unit tests pass
- [ ] No performance issues with 100+ annotations

---

### PR-015: Highlight Tool
**Complexity:** Medium (8 hours)
**Dependencies:** PR-013, PR-014
**Can Parallelize:** No

**Description:**
Implement click-and-drag highlighting tool that extracts text from PDF.js and creates highlight annotations.

**Files to Create:**
- `src/renderer/components/PDFViewer/AnnotationTools.tsx`
  ```typescript
  export class HighlightTool {
    constructor(
      private page: PDFPageProxy,
      private viewport: PageViewport,
      private onComplete: (annotation: Annotation) => void
    ) {}

    onMouseDown(e: React.MouseEvent): void;
    onMouseMove(e: React.MouseEvent): void;
    onMouseUp(e: React.MouseEvent): void;

    private async extractText(bounds: Rectangle): Promise<string>;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/AnnotationTools.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/index.tsx` - Add tool selection state
- `src/renderer/components/PDFViewer/PDFCanvas.tsx` - Add mouse event handlers
- `package.json` - Add uuid dependency
  ```bash
  npm install uuid @types/uuid
  ```

**Features:**
- Click and drag to select text region
- Visual feedback during selection (dashed box)
- Extract text from PDF.js text content
- 5 color options (yellow, green, blue, pink, orange)
- Generate UUID for annotation ID
- Save to AnnotationService

**Key Implementation Details:**
```typescript
export class HighlightTool {
  private startPoint: Point | null = null;
  private currentBounds: Rectangle | null = null;

  async onMouseUp(e: React.MouseEvent) {
    if (!this.currentBounds) return;

    // Extract text from PDF.js
    const textContent = await this.page.getTextContent();
    const text = this.extractTextInBounds(textContent, this.currentBounds);

    const annotation: Annotation = {
      id: uuidv4(),
      type: 'highlight',
      pageNumber: this.page.pageNumber,
      bounds: this.currentBounds,
      color: this.selectedColor,
      text,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    this.onComplete(annotation);
  }

  private extractTextInBounds(textContent: TextContent, bounds: Rectangle): string {
    const items = textContent.items.filter(item => {
      const itemBounds = this.getItemBounds(item);
      return this.intersects(itemBounds, bounds);
    });

    return items.map(item => item.str).join(' ');
  }
}
```

**Testing Requirements:**
```bash
npm run test
# HighlightTool tests pass

npm run dev
# Can activate highlight tool
# Click and drag selects region
# Text extracted correctly
# Annotation saved and rendered
```

**Acceptance Criteria:**
- [ ] Highlight tool activates/deactivates
- [ ] Click and drag creates selection box
- [ ] Visual feedback during selection
- [ ] Text extracted from selected region
- [ ] Annotation created with UUID
- [ ] 5 color options available
- [ ] Annotation saved via AnnotationService
- [ ] Annotation renders immediately after creation
- [ ] Unit tests pass

---

### PR-016: Note Tool
**Complexity:** Small (4 hours)
**Dependencies:** PR-013, PR-014
**Can Parallelize:** Yes (parallel with PR-015)

**Description:**
Implement note tool that allows users to click anywhere on a PDF to place sticky note annotations with text.

**Files to Create:**
- None (extends AnnotationTools.tsx from PR-015)

**Files to Modify:**
- `src/renderer/components/PDFViewer/AnnotationTools.tsx` - Add NoteTool class
  ```typescript
  export class NoteTool {
    constructor(
      private pageNumber: number,
      private viewport: PageViewport,
      private onComplete: (annotation: Annotation) => void
    ) {}

    onClick(e: React.MouseEvent): void {
      const bounds = this.createNoteBounds(e.clientX, e.clientY);
      const note = prompt('Enter note text:');

      if (!note) return;

      const annotation: Annotation = {
        id: uuidv4(),
        type: 'note',
        pageNumber: this.pageNumber,
        bounds,
        note,
        color: '#FFD700', // Gold color for note icon
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      this.onComplete(annotation);
    }

    private createNoteBounds(x: number, y: number): Rectangle {
      // Create 5% x 5% bounds for sticky note icon
      return {
        x: (x / this.viewport.width) * 100,
        y: (y / this.viewport.height) * 100,
        width: 5,
        height: 5,
      };
    }
  }
  ```
- `src/renderer/components/PDFViewer/AnnotationLayer.tsx` - Add sticky note icon rendering
  ```typescript
  case 'note':
    return (
      <g transform={`translate(${pixels.x}, ${pixels.y})`}>
        <rect width={pixels.width} height={pixels.height} fill="#FFD700" rx={2} />
        <text x={pixels.width/2} y={pixels.height/2} textAnchor="middle" dy=".3em">📝</text>
      </g>
    );
  ```

**Features:**
- Click to place note
- Note input dialog (prompt or custom modal)
- Sticky note icon (5% of page width/height)
- Gold color (#FFD700)
- Tooltip showing note text on hover

**Testing Requirements:**
```bash
npm run test
# NoteTool tests pass

npm run dev
# Can activate note tool
# Click places sticky note
# Input dialog appears
# Note text saved
# Icon renders on PDF
```

**Acceptance Criteria:**
- [ ] Note tool activates/deactivates
- [ ] Click places note icon
- [ ] Input dialog appears for note text
- [ ] Note saved with text
- [ ] Icon renders at 5% x 5% size
- [ ] Hover shows note text (tooltip)
- [ ] Icon color is gold (#FFD700)
- [ ] Unit tests pass

---

### PR-017: Area Selection Tool
**Complexity:** Medium (6 hours)
**Dependencies:** PR-013, PR-014
**Can Parallelize:** Yes (parallel with PR-015, PR-016)

**Description:**
Implement area selection tool for selecting rectangular regions (for figures, tables, diagrams). Similar to highlight but without text extraction.

**Files to Create:**
- None (extends AnnotationTools.tsx)

**Files to Modify:**
- `src/renderer/components/PDFViewer/AnnotationTools.tsx` - Add AreaTool class
  ```typescript
  export class AreaTool {
    constructor(
      private pageNumber: number,
      private viewport: PageViewport,
      private onComplete: (annotation: Annotation) => void
    ) {}

    onMouseDown(e: React.MouseEvent): void;
    onMouseMove(e: React.MouseEvent): void;
    onMouseUp(e: React.MouseEvent): void;
  }
  ```

**Features:**
- Click and drag to select rectangular area
- Visual feedback (dashed border during selection)
- Optional note attachment
- 5 color options
- Use case: Highlight figures, tables, diagrams

**Key Implementation Details:**
```typescript
export class AreaTool {
  private startPoint: Point | null = null;
  private currentBounds: Rectangle | null = null;

  onMouseUp(e: React.MouseEvent) {
    if (!this.currentBounds) return;

    const note = prompt('Add a note for this area (optional):');

    const annotation: Annotation = {
      id: uuidv4(),
      type: 'area',
      pageNumber: this.pageNumber,
      bounds: this.currentBounds,
      color: this.selectedColor,
      note: note || undefined,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    this.onComplete(annotation);
  }
}
```

**Testing Requirements:**
```bash
npm run test
# AreaTool tests pass

npm run dev
# Can activate area tool
# Click and drag selects area
# Optional note works
# Area renders with border
```

**Acceptance Criteria:**
- [ ] Area tool activates/deactivates
- [ ] Click and drag creates rectangular selection
- [ ] Visual feedback during selection (dashed border)
- [ ] Optional note can be added
- [ ] 5 color options available
- [ ] Area renders with border (2px) and 10% fill opacity
- [ ] Annotation saved via AnnotationService
- [ ] Unit tests pass

---

### PR-018: Annotation Toolbar
**Complexity:** Small (4 hours)
**Dependencies:** PR-015, PR-016, PR-017
**Can Parallelize:** No (needs all tools)

**Description:**
Create toolbar for selecting annotation tools and colors. Provides UI for switching between select, highlight, note, and area tools.

**Files to Create:**
- `src/renderer/components/PDFViewer/AnnotationToolbar.tsx`
  ```typescript
  interface Props {
    selectedTool: 'select' | 'highlight' | 'note' | 'area';
    selectedColor: string;
    onToolChange: (tool: string) => void;
    onColorChange: (color: string) => void;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/AnnotationToolbar.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/index.tsx` - Add toolbar above PDF viewer

**Features:**
- Tool selection buttons (select, highlight, note, area)
- Color picker (5 colors: yellow, green, blue, pink, orange)
- Active tool indication (highlighted button)
- Keyboard shortcuts (Esc = select, H = highlight, N = note, A = area)
- Tooltips with keyboard shortcut hints

**UI Design:**
```
┌──────────────────────────────────────────────┐
│ [Select] [Highlight] [Note] [Area]  [🎨 Colors] │
└──────────────────────────────────────────────┘
```

**Testing Requirements:**
```bash
npm run test
# AnnotationToolbar tests pass

npm run dev
# Toolbar renders above PDF
# Tool selection works
# Color picker works
# Keyboard shortcuts work
```

**Acceptance Criteria:**
- [ ] Toolbar renders correctly
- [ ] Tool buttons toggle correctly
- [ ] Active tool highlighted
- [ ] Color picker shows 5 colors
- [ ] Selected color highlighted
- [ ] Keyboard shortcuts work (Esc, H, N, A)
- [ ] Tooltips show shortcuts
- [ ] Unit tests pass

---

### PR-019: Annotations Sidebar
**Complexity:** Medium (6 hours)
**Dependencies:** PR-013, PR-014
**Can Parallelize:** Yes (parallel with PR-015-017)

**Description:**
Create sidebar panel listing all annotations for the current PDF, grouped by page, with options to jump to annotations, edit, and delete.

**Files to Create:**
- `src/renderer/components/PDFViewer/AnnotationsSidebar.tsx`
  ```typescript
  interface Props {
    annotations: Annotation[];
    currentPage: number;
    onAnnotationSelect: (annotation: Annotation) => void;
    onAnnotationEdit: (annotation: Annotation) => void;
    onAnnotationDelete: (annotationId: string) => void;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/AnnotationsSidebar.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/index.tsx` - Add sidebar toggle and panel

**Features:**
- List annotations grouped by page number
- Show annotation type icon (highlight, note, area)
- Show preview text (first 50 chars)
- Show note text if present
- Show citation count (citedIn length)
- Click to jump to annotation's page
- Edit button (pencil icon)
- Delete button (trash icon)
- Toggle button to show/hide sidebar

**UI Design:**
```
┌─────────────────────┐
│ 📌 Annotations (12) │
├─────────────────────┤
│ Page 1 (3)          │
│  🟡 "This is..."   │
│     📝 My note     │
│     ✏️ 🗑️          │
│  🟢 "Another..."   │
│     ✏️ 🗑️          │
│ Page 2 (1)          │
│  📦 Figure 1       │
│     📝 Important   │
│     🔗 Cited in 2  │
│     ✏️ 🗑️          │
└─────────────────────┘
```

**Testing Requirements:**
```bash
npm run test
# AnnotationsSidebar tests pass

npm run dev
# Sidebar lists all annotations
# Grouped by page
# Click jumps to page
# Edit/delete buttons work
```

**Acceptance Criteria:**
- [ ] Sidebar lists all annotations
- [ ] Annotations grouped by page number
- [ ] Shows type icon (color dot for highlights/areas, sticky note for notes)
- [ ] Shows preview text (first 50 chars for highlights)
- [ ] Shows note text if present
- [ ] Shows citation count if citedIn > 0
- [ ] Click annotation jumps to page
- [ ] Edit button triggers edit handler
- [ ] Delete button triggers delete handler
- [ ] Toggle button shows/hides sidebar
- [ ] Unit tests pass

---

### PR-020: Edit/Delete Annotations
**Complexity:** Medium (6 hours)
**Dependencies:** PR-013, PR-019
**Can Parallelize:** No (needs sidebar)

**Description:**
Implement UI and handlers for editing and deleting annotations. Includes context menu for right-click and edit dialogs.

**Files to Create:**
- `src/renderer/components/PDFViewer/AnnotationContextMenu.tsx`
  ```typescript
  interface Props {
    annotation: Annotation;
    position: { x: number; y: number };
    onEdit: () => void;
    onChangeColor: (color: string) => void;
    onDelete: () => void;
    onQuote: () => void; // Quote in markdown note
    onClose: () => void;
  }
  ```
- `src/renderer/components/PDFViewer/NoteEditDialog.tsx`
  ```typescript
  interface Props {
    annotation: Annotation;
    onSave: (note: string) => void;
    onCancel: () => void;
  }
  ```
- `src/renderer/components/PDFViewer/__tests__/AnnotationContextMenu.test.tsx`

**Files to Modify:**
- `src/renderer/components/PDFViewer/AnnotationLayer.tsx` - Add right-click handler
- `src/renderer/components/PDFViewer/index.tsx` - Wire up edit/delete handlers
- `src/renderer/services/AnnotationService.ts` - Already has update/delete methods

**Features:**
- Right-click annotation shows context menu
- Context menu options:
  - Edit note
  - Change color (submenu with 5 colors)
  - Delete
  - Quote in note (creates markdown citation)
- Edit dialog for changing note text
- Delete confirmation dialog
- Update AnnotationService on changes

**Key Implementation Details:**
```typescript
async function handleEditNote(annotation: Annotation, newNote: string) {
  const updated = {
    ...annotation,
    note: newNote,
    modifiedAt: new Date().toISOString(),
  };

  await annotationService.updateAnnotation(pdfPath, updated);

  // Refresh annotations
  const annotations = await annotationService.loadAnnotations(pdfPath);
  setAnnotations(annotations);
}

async function handleDelete(annotationId: string) {
  if (!confirm('Delete this annotation?')) return;

  await annotationService.deleteAnnotation(pdfPath, annotationId);

  // Refresh annotations
  const annotations = await annotationService.loadAnnotations(pdfPath);
  setAnnotations(annotations);
}

async function handleChangeColor(annotation: Annotation, newColor: string) {
  const updated = {
    ...annotation,
    color: newColor,
    modifiedAt: new Date().toISOString(),
  };

  await annotationService.updateAnnotation(pdfPath, updated);

  // Refresh annotations
  const annotations = await annotationService.loadAnnotations(pdfPath);
  setAnnotations(annotations);
}
```

**Testing Requirements:**
```bash
npm run test
# Context menu tests pass
# Edit dialog tests pass

npm run dev
# Right-click annotation shows menu
# Edit note works
# Change color works
# Delete works (with confirmation)
```

**Acceptance Criteria:**
- [ ] Right-click shows context menu
- [ ] Context menu positioned correctly
- [ ] Edit note opens dialog
- [ ] Note dialog saves changes
- [ ] Change color submenu works
- [ ] Color change updates annotation
- [ ] Delete shows confirmation
- [ ] Delete removes annotation
- [ ] Quote in note creates markdown citation (Phase 5 feature, placeholder for now)
- [ ] Annotations refresh after changes
- [ ] Unit tests pass

---

## How to Use This Roadmap

1. **Start with Phase 0** - Complete all 5 PRs sequentially
2. **Use [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md)** - Shows which PRs can be parallelized
3. **Follow the PR template** - Each PR must include tests and documentation
4. **Check acceptance criteria** - All items must be complete before merging
5. **Run CI before PR** - `npm run lint && npm run test && npm run build`

---

## PR Template

When creating a PR, use this template:

```markdown
## PR-XXX: [Title]

**Complexity:** [Small/Medium/Large]
**Dependencies:** [PR numbers or "None"]
**Estimated Time:** [hours]

### Summary
[One-line description]

### Changes
- Created: [files]
- Modified: [files]

### Testing
- [ ] Unit tests added
- [ ] E2E tests added (if applicable)
- [ ] Manual testing performed
- [ ] All tests pass locally

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] ...

### Checklist
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] Documentation updated
```

---

## Next Steps

1. Review [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md) for execution order
2. Start with PR-001 (Jest setup)
3. Set up CI/CD (PR-003) before feature development
4. Use multiple Claude Code instances for parallel work

**Ready to start? Begin with PR-001!**
