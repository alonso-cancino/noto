import { contextBridge, ipcRenderer } from 'electron';
import type { IpcHandlers, IpcEvents } from '../shared/types';

/**
 * Preload script - exposes safe IPC APIs to renderer process
 * This runs in a special context with access to both Node.js and browser APIs
 */

// Create type-safe IPC API
const api: {
  [K in keyof IpcHandlers]: (...args: Parameters<IpcHandlers[K]>) => ReturnType<IpcHandlers[K]>;
} = {
  // File operations
  'file:read': (path: string) => ipcRenderer.invoke('file:read', path),
  'file:write': (path: string, content: string) => ipcRenderer.invoke('file:write', path, content),
  'file:delete': (path: string) => ipcRenderer.invoke('file:delete', path),
  'file:rename': (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('file:rename', oldPath, newPath),
  'file:list': (folderPath?: string) => ipcRenderer.invoke('file:list', folderPath),
  'file:create': (path: string, type) => ipcRenderer.invoke('file:create', path, type),
  'file:import-pdf': (fileName: string, base64Data: string) =>
    ipcRenderer.invoke('file:import-pdf', fileName, base64Data),

  // Google Drive operations
  'drive:auth': () => ipcRenderer.invoke('drive:auth'),
  'drive:signout': () => ipcRenderer.invoke('drive:signout'),
  'drive:sync': () => ipcRenderer.invoke('drive:sync'),
  'drive:status': () => ipcRenderer.invoke('drive:status'),
  'drive:selectFolder': () => ipcRenderer.invoke('drive:selectFolder'),

  // PDF annotation operations
  'pdf:getAnnotations': (pdfPath: string) => ipcRenderer.invoke('pdf:getAnnotations', pdfPath),
  'pdf:addAnnotation': (pdfPath: string, annotation) =>
    ipcRenderer.invoke('pdf:addAnnotation', pdfPath, annotation),
  'pdf:updateAnnotation': (pdfPath: string, annotation) =>
    ipcRenderer.invoke('pdf:updateAnnotation', pdfPath, annotation),
  'pdf:deleteAnnotation': (pdfPath: string, annotationId: string) =>
    ipcRenderer.invoke('pdf:deleteAnnotation', pdfPath, annotationId),

  // Search operations
  'search:query': (query: string) => ipcRenderer.invoke('search:query', query),
  'search:index': (filePath: string) => ipcRenderer.invoke('search:index', filePath),

  // Settings operations
  'settings:get': () => ipcRenderer.invoke('settings:get'),
  'settings:set': (settings) => ipcRenderer.invoke('settings:set', settings),

  // Citation operations
  'citation:create': (annotation, targetPath, insertPosition) =>
    ipcRenderer.invoke('citation:create', annotation, targetPath, insertPosition),
  'citation:getBacklinks': (pdfPath: string) =>
    ipcRenderer.invoke('citation:getBacklinks', pdfPath),

  // Recent files operations
  'recent:get': () => ipcRenderer.invoke('recent:get'),
  'recent:add': (filePath: string) => ipcRenderer.invoke('recent:add', filePath),
  'recent:clear': () => ipcRenderer.invoke('recent:clear'),

  // Export operations
  'export:markdown-to-html': (filePath: string, outputPath?: string) =>
    ipcRenderer.invoke('export:markdown-to-html', filePath, outputPath),
  'export:markdown-to-pdf': (filePath: string, outputPath?: string) =>
    ipcRenderer.invoke('export:markdown-to-pdf', filePath, outputPath),

  // App operations
  'app:getVersion': () => ipcRenderer.invoke('app:getVersion'),
  'app:openExternal': (url: string) => ipcRenderer.invoke('app:openExternal', url),

  // Auto-updater operations
  'updater:check-for-updates': () => ipcRenderer.invoke('updater:check-for-updates'),
  'updater:download-update': () => ipcRenderer.invoke('updater:download-update'),
  'updater:quit-and-install': () => ipcRenderer.invoke('updater:quit-and-install'),
  'updater:get-version': () => ipcRenderer.invoke('updater:get-version'),
  'updater:is-supported': () => ipcRenderer.invoke('updater:is-supported'),
};

// Event listeners
const events = {
  on: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => {
    ipcRenderer.on(channel, (_event, ...args) => {
      // @ts-expect-error - TypeScript struggles with variadic args here
      listener(...args);
    });
  },

  off: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.removeListener(channel, listener as any);
  },
};

// Expose to renderer
contextBridge.exposeInMainWorld('api', api);
contextBridge.exposeInMainWorld('events', events);

// Augment Window interface for TypeScript
declare global {
  interface Window {
    api: typeof api;
    events: typeof events;
  }
}
