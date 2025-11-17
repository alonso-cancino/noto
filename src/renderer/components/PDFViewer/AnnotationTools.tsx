/**
 * PDF Annotation Tools
 * Implements highlight, note, and area selection tools
 */

import { Annotation, Rectangle } from '../../../shared/types';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { v4 as uuidv4 } from 'uuid';

export type AnnotationToolType = 'highlight' | 'note' | 'area' | 'none';

export interface Point {
  x: number;
  y: number;
}

export interface ToolOptions {
  color: string;
  opacity: number;
}

/**
 * Base class for annotation tools
 */
abstract class AnnotationTool {
  protected isActive = false;
  protected currentPage: number = 1;
  protected pdfPage: PDFPageProxy | null = null;
  protected options: ToolOptions;

  constructor(options: ToolOptions) {
    this.options = options;
  }

  setActive(active: boolean): void {
    this.isActive = active;
  }

  setPage(page: number, pdfPage: PDFPageProxy | null): void {
    this.currentPage = page;
    this.pdfPage = pdfPage;
  }

  setOptions(options: Partial<ToolOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Convert client coordinates to page percentage coordinates
   */
  protected getPageCoordinates(
    event: MouseEvent,
    containerElement: HTMLElement
  ): Point {
    const rect = containerElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  }

  /**
   * Create rectangle from two points
   */
  protected createRectangle(start: Point, end: Point): Rectangle {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    return { x, y, width, height };
  }

  /**
   * Extract text from rectangular region using PDF.js
   */
  protected async extractTextFromRect(
    rect: Rectangle
  ): Promise<string> {
    if (!this.pdfPage) return '';

    try {
      const textContent = await this.pdfPage.getTextContent();
      const viewport = this.pdfPage.getViewport({ scale: 1.0 });

      // Convert percentage bounds to pixel coordinates (at scale 1.0)
      const pixelRect = {
        x: (rect.x / 100) * viewport.width,
        y: (rect.y / 100) * viewport.height,
        width: (rect.width / 100) * viewport.width,
        height: (rect.height / 100) * viewport.height,
      };

      // Filter text items that intersect with the selection
      const selectedItems: string[] = [];

      for (const item of textContent.items) {
        if ('transform' in item && 'str' in item) {
          const transform = item.transform;
          const itemX = transform[4];
          const itemY = viewport.height - transform[5]; // PDF coordinates are bottom-up
          const itemWidth = item.width || 0;
          const itemHeight = item.height || 10; // Estimate if not provided

          // Check if item intersects with selection rectangle
          const intersects = !(
            itemX + itemWidth < pixelRect.x ||
            itemX > pixelRect.x + pixelRect.width ||
            itemY + itemHeight < pixelRect.y ||
            itemY > pixelRect.y + pixelRect.height
          );

          if (intersects) {
            selectedItems.push(item.str);
          }
        }
      }

      return selectedItems.join(' ').trim();
    } catch (error) {
      console.error('Error extracting text:', error);
      return '';
    }
  }

  // Abstract methods to be implemented by specific tools
  abstract onMouseDown(event: MouseEvent, container: HTMLElement): void;
  abstract onMouseMove(event: MouseEvent, container: HTMLElement): void;
  abstract onMouseUp(event: MouseEvent, container: HTMLElement): Promise<Annotation | null>;
  abstract onClick(event: MouseEvent, container: HTMLElement): Promise<Annotation | null>;
}

/**
 * Highlight Tool
 * Click and drag to create highlighted text annotations
 */
export class HighlightTool extends AnnotationTool {
  private startPoint: Point | null = null;
  private currentSelection: Rectangle | null = null;
  private previewCallback?: (rect: Rectangle | null) => void;

  setPreviewCallback(callback: (rect: Rectangle | null) => void): void {
    this.previewCallback = callback;
  }

  onMouseDown(event: MouseEvent, container: HTMLElement): void {
    if (!this.isActive) return;
    this.startPoint = this.getPageCoordinates(event, container);
    this.currentSelection = null;
  }

