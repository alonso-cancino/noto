# Testing Guide

This document describes the testing strategy and guidelines for Noto.

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view detailed coverage.

### E2E Tests

```bash
# Run E2E tests (headless mode)
npm run test:e2e

# Run E2E tests with UI (interactive)
npm run test:e2e:ui
```

E2E tests use Playwright to test the full Electron application.

### All Tests

```bash
# Run linting, unit tests, and build (full CI check)
npm run lint && npm run test && npm run build
```

---

## Writing Tests

### Unit Tests

Unit tests are written using Jest and React Testing Library.

#### File Location

Place test files in a `__tests__` directory next to the source code:

```
src/
  renderer/
    components/
      Editor/
        index.tsx
        __tests__/
          Editor.test.tsx
    services/
      markdown.ts
      __tests__/
        markdown.test.ts
```

#### Naming Convention

- Component tests: `ComponentName.test.tsx`
- Service/utility tests: `serviceName.test.ts`

#### Example: Testing a Service

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
      const result = renderMarkdown('Equation: $E = mc^2$');
      expect(result).toContain('katex');
    });

    it('should render LaTeX math blocks', () => {
      const result = renderMarkdown('$$\\int_0^1 x dx$$');
      expect(result).toContain('katex-display');
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world test')).toBe(3);
    });

    it('should exclude code blocks from count', () => {
      const markdown = 'Text\n```\ncode here\n```\nMore text';
      expect(countWords(markdown)).toBe(3); // "Text", "More", "text"
    });

    it('should handle empty strings', () => {
      expect(countWords('')).toBe(0);
    });
  });
});
```

#### Example: Testing a React Component

```typescript
// src/renderer/components/StatusBar/__tests__/StatusBar.test.tsx
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../index';

describe('StatusBar', () => {
  it('should display word count', () => {
    render(<StatusBar wordCount={42} />);
    expect(screen.getByText(/42 words/i)).toBeInTheDocument();
  });

  it('should display file path', () => {
    render(<StatusBar wordCount={0} filePath="notes/test.md" />);
    expect(screen.getByText(/notes\/test\.md/i)).toBeInTheDocument();
  });

  it('should show dirty indicator when unsaved', () => {
    render(<StatusBar wordCount={0} isDirty={true} />);
    expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
  });
});
```

#### Mocking Electron APIs

Electron APIs are mocked in `src/__mocks__/electron.ts`. Use these mocks in your tests:

```typescript
// Test file that uses IPC
import { renderMarkdown } from '../someComponent';

// Electron APIs are automatically mocked by Jest
// Mock implementation defined in src/__mocks__/electron.ts

test('component uses IPC correctly', async () => {
  const result = await window.api['file:read']('test.md');
  expect(result).toBe('mocked content');
});
```

---

### E2E Tests

E2E tests are written using Playwright and test the complete Electron application.

#### File Location

Place E2E tests in the `e2e/` directory at the project root:

```
e2e/
  setup.ts              # Helper functions for launching app
  app.spec.ts           # Basic app launch tests
  markdown-editor.spec.ts  # Markdown editing workflow
  pdf-viewer.spec.ts    # PDF viewing workflow (Phase 3+)
```

#### Naming Convention

- Feature tests: `feature-name.spec.ts`
- Use descriptive names that reflect user workflows

#### Example: Basic E2E Test

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
```

#### Example: User Workflow Test

```typescript
// e2e/markdown-editor.spec.ts
import { test, expect } from '@playwright/test';
import { launchApp } from './setup';

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
  expect(preview).toContain('Some content');

  await app.close();
});
```

#### Helper Functions

Use helper functions from `e2e/setup.ts` to reduce boilerplate:

```typescript
// e2e/setup.ts
import { _electron as electron } from 'playwright';

export async function launchApp() {
  const app = await electron.launch({
    args: ['dist/main/index.js'],
  });
  return app;
}

export async function createFile(window: Page, filename: string, content: string) {
  await window.click('[data-testid="new-file"]');
  await window.fill('[data-testid="filename-input"]', filename);
  await window.press('[data-testid="filename-input"]', 'Enter');
  await window.fill('.monaco-editor textarea', content);
  await window.waitForSelector('[data-testid="saved-indicator"]');
}
```

---

## Test Requirements

### For Every PR

1. **Unit Tests Required:**
   - All new functions must have unit tests
   - All new React components must have unit tests
   - Aim for 80%+ coverage on new code

2. **E2E Tests Required:**
   - User-facing features must have E2E tests
   - Critical workflows must be tested end-to-end
   - At least one happy path test per feature

3. **All Tests Must Pass:**
   - `npm run lint` must pass (no errors)
   - `npm run test` must pass (all unit tests)
   - `npm run build` must succeed
   - `npm run test:e2e` must pass (if E2E tests added)

### Coverage Goals

- **Overall coverage:** 80%+
- **Critical paths:** 90%+ (authentication, file operations, IPC handlers)
- **New code:** Must maintain or improve overall coverage

---

## Testing Patterns

### Testing IPC Handlers

IPC handlers run in the main process but can be tested via mocks:

```typescript
// src/main/ipc/__tests__/file-handlers.test.ts
import { ipcMain } from 'electron';
import { localStorageService } from '../../services/LocalStorage';

// Mock the service
jest.mock('../../services/LocalStorage');

describe('file:read handler', () => {
  it('should read file content', async () => {
    const mockContent = '# Test';
    (localStorageService.readFile as jest.Mock).mockResolvedValue(mockContent);

    const handler = ipcMain.handle.mock.calls.find(
      (call) => call[0] === 'file:read'
    )[1];

    const result = await handler(null, 'test.md');
    expect(result).toBe(mockContent);
    expect(localStorageService.readFile).toHaveBeenCalledWith('test.md');
  });
});
```

