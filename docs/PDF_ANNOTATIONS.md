# PDF Annotations System

## Overview

Noto's PDF annotation system allows users to highlight text, add notes, and create area selections in PDF documents. Annotations are stored separately from the PDF file, synced via Google Drive, and can be cited in markdown notes with bidirectional linking.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│              PDF.js Rendering Layer                 │
│  - Loads and renders PDF pages to canvas            │
│  - Provides text layer for selection                │
│  - Extracts text content                            │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│           Annotation Overlay (SVG Layer)            │
│  - Renders highlights, notes, areas                 │
│  - Handles user interactions (click, drag)          │
│  - Positioned absolutely over PDF canvas            │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│            Annotation Service (Business Logic)      │
│  - CRUD operations for annotations                  │
│  - Text extraction from selections                  │
│  - Coordinate transformations                       │
│  - Citation link generation                         │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│         Annotation Storage (.annotations.json)      │
│  - JSON file stored alongside PDF                   │
│  - Synced to Google Drive                           │
│  - Version controlled                               │
└─────────────────────────────────────────────────────┘
```

## Data Model

### Annotation Interface

```typescript
interface Annotation {
  // Core identification
  id: string;                       // UUID v4
  type: AnnotationType;             // 'highlight' | 'note' | 'area'

  // Position on page
  pageNumber: number;               // 1-indexed
  bounds: Rectangle;                // Position and size

  // Visual properties
  color?: string;                   // Hex color (e.g., '#FFEB3B')
  opacity?: number;                 // 0.0 - 1.0 (default: 0.3)

  // Content
  text?: string;                    // Extracted text (for highlights)
  note?: string;                    // User's comment/note

  // Metadata
  createdAt: string;                // ISO 8601 timestamp
  modifiedAt: string;               // ISO 8601 timestamp

  // Citation tracking
  citedIn?: string[];               // Paths of markdown files citing this
}

type AnnotationType = 'highlight' | 'note' | 'area';

interface Rectangle {
  x: number;                        // % from left (0-100)
  y: number;                        // % from top (0-100)
  width: number;                    // % of page width (0-100)
  height: number;                   // % of page height (0-100)
}

// Why percentages?
// - PDFs can be zoomed/resized
// - Percentages are scale-independent
// - Easy to render at any viewport size
```

### Annotation File Format

```typescript
interface AnnotationFile {
  version: number;                  // Schema version (for migrations)
  pdfPath: string;                  // Relative path to PDF
  pdfHash?: string;                 // Optional: SHA-256 of PDF (detect changes)
  annotations: Annotation[];        // Array of annotations
}
```

**Example File:**

```json
{
  "version": 1,
  "pdfPath": "Research/deep-learning.pdf",
  "pdfHash": "a3c5f8...",
  "annotations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "highlight",
      "pageNumber": 3,
      "bounds": {
        "x": 15.5,
        "y": 42.3,
        "width": 70.2,
        "height": 2.8
      },
      "color": "#FFEB3B",
      "opacity": 0.4,
      "text": "Neural networks are computing systems inspired by biological neural networks.",
      "note": "Key definition - use in introduction",
      "createdAt": "2025-10-15T14:30:00.000Z",
      "modifiedAt": "2025-10-15T14:30:00.000Z",
      "citedIn": ["Notes/literature-review.md"]
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "type": "note",
      "pageNumber": 5,
      "bounds": {
        "x": 80.0,
        "y": 20.0,
        "width": 5.0,
        "height": 5.0
      },
      "note": "This section is confusing - revisit later",
      "createdAt": "2025-10-15T15:12:00.000Z",
      "modifiedAt": "2025-10-15T15:12:00.000Z"
    }
  ]
}
```

### Storage Location

```
MyResearch/
├── deep-learning.pdf
└── .deep-learning.pdf.annotations.json    # Hidden file (starts with .)
```

**Rationale:**
- Hidden file (`.` prefix) - doesn't clutter file explorer
- Same directory as PDF - easy to keep together
- Includes PDF filename - clearly associated
- `.json` extension - easy to parse/edit if needed

## User Interactions

### Creating Annotations

#### 1. Highlight

**User Flow:**
```
1. Click "Highlight" tool in toolbar
2. Select color (yellow, green, blue, red, purple)
3. Click and drag over text in PDF
4. Release mouse
5. Annotation created
6. Optional: Right-click → "Add Note" to attach comment
```

**Implementation:**

```typescript
class HighlightTool {
  private isActive = false;
  private startPoint: Point | null = null;
  private currentSelection: Rectangle | null = null;

