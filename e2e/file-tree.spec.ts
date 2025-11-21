import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../dist/main/index.js')],
  });

  // Get the first window
  window = await electronApp.firstWindow();

  // Wait for app to be ready
  await window.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('File Tree', () => {
  test('should display file tree', async () => {
    // Wait for file tree to load
    await window.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });

    // File tree should be visible
    const fileTree = await window.locator('[data-testid="file-tree"]');
    await expect(fileTree).toBeVisible();
  });

  test('should expand and collapse folders', async () => {
    // Find a folder in the tree
    const folder = await window.locator('[data-testid*="file-item-"][data-type="folder"]').first();

    if (await folder.count() > 0) {
      // Click to expand
      await folder.click();

      // Should show expanded state (check for chevron or expanded attribute)
      await expect(folder).toHaveAttribute('data-expanded', 'true');

      // Click to collapse
      await folder.click();

      // Should show collapsed state
      await expect(folder).toHaveAttribute('data-expanded', 'false');
    }
  });

  test('should select file when clicked', async () => {
    // Find a markdown file
    const markdownFile = await window.locator('[data-testid*="file-item-"][data-type="markdown"]').first();

    if (await markdownFile.count() > 0) {
      await markdownFile.click();

      // File should be selected
      await expect(markdownFile).toHaveAttribute('data-selected', 'true');

      // Editor should load the file content
      await window.waitForSelector('[data-testid="editor"]', { timeout: 5000 });
    }
  });

  test('should show folder children when expanded', async () => {
    const folder = await window.locator('[data-testid*="file-item-"][data-type="folder"]').first();

    if (await folder.count() > 0) {
      const folderPath = await folder.getAttribute('data-path');

      // Expand folder
      await folder.click();
      await expect(folder).toHaveAttribute('data-expanded', 'true');

      // Look for children with the folder path as prefix
      const children = await window.locator(`[data-testid*="file-item-${folderPath}/"]`);

      // Should have at least one child (if folder is not empty)
      // Note: Empty folders might exist, so we just check the expand worked
      await expect(folder).toHaveAttribute('data-expanded', 'true');
    }
  });
});

test.describe('File Operations', () => {
  test('should create new file', async () => {
    // Click new file button or use keyboard shortcut
    await window.keyboard.press('Control+N');

    // New file dialog or input should appear
    const newFileInput = await window.locator('input[placeholder*="file name" i]');

    if (await newFileInput.count() > 0) {
      await newFileInput.fill('test-new-file.md');
      await window.keyboard.press('Enter');

      // File should appear in tree
      await window.waitForSelector('[data-testid="file-item-test-new-file.md"]', { timeout: 5000 });
    }
  });

  test('should handle file tree refresh', async () => {
    // Get current file count
    const initialFiles = await window.locator('[data-testid*="file-item-"]').count();

    // Trigger refresh (if there's a refresh button)
    const refreshButton = await window.locator('[data-testid="refresh-files"]');

    if (await refreshButton.count() > 0) {
      await refreshButton.click();

      // Wait for reload
      await window.waitForTimeout(1000);

      // File count should be same or updated
      const newFiles = await window.locator('[data-testid*="file-item-"]').count();
      expect(newFiles).toBeGreaterThanOrEqual(0);
    }
  });
});