### Testing Hooks

Custom React hooks can be tested using `@testing-library/react-hooks`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFileContent } from '../useFileContent';

test('useFileContent loads and saves files', async () => {
  const { result } = renderHook(() => useFileContent('test.md'));

  // Initial load
  await act(async () => {
    await result.current.load();
  });

  expect(result.current.content).toBe('loaded content');

  // Update content
  act(() => {
    result.current.setContent('new content');
  });

  expect(result.current.isDirty).toBe(true);

  // Save
  await act(async () => {
    await result.current.save();
  });

  expect(result.current.isDirty).toBe(false);
});
```

### Testing Async Operations

Use `async/await` for testing async operations:

```typescript
test('loads PDF asynchronously', async () => {
  const { result } = renderHook(() => usePDF('test.pdf'));

  // Initially loading
  expect(result.current.loading).toBe(true);

  // Wait for load to complete
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.pdf).toBeTruthy();
  expect(result.current.error).toBeNull();
});
```

### Testing Error States

Always test both success and error cases:

```typescript
describe('file operations', () => {
  it('should handle successful read', async () => {
    // ... test success
  });

  it('should handle read errors gracefully', async () => {
    (window.api['file:read'] as jest.Mock).mockRejectedValue(
      new Error('File not found')
    );

    const { result } = renderHook(() => useFileContent('missing.md'));

    await waitFor(() => {
      expect(result.current.error).toBe('File not found');
    });
  });
});
```

---

## Continuous Integration

### GitHub Actions

All tests run automatically on:
- Every push to `main`
- Every pull request

The CI workflow (`.github/workflows/ci.yml`) runs:
1. Linting (`npm run lint`)
2. Unit tests with coverage (`npm run test:coverage`)
3. Build (`npm run build`)
4. E2E tests (`npm run test:e2e`)

### Debugging CI Failures

If tests fail in CI:

1. **Check the GitHub Actions log** for error messages
2. **Run the same commands locally:**
   ```bash
   npm run lint
   npm run test
   npm run build
   npm run test:e2e
   ```
3. **If E2E tests fail:** Check screenshots in the `test-results/` directory (uploaded as artifacts)
4. **If tests pass locally but fail in CI:** Check for environment differences (timeouts, race conditions)

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation details
expect(component.state.counter).toBe(1);

// ✅ Good: Testing behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should display error message when file load fails', () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should increment counter when button clicked', () => {
  // Arrange: Set up test data
  render(<Counter initialValue={0} />);

  // Act: Perform action
  fireEvent.click(screen.getByRole('button', { name: /increment/i }));

  // Assert: Verify result
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 4. Keep Tests Isolated

Each test should be independent and not rely on other tests:

```typescript
// ✅ Good: Each test sets up its own data
describe('FileExplorer', () => {
  it('should display files', () => {
    const files = ['a.md', 'b.md'];
    render(<FileExplorer files={files} />);
    expect(screen.getByText('a.md')).toBeInTheDocument();
  });

  it('should handle empty file list', () => {
    render(<FileExplorer files={[]} />);
    expect(screen.getByText(/no files/i)).toBeInTheDocument();
  });
});
```

### 5. Test Edge Cases

Don't just test the happy path:

```typescript
describe('countWords', () => {
  it('should count normal text', () => {
    expect(countWords('hello world')).toBe(2);
  });

  it('should handle empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('should handle only whitespace', () => {
    expect(countWords('   \n  \t  ')).toBe(0);
  });

  it('should handle special characters', () => {
    expect(countWords('hello-world')).toBe(1);
  });
});
```

---

## Debugging Tests

### Running a Single Test

```bash
# Run only tests matching a pattern
npm run test -- --testNamePattern="markdown service"

# Run only tests in a specific file
npm run test -- src/renderer/services/__tests__/markdown.test.ts
```

### Debugging in VSCode

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Playwright UI Mode

For debugging E2E tests:

```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- Step through tests
- Inspect element selectors
- See screenshots and videos
- Time-travel through test steps

---

## Common Testing Mistakes

### ❌ Don't: Use `any` in Tests

```typescript
// ❌ Bad
const mockFn = jest.fn((data: any) => data);

// ✅ Good
interface TestData {
  id: string;
  value: number;
}
const mockFn = jest.fn((data: TestData) => data);
```

### ❌ Don't: Test Multiple Things in One Test

```typescript
// ❌ Bad
it('should do everything', () => {
  // Tests file creation, editing, saving, and deletion all in one
});

// ✅ Good
it('should create new file', () => { ... });
it('should edit existing file', () => { ... });
it('should save file changes', () => { ... });
it('should delete file', () => { ... });
```

### ❌ Don't: Rely on Test Execution Order

```typescript
// ❌ Bad: Second test depends on first test
describe('bad example', () => {
  let user: User;

  it('creates user', () => {
    user = createUser(); // Other tests depend on this
  });

  it('updates user', () => {
    updateUser(user); // Breaks if first test doesn't run
  });
});

// ✅ Good: Each test is independent
describe('good example', () => {
  it('creates user', () => {
    const user = createUser();
    expect(user).toBeTruthy();
  });

  it('updates user', () => {
    const user = createUser(); // Create fresh for this test
    updateUser(user);
    expect(user.updatedAt).toBeTruthy();
  });
});
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

## Questions?

If you have questions about testing:
1. Check existing tests for examples
2. Read this guide
3. Open an issue on GitHub
4. Ask in pull request comments
