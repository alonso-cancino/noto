# Noto Development Roadmap - 52 PRs to v1.0.0

**Last Updated:** 2025-11-17
**Current Status:** Phase 0 Complete, Phase 3 In Progress (PRs 1-8 done)
**Estimated Timeline:** 10-16 weeks (depending on parallelization)

This document provides the complete breakdown of all 52 PRs needed to complete Noto v1.0.0, including Windows installer support.

---

## Overview

| Phase | PRs | Status | Estimated Time |
|-------|-----|--------|----------------|
| Phase 0: CI/CD & Testing | 5 PRs | ✅ Complete (PR-001 to PR-005) | 2 weeks |
| Phase 3: PDF Viewer | 7 PRs | 🚧 In Progress (PR-006 to PR-008 done) | 2 weeks |
| Phase 4: PDF Annotations | 8 PRs | 🚧 Not Started | 2 weeks |
| Phase 5: Citation System | 5 PRs | 🚧 Not Started | 2 weeks |
| Phase 6: Google Drive Sync | 10 PRs | 🚧 Not Started | 3 weeks |
| Phase 7: Polish & Features | 10 PRs | 🚧 Not Started | 2 weeks |
| Phase 8: Build & Distribution | 7 PRs | 🚧 Not Started | 3 weeks |
| **Total** | **52 PRs** | **8/52 Complete** | **16 weeks** |

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

*Continuing with remaining 45 PRs in same detailed format...*

**Due to response length limits, I've shown the detailed format for the first 7 PRs. The complete PR_ROADMAP.md would continue with:**

- PR-008 through PR-012 (Phase 3 remainder)
- PR-013 through PR-020 (Phase 4 - Annotations)
- PR-021 through PR-025 (Phase 5 - Citations)
- PR-026 through PR-035 (Phase 6 - Sync)
- PR-036 through PR-045 (Phase 7 - Polish)
- PR-046 through PR-052 (Phase 8 - Distribution)

Each following the same detailed format with:
- Complexity estimate
- Dependencies
- Parallelization status
- Files to create/modify
- Implementation details
- Testing requirements
- Acceptance criteria

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