  onMouseMove(event: MouseEvent, container: HTMLElement): void {
    if (!this.isActive || !this.startPoint) return;

    const currentPoint = this.getPageCoordinates(event, container);
    this.currentSelection = this.createRectangle(this.startPoint, currentPoint);

    // Show preview
    if (this.previewCallback) {
      this.previewCallback(this.currentSelection);
    }
  }

  async onMouseUp(event: MouseEvent, container: HTMLElement): Promise<Annotation | null> {
    if (!this.isActive || !this.currentSelection) {
      this.reset();
      return null;
    }

    // Ignore very small selections (likely accidental clicks)
    if (this.currentSelection.width < 1 || this.currentSelection.height < 0.5) {
      this.reset();
      return null;
    }

    // Extract text from selection
    const text = await this.extractTextFromRect(this.currentSelection);

    const annotation: Annotation = {
      id: uuidv4(),
      type: 'highlight',
      pageNumber: this.currentPage,
      bounds: this.currentSelection,
      color: this.options.color,
      opacity: this.options.opacity,
      text,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    this.reset();
    return annotation;
  }

  onClick(): Promise<Annotation | null> {
    // Highlight tool doesn't use click, only drag
    return Promise.resolve(null);
  }

  private reset(): void {
    this.startPoint = null;
    this.currentSelection = null;
    if (this.previewCallback) {
      this.previewCallback(null);
    }
  }
}

/**
 * Note Tool
 * Click to place sticky note annotations
 */
export class NoteTool extends AnnotationTool {
  private noteCallback?: (point: Point) => Promise<string | null>;

  setNoteCallback(callback: (point: Point) => Promise<string | null>): void {
    this.noteCallback = callback;
  }

  onMouseDown(): void {
    // Note tool doesn't use mouse down
  }

  onMouseMove(): void {
    // Note tool doesn't use mouse move
  }

  onMouseUp(): Promise<Annotation | null> {
    // Note tool uses click instead of mouse up
    return Promise.resolve(null);
  }

  async onClick(event: MouseEvent, container: HTMLElement): Promise<Annotation | null> {
    if (!this.isActive) return null;

    const point = this.getPageCoordinates(event, container);

    // Show note input dialog
    const noteText = this.noteCallback ? await this.noteCallback(point) : null;

    if (!noteText) return null; // User cancelled

    const annotation: Annotation = {
      id: uuidv4(),
      type: 'note',
      pageNumber: this.currentPage,
      bounds: {
        x: point.x - 2.5, // Center the 5% icon
        y: point.y - 2.5,
        width: 5, // Icon size (5% of page width)
        height: 5,
      },
      note: noteText,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    return annotation;
  }
}

/**
 * Area Selection Tool
 * Click and drag to create rectangular area annotations (for figures, tables, etc.)
 */
export class AreaTool extends AnnotationTool {
  private startPoint: Point | null = null;
  private currentSelection: Rectangle | null = null;
  private previewCallback?: (rect: Rectangle | null) => void;
  private noteCallback?: () => Promise<string | null>;

  setPreviewCallback(callback: (rect: Rectangle | null) => void): void {
    this.previewCallback = callback;
  }

  setNoteCallback(callback: () => Promise<string | null>): void {
    this.noteCallback = callback;
  }

  onMouseDown(event: MouseEvent, container: HTMLElement): void {
    if (!this.isActive) return;
    this.startPoint = this.getPageCoordinates(event, container);
    this.currentSelection = null;
  }

  onMouseMove(event: MouseEvent, container: HTMLElement): void {
    if (!this.isActive || !this.startPoint) return;

    const currentPoint = this.getPageCoordinates(event, container);
    this.currentSelection = this.createRectangle(this.startPoint, currentPoint);

    // Show preview
    if (this.previewCallback) {
      this.previewCallback(this.currentSelection);
    }
  }