  onMouseDown(event: MouseEvent, page: number): void {
    if (!this.isActive) return;

    this.startPoint = this.getPageCoordinates(event, page);
    this.currentSelection = null;
  }

  onMouseMove(event: MouseEvent, page: number): void {
    if (!this.startPoint) return;

    const currentPoint = this.getPageCoordinates(event, page);
    this.currentSelection = this.createRectangle(this.startPoint, currentPoint);

    // Show preview overlay
    this.renderPreview(this.currentSelection);
  }

  async onMouseUp(event: MouseEvent, page: number): Promise<void> {
    if (!this.currentSelection) return;

    // Extract text from selection
    const text = await this.extractTextFromRect(page, this.currentSelection);

    // Create annotation
    const annotation: Annotation = {
      id: uuidv4(),
      type: 'highlight',
      pageNumber: page,
      bounds: this.currentSelection,
      color: this.selectedColor,
      opacity: 0.4,
      text,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };

    // Save
    await annotationService.addAnnotation(this.pdfPath, annotation);

    // Render
    this.renderAnnotation(annotation);

    // Reset
    this.startPoint = null;
    this.currentSelection = null;
  }

  private async extractTextFromRect(
    page: number,
    rect: Rectangle
  ): Promise<string> {
    // Get text content from PDF.js
    const textContent = await this.pdfPage.getTextContent();

    // Filter text items within bounds
    const selectedItems = textContent.items.filter(item => {
      const itemRect = this.toPercentageRect(item.transform, item.width, item.height);
      return this.intersects(rect, itemRect);
    });

    // Concatenate text
    return selectedItems.map(item => item.str).join(' ');
  }
}
```

#### 2. Sticky Note

**User Flow:**
```
1. Click "Note" tool in toolbar
2. Click anywhere on PDF page
3. Note icon appears
4. Text input dialog opens
5. Type note content
6. Click "Save"
7. Note saved and icon remains
```

**Implementation:**

```typescript
class NoteTool {
  async onClick(event: MouseEvent, page: number): Promise<void> {
    const point = this.getPageCoordinates(event, page);

    // Show note input dialog
    const noteText = await this.showNoteDialog();

    if (!noteText) return;  // User cancelled

    const annotation: Annotation = {
      id: uuidv4(),
      type: 'note',
      pageNumber: page,
      bounds: {
        x: point.x,
        y: point.y,
        width: 5,   // Icon size (5% of page width)
        height: 5
      },
      note: noteText,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };

    await annotationService.addAnnotation(this.pdfPath, annotation);
    this.renderAnnotation(annotation);
  }
}
```

#### 3. Area Selection

**User Flow:**
```
1. Click "Area" tool in toolbar
2. Click and drag to select rectangular area (e.g., figure, table)
3. Release mouse
4. Optional: Add note describing the area
```

Similar to highlight but doesn't extract text.

### Viewing Annotations

**Rendering:**

```typescript
class AnnotationRenderer {
  renderAnnotation(annotation: Annotation, viewport: PDFViewport): void {
    const svg = this.getSVGLayer();

    switch (annotation.type) {
      case 'highlight':
        this.renderHighlight(annotation, viewport, svg);
        break;
      case 'note':
        this.renderNoteIcon(annotation, viewport, svg);
        break;
      case 'area':
        this.renderAreaBox(annotation, viewport, svg);
        break;
    }
  }

