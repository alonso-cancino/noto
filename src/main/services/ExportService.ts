/**
 * ExportService - Export markdown to PDF and HTML
 *
 * Features:
 * - Export markdown to PDF
 * - Export markdown to HTML
 * - Includes LaTeX rendering
 * - Preserves formatting
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import { BrowserWindow } from 'electron';

export class ExportService {
  private workspaceRoot: string;
  private md: MarkdownIt;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });
  }

  /**
   * Export markdown to HTML
   */
  async exportToHTML(filePath: string, outputPath: string): Promise<void> {
    try {
      // Read markdown file
      const fullPath = path.join(this.workspaceRoot, filePath);
      const markdown = await fs.readFile(fullPath, 'utf-8');

      // Convert to HTML with markdown-it
      const html = this.md.render(markdown);

      // Create complete HTML document with styling
      const completeHTML = this.wrapHTML(html, path.basename(filePath, '.md'));

      // Write to output
      await fs.writeFile(outputPath, completeHTML, 'utf-8');

      console.log(`Exported to HTML: ${outputPath}`);
    } catch (error) {
      console.error('Error exporting to HTML:', error);
      throw error;
    }
  }

  /**
   * Export markdown to PDF using Electron's printToPDF
   */
  async exportToPDF(filePath: string, outputPath: string): Promise<void> {
    let tempWindow: BrowserWindow | null = null;

    try {
      // Read markdown file
      const fullPath = path.join(this.workspaceRoot, filePath);
      const markdown = await fs.readFile(fullPath, 'utf-8');

      // Convert to HTML
      const html = this.md.render(markdown);
      const completeHTML = this.wrapHTML(html, path.basename(filePath, '.md'));

      // Create hidden browser window for PDF generation
      tempWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false, // Hidden window
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load HTML content
      await tempWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(completeHTML)}`
      );

      // Wait for KaTeX to render math (if any)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate PDF
      const pdfData = await tempWindow.webContents.printToPDF({
        margins: {
          top: 0.5,
          bottom: 0.5,
          left: 0.5,
          right: 0.5,
        },
        printBackground: true,
        pageSize: 'A4',
      });

      // Write PDF to file
      await fs.writeFile(outputPath, pdfData);

      console.log(`Exported to PDF: ${outputPath}`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    } finally {
      // Clean up: close the temporary window
      if (tempWindow && !tempWindow.isDestroyed()) {
        tempWindow.close();
      }
    }
  }

  /**
   * Wrap HTML content in a complete document
   */
  private wrapHTML(content: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #24292e;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    h1 {
      font-size: 2em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    h2 {
      font-size: 1.5em;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }

    code {
      background-color: #f6f8fa;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 85%;
      padding: 0.2em 0.4em;
    }

    pre {
      background-color: #f6f8fa;
      border-radius: 6px;
      padding: 16px;
      overflow: auto;
      line-height: 1.45;
    }

    pre code {
      background-color: transparent;
      padding: 0;
    }

    blockquote {
      border-left: 4px solid #dfe2e5;
      color: #6a737d;
      padding-left: 16px;
      margin-left: 0;
    }

    a {
      color: #0366d6;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }

    table th,
    table td {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
    }

    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }

    @media print {
      body {
        max-width: none;
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  ${content}

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    });
  </script>
</body>
</html>`;
  }
}
