/**
 * Mock Electron APIs for testing
 * Provides mock implementations of IPC and other Electron features
 */

export const ipcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  send: jest.fn(),
};

export const contextBridge = {
  exposeInMainWorld: jest.fn(),
};

export const app = {
  getPath: jest.fn((name: string) => {
    if (name === 'userData') return '/mock/user/data';
    if (name === 'home') return '/mock/home';
    return '/mock/path';
  }),
  getVersion: jest.fn(() => '1.0.0'),
  getName: jest.fn(() => 'Noto'),
  quit: jest.fn(),
  on: jest.fn(),
};

export const BrowserWindow = jest.fn();

export const ipcMain = {
  handle: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeHandler: jest.fn(),
};

export const dialog = {
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn(),
  showMessageBox: jest.fn(),
};

export const shell = {
  openExternal: jest.fn(),
  openPath: jest.fn(),
};

// Mock the entire electron module
const electron = {
  ipcRenderer,
  contextBridge,
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
};

export default electron;