  private renderHighlight(
    annotation: Annotation,
    viewport: PDFViewport,
    svg: SVGElement
  ): void {
    // Convert percentage bounds to pixel coordinates
    const rect = this.boundsToPixels(annotation.bounds, viewport);

    // Create SVG rectangle
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    highlight.setAttribute('x', rect.x.toString());
    highlight.setAttribute('y', rect.y.toString());
    highlight.setAttribute('width', rect.width.toString());
    highlight.setAttribute('height', rect.height.toString());
    highlight.setAttribute('fill', annotation.color || '#FFEB3B');
    highlight.setAttribute('opacity', (annotation.opacity || 0.4).toString());
    highlight.setAttribute('data-annotation-id', annotation.id);
    highlight.style.cursor = 'pointer';

    // Add click handler
    highlight.addEventListener('click', () => {
      this.onAnnotationClick(annotation);
    });

    // Add to SVG
    svg.appendChild(highlight);
  }

  private renderNoteIcon(
    annotation: Annotation,
    viewport: PDFViewport,
    svg: SVGElement
  ): void {
    const pos = this.boundsToPixels(annotation.bounds, viewport);

    // Create note icon (SVG path or image)
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    icon.setAttribute('x', pos.x.toString());
    icon.setAttribute('y', pos.y.toString());
    icon.setAttribute('width', pos.width.toString());
    icon.setAttribute('height', pos.height.toString());
    icon.setAttribute('href', '/assets/note-icon.svg');
    icon.setAttribute('data-annotation-id', annotation.id);
    icon.style.cursor = 'pointer';

    // Show note on click
    icon.addEventListener('click', () => {
      this.showNotePopup(annotation);
    });

    svg.appendChild(icon);
  }

  private boundsToPixels(bounds: Rectangle, viewport: PDFViewport) {
    return {
      x: (bounds.x / 100) * viewport.width,
      y: (bounds.y / 100) * viewport.height,
      width: (bounds.width / 100) * viewport.width,
      height: (bounds.height / 100) * viewport.height
    };
  }
}
```

### Editing Annotations

**Context Menu:**

```typescript
class AnnotationContextMenu {
  show(annotation: Annotation, event: MouseEvent): void {
    const menu = [
      {
        label: 'Edit Note',
        click: () => this.editNote(annotation)
      },
      {
        label: 'Change Color',
        submenu: [
          { label: 'Yellow', click: () => this.changeColor(annotation, '#FFEB3B') },
          { label: 'Green', click: () => this.changeColor(annotation, '#C5E1A5') },
          { label: 'Blue', click: () => this.changeColor(annotation, '#90CAF9') },
          { label: 'Red', click: () => this.changeColor(annotation, '#EF5350') },
          { label: 'Purple', click: () => this.changeColor(annotation, '#CE93D8') }
        ]
      },
      {
        label: 'Quote in Note...',
        click: () => this.quoteInNote(annotation)
      },
      { type: 'separator' },
      {
        label: 'Delete',
        click: () => this.deleteAnnotation(annotation)
      }
    ];

    showContextMenu(menu, event.clientX, event.clientY);
  }

  private async editNote(annotation: Annotation): Promise<void> {
    const newNote = await showNoteDialog(annotation.note);

    if (newNote !== null) {
      annotation.note = newNote;
      annotation.modifiedAt = new Date().toISOString();
      await annotationService.updateAnnotation(this.pdfPath, annotation);
    }
  }

  private async changeColor(annotation: Annotation, color: string): Promise<void> {
    annotation.color = color;
    annotation.modifiedAt = new Date().toISOString();
    await annotationService.updateAnnotation(this.pdfPath, annotation);
    this.rerender(annotation);
  }

