import { useEffect, useRef, RefObject } from 'react';

interface ZoomGesturesConfig {
  containerRef: RefObject<HTMLElement>;
  scale: number;
  onScaleChange: (newScale: number, origin?: { x: number; y: number }) => void;
  minScale?: number;
  maxScale?: number;
  zoomSpeed?: number;
}

export function useZoomGestures({
  containerRef,
  scale,
  onScaleChange,
  minScale = 0.5,
  maxScale = 3.0,
  zoomSpeed = 0.1,
}: ZoomGesturesConfig) {
  const lastTouchDistance = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. TRACKPAD PINCH & CTRL+WHEEL ZOOM
    const handleWheel = (event: WheelEvent) => {
      // Only handle Ctrl+wheel (includes trackpad pinch on Chrome/Electron/Firefox)
      if (!event.ctrlKey) return;

      event.preventDefault();
      event.stopPropagation();

      // Get cursor position relative to container
      const rect = container.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      // Calculate new scale
      // deltaY is negative when zooming in, positive when zooming out
      const delta = -event.deltaY * 0.01; // Adjust sensitivity
      let newScale = scale + delta;

      // Clamp to min/max
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Pass cursor position for zoom-to-cursor
      onScaleChange(newScale, { x: cursorX, y: cursorY });
    };

    // 2. KEYBOARD SHORTCUTS (Ctrl/Cmd + Plus/Minus/0)
    const handleKeyDown = (event: KeyboardEvent) => {
      const primaryKey = event.metaKey || event.ctrlKey;

      // Zoom in: Ctrl/Cmd + Plus or Ctrl/Cmd + =
      if (primaryKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        const newScale = Math.min(maxScale, scale + zoomSpeed);
        onScaleChange(newScale);
      }

      // Zoom out: Ctrl/Cmd + Minus
      if (primaryKey && event.key === '-') {
        event.preventDefault();
        const newScale = Math.max(minScale, scale - zoomSpeed);
        onScaleChange(newScale);
      }

      // Reset zoom: Ctrl/Cmd + 0
      if (primaryKey && event.key === '0') {
        event.preventDefault();
        onScaleChange(1.0);
      }
    };

    // 3. TOUCH PINCH (Mobile/Tablet support)
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastTouchDistance.current = distance;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && lastTouchDistance.current !== null) {
        event.preventDefault();

        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const delta = (distance - lastTouchDistance.current) * 0.01;
        let newScale = scale + delta;
        newScale = Math.max(minScale, Math.min(maxScale, newScale));

        onScaleChange(newScale);
        lastTouchDistance.current = distance;
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistance.current = null;
    };

    // Attach event listeners
    // IMPORTANT: { passive: false } to allow preventDefault() on wheel events
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, scale, onScaleChange, minScale, maxScale, zoomSpeed]);
}
