import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PDFCanvas } from './PDFCanvas';
import type { Annotation } from '../../../shared/types';

interface ContinuousScrollViewProps {
  pdf: PDFDocumentProxy;
  scale: number;
  annotations?: Annotation[];
  onAnnotationClick?: (annotation: Annotation) => void;
  onPageChange?: (pageNumber: number) => void;
}

export function ContinuousScrollView({
  pdf,
  scale,
  annotations = [],
  onAnnotationClick,
  onPageChange,
}: ContinuousScrollViewProps): JSX.Element {
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const previousScaleRef = useRef<number>(scale);

  // Load all page proxies
  useEffect(() => {
    const loadPages = async () => {
      const loadedPages: PDFPageProxy[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          loadedPages.push(page);
        } catch (err) {
          console.error(`Error loading page ${i}:`, err);
        }
      }
      setPages(loadedPages);
    };

    loadPages();
  }, [pdf]);

  // Set up Intersection Observer for lazy rendering
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates: Array<{ pageNum: number; isVisible: boolean }> = [];

        entries.forEach((entry) => {
          const pageNum = parseInt(
            entry.target.getAttribute('data-page-number') || '0'
          );
          updates.push({ pageNum, isVisible: entry.isIntersecting });
        });

        setVisiblePages((prev) => {
          const next = new Set(prev);
          updates.forEach(({ pageNum, isVisible }) => {
            if (isVisible) {
              next.add(pageNum);
            } else {
              next.delete(pageNum);
            }
          });
          return next;
        });

        // Notify parent of the topmost visible page
        if (onPageChange) {
          const visiblePageNumbers = updates
            .filter((u) => u.isVisible)
            .map((u) => u.pageNum)
            .sort((a, b) => a - b);
          if (visiblePageNumbers.length > 0) {
            onPageChange(visiblePageNumbers[0]);
          }
        }
      },
      {
        root: containerRef.current,
        rootMargin: '500px 0px', // Render pages 500px before they come into view
        threshold: 0.1,
      }
    );

    // Observe all page containers
    pageRefs.current.forEach((ref) => {
      if (observerRef.current) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [pages, onPageChange]);

  // Handle zoom changes - maintain scroll position proportionally
  useEffect(() => {
    const container = containerRef.current;
    if (!container || previousScaleRef.current === scale) return;

    const oldScale = previousScaleRef.current;
    const newScale = scale;
    const scaleFactor = newScale / oldScale;

    // Get current scroll position
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    // Calculate center of viewport
    const centerY = scrollTop + container.clientHeight / 2;
    const centerX = scrollLeft + container.clientWidth / 2;

    // After re-render with new scale, adjust scroll to keep center in view
    requestAnimationFrame(() => {
      container.scrollTop = centerY * scaleFactor - container.clientHeight / 2;
      container.scrollLeft = centerX * scaleFactor - container.clientWidth / 2;
    });

    previousScaleRef.current = scale;
  }, [scale]);

  // Update observer when page refs change
  const setPageRef = useCallback((pageNum: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(pageNum, el);
      if (observerRef.current) {
        observerRef.current.observe(el);
      }
    } else {
      const existingRef = pageRefs.current.get(pageNum);
      if (existingRef && observerRef.current) {
        observerRef.current.unobserve(existingRef);
      }
      pageRefs.current.delete(pageNum);
    }
  }, []);

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading pages...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="pdf-continuous-scroll overflow-auto flex-1 bg-[#1e1e1e]"
    >
      <div className="pdf-pages-container py-8 flex flex-col items-center gap-6">
        {pages.map((page, index) => {
          const pageNumber = index + 1;
          const isVisible = visiblePages.has(pageNumber);
          const viewport = page.getViewport({ scale });
          const pageAnnotations = annotations.filter(
            (a) => a.pageNumber === pageNumber
          );

          return (
            <div
              key={pageNumber}
              ref={(el) => setPageRef(pageNumber, el)}
              data-page-number={pageNumber}
              className="pdf-page-wrapper bg-white shadow-2xl transition-shadow hover:shadow-3xl"
              style={{
                width: viewport.width,
                minHeight: viewport.height,
              }}
            >
              {isVisible ? (
                <PDFCanvas
                  page={page}
                  scale={scale}
                  annotations={pageAnnotations}
                  currentPage={pageNumber}
                  onAnnotationClick={onAnnotationClick}
                />
              ) : (
                // Placeholder to maintain scroll position
                <div
                  style={{
                    width: viewport.width,
                    height: viewport.height,
                    backgroundColor: '#f5f5f5',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