  private async deleteAnnotation(annotation: Annotation): Promise<void> {
    const confirmed = await showConfirmDialog(
      'Delete Annotation',
      'Are you sure you want to delete this annotation?'
    );

    if (confirmed) {
      await annotationService.deleteAnnotation(this.pdfPath, annotation.id);
      this.remove(annotation);
    }
  }
}
```

## Citation System

### Quoting Annotations in Markdown

**User Flow:**
```
1. Right-click on annotation in PDF
2. Select "Quote in Note..."
3. File picker appears
4. Select existing markdown file OR create new one
5. Citation inserted at cursor position (or end of file)
6. Annotation.citedIn[] updated
7. Both files saved and synced
```

**Citation Format:**

```markdown
> "Quoted text from the highlight"
> — [filename.pdf, p. 42](noto://pdf/path/to/filename.pdf#page=42&annotation=uuid)
```

**Implementation:**

```typescript
class CitationService {
  async createCitation(
    annotation: Annotation,
    targetMarkdownPath: string,
    insertPosition?: number
  ): Promise<void> {
    // 1. Generate citation text
    const citation = this.formatCitation(annotation);

    // 2. Read target markdown file
    let content = await ipc.readFile(targetMarkdownPath);

    // 3. Insert citation
    if (insertPosition !== undefined) {
      content = this.insertAt(content, citation, insertPosition);
    } else {
      content += '\n\n' + citation;
    }

    // 4. Save markdown file
    await ipc.writeFile(targetMarkdownPath, content);

    // 5. Update annotation's citedIn array
    annotation.citedIn = annotation.citedIn || [];
    if (!annotation.citedIn.includes(targetMarkdownPath)) {
      annotation.citedIn.push(targetMarkdownPath);
      annotation.modifiedAt = new Date().toISOString();
      await annotationService.updateAnnotation(this.pdfPath, annotation);
    }

    // 6. Show success notification
    showNotification(`Citation added to ${path.basename(targetMarkdownPath)}`);
  }

  private formatCitation(annotation: Annotation): string {
    const pdfName = path.basename(this.pdfPath);
    const quotedText = annotation.text || '[Area selection]';
    const url = this.generateNotoUrl(annotation);

    return `> "${quotedText}"\n> — [${pdfName}, p. ${annotation.pageNumber}](${url})`;
  }

  private generateNotoUrl(annotation: Annotation): string {
    // Custom URL scheme: noto://pdf/path#page=N&annotation=UUID
    const relativePath = this.pdfPath;  // Relative to Drive root
    return `noto://pdf/${relativePath}#page=${annotation.pageNumber}&annotation=${annotation.id}`;
  }
}
```

### Opening Citation Links

**User Flow:**
```
1. User clicks citation link in markdown preview
2. App intercepts noto:// protocol
3. Parse URL (path, page, annotation ID)
4. Open PDF in viewer
5. Navigate to page
6. Scroll to annotation
7. Flash/highlight the annotation
```

**Implementation:**

```typescript
// Register protocol handler (main process)
protocol.registerStringProtocol('noto', (request, callback) => {
  const url = new URL(request.url);

  if (url.hostname === 'pdf') {
    const pdfPath = url.pathname;  // /path/to/file.pdf
    const page = parseInt(url.searchParams.get('page') || '1');
    const annotationId = url.searchParams.get('annotation');

    // Send to renderer
    mainWindow.webContents.send('open-citation', {
      pdfPath,
      page,
      annotationId
    });
  }

  callback({ data: '', mimeType: 'text/plain' });
});

// Handle in renderer
ipcRenderer.on('open-citation', async ({ pdfPath, page, annotationId }) => {
  // 1. Open PDF file
  await fileManager.openFile(pdfPath);

  // 2. Navigate to page
  await pdfViewer.goToPage(page);

  // 3. Find and highlight annotation
  if (annotationId) {
    const annotation = await annotationService.getAnnotation(pdfPath, annotationId);
    if (annotation) {
      // Scroll to annotation
      pdfViewer.scrollToAnnotation(annotation);

      // Flash to draw attention
      pdfViewer.flashAnnotation(annotation);
    }
  }
});
```

### Backlinks

Show which markdown files cite a PDF:

```typescript
class BacklinksPanel {
  async showBacklinks(pdfPath: string): Promise<void> {
    // 1. Load annotations
    const annotations = await annotationService.getAnnotations(pdfPath);

    // 2. Collect all citations
    const backlinks = new Map<string, Annotation[]>();

    for (const annotation of annotations) {
      if (annotation.citedIn) {
        for (const mdPath of annotation.citedIn) {
          if (!backlinks.has(mdPath)) {
            backlinks.set(mdPath, []);
          }
          backlinks.get(mdPath)!.push(annotation);
        }
      }
    }

    // 3. Render in sidebar
    this.renderBacklinks(backlinks);
  }

  private renderBacklinks(backlinks: Map<string, Annotation[]>): void {
    const html = Array.from(backlinks.entries())
      .map(([mdPath, annotations]) => `
        <div class="backlink">
          <div class="backlink-file">${path.basename(mdPath)}</div>
          <ul class="backlink-annotations">
            ${annotations.map(ann => `
              <li onclick="openAnnotation('${ann.id}')">
                Page ${ann.pageNumber}: "${ann.text?.substring(0, 50)}..."
              </li>
            `).join('')}
          </ul>
        </div>
      `)
      .join('');

    this.backlinksContainer.innerHTML = html;
  }
}
```

## Annotations Sidebar

Shows all annotations for the current PDF:

```typescript
class AnnotationsSidebar {
  async refresh(pdfPath: string): Promise<void> {
    const annotations = await annotationService.getAnnotations(pdfPath);

    // Group by page
    const byPage = this.groupByPage(annotations);

    // Render
    this.render(byPage);
  }

  private groupByPage(annotations: Annotation[]): Map<number, Annotation[]> {
    const map = new Map<number, Annotation[]>();

    for (const ann of annotations) {
      if (!map.has(ann.pageNumber)) {
        map.set(ann.pageNumber, []);
      }
      map.get(ann.pageNumber)!.push(ann);
    }

    // Sort each page's annotations by y position
    for (const [page, anns] of map) {
      anns.sort((a, b) => a.bounds.y - b.bounds.y);
    }

    return map;
  }

  private render(byPage: Map<number, Annotation[]>): void {
    const html = Array.from(byPage.entries())
      .sort(([a], [b]) => a - b)  // Sort pages numerically
      .map(([page, annotations]) => `
        <div class="annotation-page-group">
          <h3>Page ${page}</h3>
          ${annotations.map(ann => this.renderAnnotationItem(ann)).join('')}
        </div>
      `)
      .join('');

    this.container.innerHTML = html;
  }

  private renderAnnotationItem(annotation: Annotation): string {
    const icon = this.getIcon(annotation.type);
    const preview = annotation.text?.substring(0, 100) || annotation.note?.substring(0, 100) || '';
    const color = annotation.color || '#666';

    return `
      <div class="annotation-item"
           onclick="jumpToAnnotation('${annotation.id}')"
           data-annotation-id="${annotation.id}">
        <div class="annotation-icon" style="color: ${color}">${icon}</div>
        <div class="annotation-content">
          <div class="annotation-preview">${preview}</div>
          ${annotation.note ? `<div class="annotation-note">${annotation.note}</div>` : ''}
          ${annotation.citedIn ? `<div class="annotation-citations">
            Cited in ${annotation.citedIn.length} note(s)
          </div>` : ''}
        </div>
      </div>
    `;
  }

  private getIcon(type: AnnotationType): string {
    switch (type) {
      case 'highlight': return '🖍️';
      case 'note': return '📝';
      case 'area': return '▢';
    }
  }
}
```

## Annotation Service

**CRUD Operations:**

```typescript
class AnnotationService {
  private cache = new Map<string, AnnotationFile>();

  // Create
  async addAnnotation(pdfPath: string, annotation: Annotation): Promise<void> {
    const file = await this.getOrCreateAnnotationFile(pdfPath);
    file.annotations.push(annotation);
    await this.saveAnnotationFile(pdfPath, file);
  }

  // Read
  async getAnnotations(pdfPath: string): Promise<Annotation[]> {
    const file = await this.getAnnotationFile(pdfPath);
    return file?.annotations || [];
  }

  async getAnnotation(pdfPath: string, id: string): Promise<Annotation | null> {
    const annotations = await this.getAnnotations(pdfPath);
    return annotations.find(a => a.id === id) || null;
  }

  // Update
  async updateAnnotation(pdfPath: string, annotation: Annotation): Promise<void> {
    const file = await this.getAnnotationFile(pdfPath);
    if (!file) throw new Error('Annotation file not found');

    const index = file.annotations.findIndex(a => a.id === annotation.id);
    if (index === -1) throw new Error('Annotation not found');

    file.annotations[index] = annotation;
    await this.saveAnnotationFile(pdfPath, file);
  }

  // Delete
  async deleteAnnotation(pdfPath: string, id: string): Promise<void> {
    const file = await this.getAnnotationFile(pdfPath);
    if (!file) return;

    file.annotations = file.annotations.filter(a => a.id !== id);
    await this.saveAnnotationFile(pdfPath, file);
  }

  // Helper methods
  private async getAnnotationFile(pdfPath: string): Promise<AnnotationFile | null> {
    if (this.cache.has(pdfPath)) {
      return this.cache.get(pdfPath)!;
    }

    const annotationPath = this.getAnnotationPath(pdfPath);

    try {
      const content = await ipc.readFile(annotationPath);
      const file = JSON.parse(content) as AnnotationFile;
      this.cache.set(pdfPath, file);
      return file;
    } catch (error) {
      // File doesn't exist yet
      return null;
    }
  }

  private async getOrCreateAnnotationFile(pdfPath: string): Promise<AnnotationFile> {
    const existing = await this.getAnnotationFile(pdfPath);

    if (existing) {
      return existing;
    }

    const newFile: AnnotationFile = {
      version: 1,
      pdfPath,
      annotations: []
    };

    this.cache.set(pdfPath, newFile);
    return newFile;
  }

  private async saveAnnotationFile(pdfPath: string, file: AnnotationFile): Promise<void> {
    const annotationPath = this.getAnnotationPath(pdfPath);
    const content = JSON.stringify(file, null, 2);

    await ipc.writeFile(annotationPath, content);
    this.cache.set(pdfPath, file);
  }

  private getAnnotationPath(pdfPath: string): string {
    const dir = path.dirname(pdfPath);
    const basename = path.basename(pdfPath);
    return path.join(dir, `.${basename}.annotations.json`);
  }
}
```

## Performance Considerations

### 1. Lazy Rendering

Only render annotations for visible pages:

```typescript
class PDFViewer {
  private visiblePages: Set<number> = new Set();

  onScroll(): void {
    const newVisiblePages = this.getVisiblePages();

    // Render newly visible pages
    for (const page of newVisiblePages) {
      if (!this.visiblePages.has(page)) {
        this.renderAnnotationsForPage(page);
      }
    }

    // Unrender non-visible pages (to save memory)
    for (const page of this.visiblePages) {
      if (!newVisiblePages.has(page)) {
        this.clearAnnotationsForPage(page);
      }
    }

    this.visiblePages = newVisiblePages;
  }
}
```

### 2. Caching

Cache annotation files in memory:

```typescript
// Already implemented in AnnotationService.cache
```

### 3. Debouncing Updates

Debounce saves when dragging to resize highlights:

```typescript
const debouncedSave = debounce(async (annotation: Annotation) => {
  await annotationService.updateAnnotation(pdfPath, annotation);
}, 500);

// User drags to resize
onDrag(newBounds) {
  annotation.bounds = newBounds;
  this.rerender(annotation);
  debouncedSave(annotation);  // Only save after 500ms of no changes
}
```

## Export & Import

### Export Annotations

```typescript
async function exportAnnotations(pdfPath: string, format: 'json' | 'md' | 'csv'): Promise<string> {
  const annotations = await annotationService.getAnnotations(pdfPath);

  switch (format) {
    case 'json':
      return JSON.stringify(annotations, null, 2);

    case 'md':
      return annotations.map(ann => `
## Page ${ann.pageNumber}

${ann.text ? `> ${ann.text}` : ''}

${ann.note || ''}

---
      `).join('\n');

    case 'csv':
      const rows = annotations.map(ann => [
        ann.pageNumber,
        ann.type,
        ann.text || '',
        ann.note || '',
        ann.createdAt
      ]);
      return csvStringify([['Page', 'Type', 'Text', 'Note', 'Created'], ...rows]);
  }
}
```

### Import Annotations

```typescript
async function importAnnotations(pdfPath: string, data: string, format: 'json'): Promise<void> {
  const annotations = JSON.parse(data) as Annotation[];

  for (const ann of annotations) {
    // Regenerate IDs to avoid conflicts
    ann.id = uuidv4();
    await annotationService.addAnnotation(pdfPath, ann);
  }
}
```

---

**Last updated:** 2025-10-18
