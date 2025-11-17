import { _electron as electron, ElectronApplication, Page } from 'playwright';
import path from 'path';

/**
 * E2E test helpers for Electron
 */

export interface AppContext {
  app: ElectronApplication;
  window: Page;
}

/**
 * Launch the Electron app for testing
 */
export async function launchApp(): Promise<AppContext> {
  // Path to the built Electron app
  const electronPath = require('electron') as unknown as string;
  const appPath = path.join(__dirname, '..', 'dist', 'main', 'index.js');

  // Launch Electron app
  const app = await electron.launch({
    executablePath: electronPath,
    args: [appPath],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  // Get the first window
  const window = await app.firstWindow();

  // Wait for the app to be ready
  await window.waitForLoadState('domcontentloaded');

  return { app, window };
}

/**
 * Close the Electron app
 */
export async function closeApp(context: AppContext): Promise<void> {
  await context.app.close();
}

/**
 * Wait for an element with retry logic
 */
export async function waitForElement(
  window: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await window.waitForSelector(selector, { timeout });
}
