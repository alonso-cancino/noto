# Contributing to Noto

Thank you for contributing to Noto! This guide is specifically designed for **Claude Code instances** working on this project, but applies to all contributors.

---

## Quick Start for Claude Code Instances

### 1. Read These Documents First
- [STATUS.md](STATUS.md) - Current implementation state
- [PR_ROADMAP.md](PR_ROADMAP.md) - All 52 PRs with detailed specs
- [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md) - PR ordering and parallelization
- [CLAUDE.md](CLAUDE.md) - Architecture and patterns
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical deep dive

### 2. Pick a PR
- Check [PR_DEPENDENCIES.md](PR_DEPENDENCIES.md) to see what's available
- Ensure dependencies are met (previous PRs merged)
- Create a branch: `feature/PR-XXX-short-description`

### 3. Development Cycle
```bash
# Setup
git checkout -b feature/PR-001-jest-setup
npm install

# Develop
# ... make changes ...

# Test locally
npm run lint
npm run test
npm run build

# Commit & push
git add .
git commit -m "PR-001: Add Jest testing infrastructure"
git push origin feature/PR-001-jest-setup

# Create PR on GitHub
```

---

## Development Setup

### Prerequisites
- Node.js v18+
- npm v9+
- Git
- VSCode (recommended) or any text editor

### Installation
```bash
git clone https://github.com/yourusername/noto.git
cd noto
npm install
npm run dev  # Launches app with hot reload
```

### File Locations
- **Workspace:** `~/.config/noto/workspace/` (Linux/macOS) or `%APPDATA%\noto\workspace\` (Windows)
- **Logs:** Console output when running `npm run dev`

---

## PR Workflow for Claude Code

### Step 1: Understand the PR

Read the PR specification in [PR_ROADMAP.md](PR_ROADMAP.md):
- What files to create
- What files to modify
- Dependencies (which PRs must be merged first)
- Testing requirements
- Acceptance criteria

### Step 2: Check Dependencies

Before starting a PR, verify:
```bash
# Check that dependency PRs are merged
git log --oneline | grep "PR-XXX"

# If dependency not merged, STOP and pick a different PR
```

### Step 3: Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/PR-XXX-short-name
```

**Branch naming convention:**
- `feature/PR-001-jest-setup`
- `feature/PR-006-pdfjs-integration`
- `feature/PR-023-quote-feature`

### Step 4: Implement

Follow the specification exactly:
1. Create files listed in "Files to Create"
2. Modify files listed in "Files to Modify"
3. Write tests (unit and/or E2E)
4. Update documentation if needed

**Important for Claude Code:**
- Read existing code patterns before implementing
- Use the same code style as existing files
- Follow the type-safe IPC pattern in CLAUDE.md
- No `any` types allowed

### Step 5: Test Thoroughly

```bash
# Run all checks (Phase 0 and later)
npm run lint          # Must pass
npm run test          # Must pass
npm run build         # Must succeed
npm run test:e2e      # Must pass (if E2E tests added)
```

**Before Phase 0 is complete:**
- Build must succeed: `npm run build`
- Manual testing required (no automated tests yet)

### Step 6: Create PR

Use this PR template:

```markdown
## PR-XXX: [Title from PR_ROADMAP.md]

**Complexity:** [Small/Medium/Large]
**Dependencies:** [PR numbers or "None"]
**Closes:** #XXX (if addressing an issue)

### Summary
[One-line description of what this PR does]

### Changes

**Files Created:**
- `path/to/file1.ts`
- `path/to/file2.tsx`

**Files Modified:**
- `path/to/existing/file.ts` - [what changed]
- `package.json` - Added dependencies

### Implementation Details
[Brief explanation of approach, any tricky decisions, etc.]

### Testing

**Unit Tests:**
- [ ] Added tests for new functionality
- [ ] All tests pass locally (`npm run test`)

**E2E Tests:**
- [ ] Added E2E test (if applicable)
- [ ] E2E tests pass locally (`npm run test:e2e`)

**Manual Testing:**
- [ ] Tested in development mode
- [ ] Tested edge cases
- [ ] [Specific test scenarios]

### Acceptance Criteria

From PR_ROADMAP.md:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] ...

### Pre-Merge Checklist

- [ ] `npm run lint` passes (Phase 0+)
- [ ] `npm run test` passes (Phase 0+)
- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes (if E2E tests added)
- [ ] All acceptance criteria met
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings
- [ ] Tested on target platform (Windows/Mac/Linux)

### Screenshots/Demo
[If UI changes, include before/after screenshots or GIF]

### Notes for Reviewer
[Any additional context, known limitations, future improvements, etc.]
```

### Step 7: Address Review Feedback

If changes are requested:
```bash
# Make changes
# ... edit files ...

# Test again
npm run lint
npm run test
npm run build

# Commit and push
git add .
git commit -m "PR-XXX: Address review feedback"
git push origin feature/PR-XXX-short-name
```

---

## Code Standards

### TypeScript

**Required:**
- Strict mode enabled
- No `any` types (use `unknown` and type guards if needed)
- Explicit return types for functions
- Interface for all props and state

