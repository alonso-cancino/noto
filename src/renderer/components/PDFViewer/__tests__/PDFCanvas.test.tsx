import React from 'react';
import { render } from '@testing-library/react';
import { PDFCanvas } from '../PDFCanvas';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

// Mock PDF.js page
const createMockPage = (): Partial<PDFPageProxy> => ({
  getViewport: jest.fn((params: { scale: number }) => ({
    width: 600 * params.scale,
    height: 800 * params.scale,
    scale: params.scale,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    transform: [1, 0, 0, 1, 0, 0],
    viewBox: [0, 0, 600, 800],
    clone: jest.fn(),
    convertToViewportPoint: jest.fn(),
    convertToViewportRectangle: jest.fn(),
    convertToPdfPoint: jest.fn(),
  })),
  render: jest.fn(() => ({
    promise: Promise.resolve(),
    cancel: jest.fn(),
  })),
});

describe('PDFCanvas', () => {
  beforeEach(() => {
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('should render canvas element', () => {
    const mockPage = createMockPage() as PDFPageProxy;
    const { container } = render(<PDFCanvas page={mockPage} scale={1.0} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('pdf-canvas');
  });

  it('should call getViewport with correct scale', () => {
    const mockPage = createMockPage() as PDFPageProxy;
    const scale = 1.5;

    render(<PDFCanvas page={mockPage} scale={scale} />);

    expect(mockPage.getViewport).toHaveBeenCalledWith({ scale });
  });

  it('should set canvas dimensions based on viewport', async () => {
    const mockPage = createMockPage() as PDFPageProxy;
    const scale = 2.0;

    const { container } = render(<PDFCanvas page={mockPage} scale={scale} />);

    // Wait for render to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(600 * scale);
    expect(canvas.height).toBe(800 * scale);
  });

  it('should call onRenderComplete when rendering finishes', async () => {
    const mockPage = createMockPage() as PDFPageProxy;
    const onRenderComplete = jest.fn();

    render(
      <PDFCanvas page={mockPage} scale={1.0} onRenderComplete={onRenderComplete} />
    );

    // Wait for render to complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onRenderComplete).toHaveBeenCalled();
  });

  it('should re-render when scale changes', () => {
    const mockPage = createMockPage() as PDFPageProxy;
    const { rerender } = render(<PDFCanvas page={mockPage} scale={1.0} />);

    expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.0 });

    rerender(<PDFCanvas page={mockPage} scale={2.0} />);

    expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 2.0 });
  });
});
