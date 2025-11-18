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
   * Export markdown to PDF (via HTML and print)
   * Note: This requires a more complex solution with puppeteer or similar
   * For now, we'll create an HTML file that can be printed to PDF
   */
  async exportToPDF(filePath: string, outputPath: string): Promise<void> {
    try {
      // For now, export to HTML with print-optimized CSS
      // In a full implementation, you would use puppeteer or electron's printToPDF
      const htmlPath = outputPath.replace('.pdf', '.html');
      await this.exportToHTML(filePath, htmlPath);

      console.log(`Exported to HTML (for PDF printing): ${htmlPath}`);
      console.log('Note: Use "Print to PDF" in your browser to create the final PDF');

      // TODO: Implement actual PDF generation using electron's printToPDF or puppeteer
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
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
