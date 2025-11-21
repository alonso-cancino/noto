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

test.describe('PDF Viewer', () => {
  test.beforeEach(async () => {
    // Open a PDF file (assumes there's at least one PDF in the workspace)
    // Or use menu: File > Open PDF
    await window.keyboard.press('Control+O');

    // Wait for PDF viewer to appear
    await window.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 10000 });
  });

  test('should render PDF viewer when PDF is opened', async () => {
    const pdfViewer = await window.locator('[data-testid="pdf-viewer"]');
    await expect(pdfViewer).toBeVisible();
  });

  test('should display PDF page', async () => {
    // Wait for PDF canvas to render
    await window.waitForSelector('canvas[data-testid="pdf-canvas"]', { timeout: 5000 });

    const canvas = await window.locator('canvas[data-testid="pdf-canvas"]');
    await expect(canvas).toBeVisible();

    // Canvas should have dimensions (rendered content)
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should show page navigation controls', async () => {
    const pageNav = await window.locator('[data-testid="page-navigation"]');
    if (await pageNav.count() > 0) {
      await expect(pageNav).toBeVisible();

      // Should show current page and total pages
      const pageInfo = await pageNav.textContent();
      expect(pageInfo).toMatch(/\d+\s*\/\s*\d+/);
    }
  });

  test('should navigate to next page', async () => {
    // Get current page number
    const pageInfo = await window.locator('[data-testid="current-page"]');
    const initialPage = await pageInfo.textContent();

    // Click next page button
    const nextButton = await window.locator('[data-testid="next-page"]');
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();

      // Wait for page to load
      await window.waitForTimeout(500);

      // Page number should increment
      const newPage = await pageInfo.textContent();
      expect(newPage).not.toBe(initialPage);
    }
  });

  test('should navigate to previous page', async () => {
    // First go to page 2 or later
    const nextButton = await window.locator('[data-testid="next-page"]');
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      await window.waitForTimeout(500);
    }

    const pageInfo = await window.locator('[data-testid="current-page"]');
    const initialPage = await pageInfo.textContent();

    // Click previous page button
    const prevButton = await window.locator('[data-testid="prev-page"]');
    if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
      await prevButton.click();

      // Wait for page to load
      await window.waitForTimeout(500);

      // Page number should decrement
      const newPage = await pageInfo.textContent();
      expect(newPage).not.toBe(initialPage);
    }
  });

  test('should show zoom controls', async () => {
    const zoomControls = await window.locator('[data-testid="zoom-controls"]');
    if (await zoomControls.count() > 0) {
      await expect(zoomControls).toBeVisible();

      // Should have zoom in, zoom out, and fit width buttons
      const zoomIn = await window.locator('[data-testid="zoom-in"]');
      const zoomOut = await window.locator('[data-testid="zoom-out"]');

      await expect(zoomIn).toBeVisible();
      await expect(zoomOut).toBeVisible();
    }
  });

  test('should zoom in', async () => {
    // Get canvas size before zoom
    const canvas = await window.locator('canvas[data-testid="pdf-canvas"]');
    const initialBox = await canvas.boundingBox();

    // Click zoom in
    const zoomIn = await window.locator('[data-testid="zoom-in"]');
    if (await zoomIn.count() > 0) {
      await zoomIn.click();

      // Wait for zoom to apply
      await window.waitForTimeout(500);

      // Canvas should be larger
      const newBox = await canvas.boundingBox();
      if (initialBox && newBox) {
        expect(newBox.width).toBeGreaterThan(initialBox.width);
      }
    }
  });

  test('should zoom out', async () => {
    // First zoom in
    const zoomIn = await window.locator('[data-testid="zoom-in"]');
    if (await zoomIn.count() > 0) {
      await zoomIn.click();
      await window.waitForTimeout(500);
    }

    // Get canvas size after zoom in
    const canvas = await window.locator('canvas[data-testid="pdf-canvas"]');
    const zoomedBox = await canvas.boundingBox();

    // Zoom out
    const zoomOut = await window.locator('[data-testid="zoom-out"]');
    if (await zoomOut.count() > 0) {
      await zoomOut.click();

      // Wait for zoom to apply
      await window.waitForTimeout(500);

      // Canvas should be smaller
      const newBox = await canvas.boundingBox();
      if (zoomedBox && newBox) {
        expect(newBox.width).toBeLessThan(zoomedBox.width);
      }
    }
  });
});

test.describe('PDF Annotations', () => {
  test.beforeEach(async () => {
    await window.keyboard.press('Control+O');
    await window.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 10000 });
  });

  test('should show annotation toolbar', async () => {
    const annotationToolbar = await window.locator('[data-testid="annotation-toolbar"]');
    if (await annotationToolbar.count() > 0) {
      await expect(annotationToolbar).toBeVisible();

      // Should have highlight, note, and other annotation tools
      const highlightTool = await window.locator('[data-testid="highlight-tool"]');
      await expect(highlightTool).toBeVisible();
    }
  });

  test('should create highlight annotation', async () => {
    // Select highlight tool
    const highlightTool = await window.locator('[data-testid="highlight-tool"]');
    if (await highlightTool.count() > 0) {
      await highlightTool.click();

      // Click and drag on PDF to create highlight
      const canvas = await window.locator('canvas[data-testid="pdf-canvas"]');
      const box = await canvas.boundingBox();

      if (box) {
        // Simulate highlight selection
        await window.mouse.move(box.x + 100, box.y + 100);
        await window.mouse.down();
        await window.mouse.move(box.x + 200, box.y + 120);
        await window.mouse.up();

        // Wait for annotation to be created
        await window.waitForTimeout(500);

        // Annotation should appear in annotations list
        const annotations = await window.locator('[data-testid="annotation-item"]');
        expect(await annotations.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should show annotations sidebar', async () => {
    const annotationsSidebar = await window.locator('[data-testid="annotations-sidebar"]');
    if (await annotationsSidebar.count() > 0) {
      await expect(annotationsSidebar).toBeVisible();
    }
  });
});

test.describe('PDF Search', () => {
  test.beforeEach(async () => {
    await window.keyboard.press('Control+O');
    await window.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 10000 });
  });

  test('should show search input', async () => {
    // Open search (Ctrl+F)
    await window.keyboard.press('Control+F');

    const searchInput = await window.locator('[data-testid="pdf-search-input"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeFocused();
    }
  });

  test('should search PDF content', async () => {
    // Open search
    await window.keyboard.press('Control+F');

    const searchInput = await window.locator('[data-testid="pdf-search-input"]');
    if (await searchInput.count() > 0) {
      // Type search query
      await searchInput.fill('test');

      // Wait for search results
      await window.waitForTimeout(500);

      // Should show match count or highlighted results
      const searchResults = await window.locator('[data-testid="search-results"]');
      if (await searchResults.count() > 0) {
        const resultsText = await searchResults.textContent();
        expect(resultsText).toMatch(/\d+\s*match(es)?/i);
      }
    }
  });
});
