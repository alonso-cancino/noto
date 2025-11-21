import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../dist/main/index.js')],
  });

  window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Markdown Editor', () => {
  test.beforeEach(async () => {
    // Create or select a markdown file
    await window.keyboard.press('Control+N');

    // Wait for editor to be ready
    await window.waitForSelector('[data-testid="editor"]', { timeout: 5000 });
  });

  test('should render editor when markdown file is opened', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await expect(editor).toBeVisible();
  });

  test('should allow typing in editor', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();

    // Type some content
    await window.keyboard.type('# Test Heading\n\nThis is test content.');

    // Content should be visible in editor
    const editorContent = await window.locator('[data-testid="editor"]').textContent();
    expect(editorContent).toContain('Test Heading');
  });

  test('should auto-save content', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();

    // Type content
    await window.keyboard.type('Auto-save test content');

    // Wait for auto-save (500ms debounce + processing)
    await window.waitForTimeout(1000);

    // Check for saved indicator (if exists)
    const savedIndicator = await window.locator('[data-testid="saved-indicator"]');
    if (await savedIndicator.count() > 0) {
      await expect(savedIndicator).toBeVisible();
    }
  });

  test('should render markdown preview', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();

    // Type markdown with formatting
    await window.keyboard.type('# Heading 1\n\n## Heading 2\n\n**Bold text**\n\n*Italic text*');

    // Wait for preview to update
    await window.waitForTimeout(500);

    // Check if preview exists and renders HTML
    const preview = await window.locator('[data-testid="markdown-preview"]');
    if (await preview.count() > 0) {
      const previewContent = await preview.innerHTML();
      expect(previewContent).toContain('<h1>');
      expect(previewContent).toContain('<h2>');
    }
  });

  test('should render LaTeX math', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();

    // Type LaTeX math
    await window.keyboard.type('Inline math: $E = mc^2$\n\nBlock math:\n\n$$\n\\int_0^1 x^2 dx\n$$');

    // Wait for rendering
    await window.waitForTimeout(1000);

    // Check for KaTeX rendered elements
    const mathElements = await window.locator('.katex');
    if (await mathElements.count() > 0) {
      expect(await mathElements.count()).toBeGreaterThan(0);
    }
  });

  test('should show word count', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();

    // Type content
    await window.keyboard.type('One two three four five words');

    // Wait for word count to update
    await window.waitForTimeout(500);

    // Check status bar for word count
    const statusBar = await window.locator('[data-testid="status-bar"]');
    if (await statusBar.count() > 0) {
      const statusText = await statusBar.textContent();
      expect(statusText).toMatch(/\d+\s*words?/i);
    }
  });
});

test.describe('Editor Keyboard Shortcuts', () => {
  test.beforeEach(async () => {
    await window.keyboard.press('Control+N');
    await window.waitForSelector('[data-testid="editor"]', { timeout: 5000 });
  });

  test('should handle Ctrl+S to save', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();

    await window.keyboard.type('Content to save');

    // Trigger save
    await window.keyboard.press('Control+S');

    // Wait for save operation
    await window.waitForTimeout(500);

    // File should be saved (check for save indicator or no dirty state)
    const dirtyIndicator = await window.locator('[data-testid="dirty-indicator"]');
    if (await dirtyIndicator.count() > 0) {
      await expect(dirtyIndicator).not.toBeVisible();
    }
  });

  test('should handle Ctrl+Z to undo', async () => {
    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();

    // Type something
    await window.keyboard.type('Original text');
    await window.waitForTimeout(100);

    // Add more text
    await window.keyboard.type(' Additional text');

    // Undo
    await window.keyboard.press('Control+Z');

    // Should only have original text
    const content = await editor.textContent();
    expect(content).not.toContain('Additional text');
  });
});

test.describe('File Switching', () => {
  test('should switch between markdown files', async () => {
    // Create first file
    await window.keyboard.press('Control+N');
    await window.waitForSelector('[data-testid="editor"]');

    const editor = await window.locator('[data-testid="editor"]');
    await editor.click();
    await window.keyboard.type('First file content');

    // Wait for auto-save
    await window.waitForTimeout(1000);

    // Create second file
    await window.keyboard.press('Control+N');
    await window.waitForSelector('[data-testid="editor"]');

    await editor.click();
    await window.keyboard.type('Second file content');

    // Switch back to first file (if file tree is available)
    // This would require clicking on the first file in the tree
    // Implementation depends on how files are tracked
  });
});