  async onMouseUp(): Promise<Annotation | null> {
    if (!this.isActive || !this.currentSelection) {
      this.reset();
      return null;
    }

    // Ignore very small selections
    if (this.currentSelection.width < 2 || this.currentSelection.height < 2) {
      this.reset();
      return null;
    }

    // Optionally get note for the area
    const note = this.noteCallback ? await this.noteCallback() : undefined;

    const annotation: Annotation = {
      id: uuidv4(),
      type: 'area',
      pageNumber: this.currentPage,
      bounds: this.currentSelection,
      color: this.options.color,
      opacity: this.options.opacity,
      note,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    this.reset();
    return annotation;
  }

  onClick(): Promise<Annotation | null> {
    // Area tool doesn't use click, only drag
    return Promise.resolve(null);
  }

  private reset(): void {
    this.startPoint = null;
    this.currentSelection = null;
    if (this.previewCallback) {
      this.previewCallback(null);
    }
  }
}

/**
 * Tool Manager
 * Coordinates between different annotation tools
 */
export class AnnotationToolManager {
  private tools: Map<AnnotationToolType, AnnotationTool>;
  private currentTool: AnnotationToolType = 'none';
  private containerElement: HTMLElement | null = null;

  constructor() {
    const defaultOptions: ToolOptions = {
      color: '#FFEB3B',
      opacity: 0.4,
    };

    this.tools = new Map([
      ['highlight', new HighlightTool(defaultOptions)],
      ['note', new NoteTool(defaultOptions)],
      ['area', new AreaTool({ ...defaultOptions, color: '#90CAF9' })],
    ]);

    // Bind event handlers
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  setContainer(element: HTMLElement | null): void {
    // Remove old listeners
    if (this.containerElement) {
      this.removeEventListeners(this.containerElement);
    }

    this.containerElement = element;

    // Add new listeners
    if (this.containerElement) {
      this.addEventListeners(this.containerElement);
    }
  }

  setTool(toolType: AnnotationToolType): void {
    // Deactivate current tool
    if (this.currentTool !== 'none') {
      this.tools.get(this.currentTool)?.setActive(false);
    }

    this.currentTool = toolType;

    // Activate new tool
    if (toolType !== 'none') {
      this.tools.get(toolType)?.setActive(true);
    }
  }

  getCurrentTool(): AnnotationToolType {
    return this.currentTool;
  }

  setPage(page: number, pdfPage: PDFPageProxy | null): void {
    this.tools.forEach((tool) => tool.setPage(page, pdfPage));
  }

  setToolOptions(toolType: AnnotationToolType, options: Partial<ToolOptions>): void {
    this.tools.get(toolType)?.setOptions(options);
  }

  getHighlightTool(): HighlightTool {
    return this.tools.get('highlight') as HighlightTool;
  }

  getNoteTool(): NoteTool {
    return this.tools.get('note') as NoteTool;
  }

  getAreaTool(): AreaTool {
    return this.tools.get('area') as AreaTool;
  }

  private addEventListeners(element: HTMLElement): void {
    element.addEventListener('mousedown', this.handleMouseDown);
    element.addEventListener('mousemove', this.handleMouseMove);
    element.addEventListener('mouseup', this.handleMouseUp);
    element.addEventListener('click', this.handleClick);
  }

  private removeEventListeners(element: HTMLElement): void {
    element.removeEventListener('mousedown', this.handleMouseDown);
    element.removeEventListener('mousemove', this.handleMouseMove);
    element.removeEventListener('mouseup', this.handleMouseUp);
    element.removeEventListener('click', this.handleClick);
  }

  private handleMouseDown(event: MouseEvent): void {
    if (this.currentTool === 'none' || !this.containerElement) return;
    this.tools.get(this.currentTool)?.onMouseDown(event, this.containerElement);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.currentTool === 'none' || !this.containerElement) return;
    this.tools.get(this.currentTool)?.onMouseMove(event, this.containerElement);
  }

  private async handleMouseUp(event: MouseEvent): Promise<void> {
    if (this.currentTool === 'none' || !this.containerElement) return;
    await this.tools.get(this.currentTool)?.onMouseUp(event, this.containerElement);
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    if (this.currentTool === 'none' || !this.containerElement) return;
    await this.tools.get(this.currentTool)?.onClick(event, this.containerElement);
  }

  destroy(): void {
    if (this.containerElement) {
      this.removeEventListeners(this.containerElement);
    }
    this.containerElement = null;
    this.tools.clear();
  }
}
