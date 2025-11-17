/**
 * Noto Custom Protocol Handler
 * Handles noto:// URLs for opening PDFs at specific pages and annotations
 *
 * URL Format: noto://pdf/path/to/file.pdf#page=42&annotation=uuid
 */

import { protocol, app } from 'electron';
import { getMainWindow } from '../index';

/**
 * Parse a noto:// URL into its components
 */
function parseNotoUrl(url: string): {
  type: 'pdf' | 'note';
  path: string;
  page?: number;
  annotationId?: string;
} | null {
  try {
    // Remove noto:// prefix
    const urlWithoutProtocol = url.replace(/^noto:\/\//, '');

    // Split into type and rest
    const [type, ...pathParts] = urlWithoutProtocol.split('/');

    if (type !== 'pdf' && type !== 'note') {
      console.error('Invalid noto:// URL type:', type);
      return null;
    }

    // Join path parts and split by hash for query params
    const fullPath = pathParts.join('/');
    const [filePath, queryString] = fullPath.split('#');

    // Parse query parameters
    const params = new URLSearchParams(queryString || '');
    const page = params.get('page');
    const annotationId = params.get('annotation');

    return {
      type: type as 'pdf' | 'note',
      path: decodeURIComponent(filePath),
      page: page ? parseInt(page, 10) : undefined,
      annotationId: annotationId || undefined,
    };
  } catch (error) {
    console.error('Failed to parse noto:// URL:', url, error);
    return null;
  }
}

/**
 * Register the noto:// protocol handler
 */
export function registerProtocolHandler(): void {
  // Register protocol as privileged
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'noto',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
      },
    },
  ]);

  // Handle noto:// URLs when app is already running
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleNotoUrl(url);
  });

  // Handle noto:// URLs when app is launched with a URL (macOS)
  if (process.platform === 'darwin') {
    app.setAsDefaultProtocolClient('noto');
  }
}

/**
 * Handle a noto:// URL by sending appropriate IPC event to renderer
 */
export function handleNotoUrl(url: string): void {
  console.log('Handling noto:// URL:', url);

  const parsed = parseNotoUrl(url);
  if (!parsed) {
    console.error('Failed to parse noto:// URL:', url);
    return;
  }

  const mainWindow = getMainWindow();
  if (!mainWindow) {
    console.error('Main window not available');
    return;
  }

  // Send event to renderer based on type
  if (parsed.type === 'pdf') {
    mainWindow.webContents.send('open-citation', {
      pdfPath: parsed.path,
      page: parsed.page || 1,
      annotationId: parsed.annotationId,
    });
    console.log('Sent open-citation event:', {
      pdfPath: parsed.path,
      page: parsed.page || 1,
      annotationId: parsed.annotationId,
    });
  } else if (parsed.type === 'note') {
    // For future: handle note:// URLs
    mainWindow.webContents.send('file:open', { path: parsed.path });
  }
}

/**
 * Create a noto:// URL for a PDF citation
 */
export function createPdfCitationUrl(
  pdfPath: string,
  page: number,
  annotationId?: string
): string {
  const encodedPath = encodeURIComponent(pdfPath);
  let url = `noto://pdf/${encodedPath}#page=${page}`;

  if (annotationId) {
    url += `&annotation=${annotationId}`;
  }

  return url;
}

/**
 * Create a noto:// URL for a note
 */
export function createNoteCitationUrl(notePath: string): string {
  const encodedPath = encodeURIComponent(notePath);
  return `noto://note/${encodedPath}`;
}
