/**
 * Tests for Annotation Layer
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AnnotationLayer } from '../AnnotationLayer';
import { Annotation } from '../../../../shared/types';

// Mock PDF page
const mockPage = {
  getViewport: jest.fn(() => ({
    width: 800,
    height: 1000,
  })),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('AnnotationLayer', () => {
  const mockAnnotations: Annotation[] = [
    {
      id: 'highlight-1',
      type: 'highlight',
      pageNumber: 1,
      bounds: { x: 10, y: 20, width: 50, height: 5 },
      color: '#FFEB3B',
      opacity: 0.4,
      text: 'Test highlight',
      createdAt: '2025-01-17T12:00:00.000Z',
      modifiedAt: '2025-01-17T12:00:00.000Z',
    },
    {
      id: 'note-1',
      type: 'note',
      pageNumber: 1,
      bounds: { x: 80, y: 30, width: 5, height: 5 },
      note: 'Test note',
      createdAt: '2025-01-17T12:00:00.000Z',
      modifiedAt: '2025-01-17T12:00:00.000Z',
    },
    {
      id: 'area-1',
      type: 'area',
      pageNumber: 1,
      bounds: { x: 40, y: 60, width: 30, height: 20 },
      color: '#90CAF9',
      opacity: 0.3,
      note: 'Test area',
      createdAt: '2025-01-17T12:00:00.000Z',
      modifiedAt: '2025-01-17T12:00:00.000Z',
    },
    {
      id: 'highlight-2',
      type: 'highlight',
      pageNumber: 2,
      bounds: { x: 10, y: 20, width: 50, height: 5 },
      color: '#FFEB3B',
      createdAt: '2025-01-17T12:00:00.000Z',
      modifiedAt: '2025-01-17T12:00:00.000Z',
    },
  ];

  it('should render SVG layer with correct dimensions', () => {
    const { container } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={[]}
        currentPage={1}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '800');
    expect(svg).toHaveAttribute('height', '1000');
  });

  it('should only render annotations for current page', () => {
    const { container } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={mockAnnotations}
        currentPage={1}
      />
    );

    // Should render 3 annotations for page 1
    const highlightElements = container.querySelectorAll('[data-annotation-type="highlight"]');
    const noteElements = container.querySelectorAll('[data-annotation-type="note"]');
    const areaElements = container.querySelectorAll('[data-annotation-type="area"]');

    expect(highlightElements).toHaveLength(1);
    expect(noteElements).toHaveLength(1);
    expect(areaElements).toHaveLength(1);

    // Should not render annotation from page 2
    expect(container.querySelector('[data-annotation-id="highlight-2"]')).not.toBeInTheDocument();
  });

  it('should render highlight annotation correctly', () => {
    const { container } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={mockAnnotations}
        currentPage={1}
      />
    );

    const highlight = container.querySelector('[data-annotation-id="highlight-1"]');
    expect(highlight).toBeInTheDocument();
    expect(highlight?.tagName).toBe('rect');
    expect(highlight).toHaveAttribute('fill', '#FFEB3B');
    expect(highlight).toHaveAttribute('opacity', '0.4');

    // Check position (10% of 800 = 80px)
    expect(highlight).toHaveAttribute('x', '80');
    // Check y (20% of 1000 = 200px)
    expect(highlight).toHaveAttribute('y', '200');
    // Check width (50% of 800 = 400px)
    expect(highlight).toHaveAttribute('width', '400');
    // Check height (5% of 1000 = 50px)
    expect(highlight).toHaveAttribute('height', '50');
  });

  it('should render note annotation correctly', () => {
    const { container } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={mockAnnotations}
        currentPage={1}
      />
    );

    const note = container.querySelector('[data-annotation-id="note-1"]');
    expect(note).toBeInTheDocument();
    expect(note?.tagName).toBe('g');

    // Should contain a circle and text element
    const circle = note?.querySelector('circle');
    const text = note?.querySelector('text');
    expect(circle).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  it('should render area annotation correctly', () => {
    const { container } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={mockAnnotations}
        currentPage={1}
      />
    );

    const area = container.querySelector('[data-annotation-id="area-1"]');
    expect(area).toBeInTheDocument();
    expect(area?.tagName).toBe('g');

    // Should contain filled rect and border rect
    const rects = area?.querySelectorAll('rect');
    expect(rects).toHaveLength(2);
  });

  it('should call onAnnotationClick when annotation is clicked', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={mockAnnotations}
        currentPage={1}
        onAnnotationClick={handleClick}
      />
    );

    const highlight = container.querySelector('[data-annotation-id="highlight-1"]') as Element;
    fireEvent.click(highlight);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'highlight-1',
        type: 'highlight',
      })
    );
  });

  it('should call onAnnotationRightClick on context menu', () => {
    const handleRightClick = jest.fn();
    const { container } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={mockAnnotations}
        currentPage={1}
        onAnnotationRightClick={handleRightClick}
      />
    );

    const highlight = container.querySelector('[data-annotation-id="highlight-1"]') as Element;
    fireEvent.contextMenu(highlight);

    expect(handleRightClick).toHaveBeenCalledTimes(1);
    expect(handleRightClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'highlight-1',
        type: 'highlight',
      }),
      expect.anything()
    );
  });

  it('should scale annotations when scale changes', () => {
    const { container, rerender } = render(
      <AnnotationLayer
        page={mockPage}
        scale={1.0}
        annotations={mockAnnotations}
        currentPage={1}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '800');
    expect(svg).toHaveAttribute('height', '1000');

    // Update scale
    mockPage.getViewport = jest.fn(() => ({
      width: 1600,
      height: 2000,
    }));

    rerender(
      <AnnotationLayer
        page={mockPage}
        scale={2.0}
        annotations={mockAnnotations}
        currentPage={1}
      />
    );

    expect(svg).toHaveAttribute('width', '1600');
    expect(svg).toHaveAttribute('height', '2000');
  });
});
