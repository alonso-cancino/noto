import { test, expect } from '@playwright/test';
import { launchApp, closeApp, AppContext } from './setup';

test.describe('Noto App', () => {
  let context: AppContext;

  test.beforeAll(async () => {
    // Build the app before running E2E tests
    // This should be done in CI or manually before running tests
  });

  test.afterEach(async () => {
    if (context) {
      await closeApp(context);
    }
  });

  test('app launches successfully', async () => {
    context = await launchApp();
    const { window } = context;

    // Wait for the window to be visible
    await window.waitForLoadState('domcontentloaded');

    // Check that the window title is correct
    const title = await window.title();
    expect(title).toBe('Noto');
  });

  test('main layout renders correctly', async () => {
    context = await launchApp();
    const { window } = context;

    await window.waitForLoadState('domcontentloaded');

    // Check for main UI elements
    // File explorer should be visible
    const explorer = await window.locator('text=Explorer').isVisible();
    expect(explorer).toBeTruthy();

    // Status bar should be visible
    const statusBar = await window.locator('[class*="status"]').first();
    expect(await statusBar.isVisible()).toBeTruthy();
  });

  test('displays empty state when no file is selected', async () => {
    context = await launchApp();
    const { window } = context;

    await window.waitForLoadState('domcontentloaded');

    // Should show the "Select a file" message
    const emptyState = await window.locator('text=Select a file to open').isVisible();
    expect(emptyState).toBeTruthy();
  });
});