**Example:**
```typescript
// ❌ Bad
function processData(data: any) {
  return data.map(x => x.value);
}

// ✅ Good
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

### React Components

**Required:**
- Functional components with hooks
- TypeScript interfaces for props
- Memoization for expensive computations
- Proper cleanup in useEffect

**Example:**
```typescript
// ✅ Good component structure
interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: Props): JSX.Element {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal">
      <h2>{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### IPC Communication

**Always use the type-safe pattern:**

1. **Define in types.ts:**
```typescript
export interface IpcHandlers {
  'file:read': (path: string) => Promise<string>;
}
```

2. **Implement in main process:**
```typescript
ipcMain.handle('file:read', async (event, path: string) => {
  return await localStorageService.readFile(path);
});
```

3. **Expose in preload:**
```typescript
const api = {
  'file:read': (path: string) => ipcRenderer.invoke('file:read', path),
};
contextBridge.exposeInMainWorld('api', api);
```

4. **Use in renderer:**
```typescript
const content = await window.api['file:read']('path/to/file.md');
```

### Error Handling

**Always:**
- Wrap IPC calls in try-catch
- Show user-friendly error messages
- Log errors for debugging
- Gracefully degrade when possible

```typescript
try {
  const result = await window.api['file:read'](path);
  setContent(result);
} catch (error) {
  console.error('Failed to read file:', error);
  setError('Could not load file. Please try again.');
  // Don't crash the app
}
```

---

## Testing Guidelines

### Unit Tests

**Location:** `__tests__/` directory next to source file

**Naming:** `ComponentName.test.tsx` or `utilityName.test.ts`

**Example:**
```typescript
// src/renderer/services/__tests__/markdown.test.ts
import { renderMarkdown, countWords } from '../markdown';

describe('markdown service', () => {
  describe('renderMarkdown', () => {
    it('should render headings', () => {
      const html = renderMarkdown('# Hello');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello');
    });

    it('should render LaTeX math', () => {
      const html = renderMarkdown('$E = mc^2$');
      expect(html).toContain('katex');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world')).toBe(2);
    });

    it('should exclude code blocks', () => {
      expect(countWords('Text\n```\ncode\n```')).toBe(1);
    });
  });
});
```

### E2E Tests

**Location:** `e2e/` directory at project root

**Naming:** `feature-name.spec.ts`

**Example:**
```typescript
// e2e/markdown-editor.spec.ts
import { test, expect } from '@playwright/test';
import { launchApp } from './setup';

test('complete markdown editing workflow', async () => {
  const app = await launchApp();
  const window = await app.firstWindow();

  // Create file
  await window.click('[data-testid="new-file"]');
  await window.fill('[data-testid="filename-input"]', 'test.md');
  await window.press('[data-testid="filename-input"]', 'Enter');

  // Edit content
  await window.fill('.monaco-editor textarea', '# Test\\n\\nContent');

  // Wait for auto-save
  await window.waitForSelector('[data-testid="saved-indicator"]');

  // Verify preview
  const preview = await window.textContent('.markdown-preview');
  expect(preview).toContain('Test');
  expect(preview).toContain('Content');

  await app.close();
});
```

### Test Requirements

**For every PR:**
- Unit tests for all new functions/components
- E2E test for user-facing features (Phase 0+)
- All tests must pass before merge
- Aim for 80%+ coverage on new code

---

## Common Pitfalls for Claude Code

### ❌ Don't: Skip Reading Existing Code

**Wrong:**
```typescript
// Writing new code without checking existing patterns
function loadFile(path) {  // Missing types, wrong pattern
  fetch(path).then(...)    // Not using IPC
}
```

**Right:**
```typescript
// Check how existing code does it
// In this project, we use IPC for file operations:
async function loadFile(path: string): Promise<string> {
  return await window.api['file:read'](path);
}
```

### ❌ Don't: Implement Dependencies That Don't Exist

**Wrong:**
```typescript
// PR-023 depends on PR-022 (Citation Service)
// But PR-022 isn't merged yet

import { CitationService } from '../services/CitationService';  // Doesn't exist!
const citation = CitationService.format(...);  // Will fail
```

**Right:**
```typescript
// Check dependencies first
// If PR-022 not merged, STOP and pick a different PR
// Or implement PR-022 first, then PR-023
```

### ❌ Don't: Use `any` Types

**Wrong:**
```typescript
function process(data: any) {
  return data.map((x: any) => x.value);
}
```

**Right:**
```typescript
interface DataItem {
  value: string;
}

function process(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```

### ❌ Don't: Forget to Update Types

**Wrong:**
```typescript
// Adding new IPC handler but not updating types.ts
ipcMain.handle('new:operation', async () => { ... });
```

**Right:**
```typescript
// 1. Update src/shared/types.ts
export interface IpcHandlers {
  'new:operation': () => Promise<Result>;
}

// 2. Then implement handler
ipcMain.handle('new:operation', async () => { ... });

// 3. Expose in preload
// 4. Use in renderer
```

---

## File Organization Patterns

### Component Structure
```
ComponentName/
├── index.tsx              # Main component export
├── ComponentName.tsx      # Component implementation (if complex)
├── types.ts              # Component-specific types
├── ComponentName.module.css  # Scoped styles (if not Tailwind)
└── __tests__/
    └── ComponentName.test.tsx
```

### Service Structure
```
services/
├── ServiceName.ts        # Service implementation
├── types.ts             # Service types (if many)
└── __tests__/
    └── ServiceName.test.ts
```

---

## Git Commit Messages

**Format:**
```
PR-XXX: Brief description of change

Longer explanation if needed.

- Bullet points for details
- Related changes
```

**Examples:**
```
PR-001: Add Jest testing infrastructure

Sets up Jest with React Testing Library for unit testing.
Includes example tests for markdown service.

- Added jest.config.js
- Configured TypeScript support
- Mocked Electron APIs
```

```
PR-006: Integrate PDF.js for PDF rendering

Implements basic PDF viewing with PDF.js.
Can load and render first page of PDF files.

- Created PDFViewer component
- Added usePDF hook for state management
- Configured worker path in Vite
```

---

## Documentation Requirements

### Code Comments

**When to comment:**
- Complex algorithms or logic
- Non-obvious decisions
- Workarounds for bugs/limitations
- Public APIs

**When NOT to comment:**
- Obvious code (don't state what code does)
- Redundant information

**Example:**
```typescript
// ❌ Bad: Obvious
// Set the title
setTitle('Hello');

// ✅ Good: Explains WHY
// PDF.js requires worker to be in public directory due to Vite's
// asset handling. See: https://github.com/mozilla/pdf.js/issues/xxxx
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

### JSDoc for Public APIs

```typescript
/**
 * Renders markdown text to HTML with LaTeX math support.
 *
 * @param markdown - Raw markdown text
 * @returns HTML string with rendered content
 * @throws {Error} If markdown parsing fails
 *
 * @example
 * ```typescript
 * const html = renderMarkdown('# Hello\n\n$E = mc^2$');
 * ```
 */
export function renderMarkdown(markdown: string): string {
  // ...
}
```

### README Updates

If your PR changes:
- Installation process
- Available commands
- User-facing features

Then update README.md in the same PR.

---

## Communication for Multiple Instances

If you're part of a team of Claude instances:

### Create Status File
Create `INSTANCE_STATUS.md` at project root:
```markdown
# Instance Status

Last Updated: 2025-01-17 14:30

## Instance 1 (Testing Lead)
- **Current:** PR-003 (GitHub Actions CI)
- **Status:** In progress (80% complete)
- **Blocked:** No
- **ETA:** 2 hours
- **Next:** PR-004 (Playwright)

## Instance 2 (UI Lead)
- **Current:** PR-002 (ESLint/Prettier)
- **Status:** Complete, waiting for review
- **Blocked:** No
- **Next:** PR-005 (Documentation)

## Available PRs
- None (waiting for PR-001, PR-002 to merge)

## Blocked PRs
- PR-006 (blocked by Phase 0 completion)
```

### Check Before Starting
1. Read `INSTANCE_STATUS.md`
2. Check if your target PR is available
3. Update status when you start
4. Update when you finish

---

## Getting Help

### For Claude Code Instances

If you encounter issues:
1. Check [CLAUDE.md](CLAUDE.md) for patterns
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for design
3. Check [STATUS.md](STATUS.md) for current state
4. Check existing code for similar patterns
5. Look at recently merged PRs for examples

### For Human Contributors

- Open an issue on GitHub
- Join discussions
- Ask in PR comments

---

## Definition of Done

A PR is ready to merge when:

**Code:**
- [ ] All files created as specified
- [ ] All files modified as specified
- [ ] Follows TypeScript standards (no `any`)
- [ ] Follows existing code patterns
- [ ] No console errors or warnings

**Testing:**
- [ ] Unit tests added and passing
- [ ] E2E tests added (if applicable) and passing
- [ ] Manual testing performed
- [ ] Edge cases tested

**Quality:**
- [ ] `npm run lint` passes (Phase 0+)
- [ ] `npm run test` passes (Phase 0+)
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors

**Documentation:**
- [ ] Code comments for complex logic
- [ ] JSDoc for public APIs
- [ ] README updated (if needed)
- [ ] PR description complete

**Acceptance Criteria:**
- [ ] All criteria from PR_ROADMAP.md met

---

## Quick Reference

```bash
# Development
npm install              # Install dependencies
npm run dev              # Run in development mode
npm run build            # Build for production

# Testing (Phase 0+)
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix lint issues
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report

# Distribution (Phase 8)
npm run package          # Package as executable
npm run make             # Create installers
```

---

## Thank You!

Your contributions are helping build a tool for researchers worldwide. Every PR, no matter how small, moves the project forward.

**Questions?** Check the documentation or open an issue.

**Ready to contribute?** Pick a PR from [PR_ROADMAP.md](PR_ROADMAP.md) and get started!
