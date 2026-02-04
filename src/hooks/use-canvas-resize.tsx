import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

type ResizeRef = MutableRefObject<{
  id: string;
  dir: 'nw' | 'ne' | 'sw' | 'se';
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  startLeft: number;
  startTop: number;
} | null>;

type UseCanvasResizeProps = {
  resizeRef: ResizeRef;
  applySnap: (value: number, enabled?: boolean) => number;
  snapEnabled: boolean;
  updateElementLayout: (id: string, layout: { x: number; y: number }, commit?: boolean) => void;
  updateElementSize: (id: string, size: { w: number; h: number }, commit?: boolean) => void;
};

export function useCanvasResize({
  resizeRef,
  applySnap,
  snapEnabled,
  updateElementLayout,
  updateElementSize,
}: UseCanvasResizeProps) {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const { id, dir, startX, startY, startW, startH, startLeft, startTop } = resizeRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const minSize = 16;
      const lockAspect = event.shiftKey;
      const aspect = startW / startH || 1;

      let nextW = startW;
      let nextH = startH;
      let nextX = startLeft;
      let nextY = startTop;

      if (dir.includes('e')) {
        nextW = Math.max(minSize, startW + dx);
      }
      if (dir.includes('s')) {
        nextH = Math.max(minSize, startH + dy);
      }
      if (dir.includes('w')) {
        nextW = Math.max(minSize, startW - dx);
        nextX = startLeft + dx;
      }
      if (dir.includes('n')) {
        nextH = Math.max(minSize, startH - dy);
        nextY = startTop + dy;
      }

      if (lockAspect) {
        const widthFromHeight = nextH * aspect;
        const heightFromWidth = nextW / aspect;
        if (Math.abs(nextW - startW) >= Math.abs(nextH - startH)) {
          nextH = Math.max(minSize, heightFromWidth);
        } else {
          nextW = Math.max(minSize, widthFromHeight);
        }

        if (dir.includes('w')) {
          nextX = startLeft + (startW - nextW);
        }
        if (dir.includes('n')) {
          nextY = startTop + (startH - nextH);
        }
      }

      const snapping = snapEnabled && !event.altKey;
      updateElementLayout(
        id,
        { x: applySnap(nextX, snapping), y: applySnap(nextY, snapping) },
        false,
      );
      updateElementSize(
        id,
        { w: applySnap(nextW, snapping), h: applySnap(nextH, snapping) },
        false,
      );
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const { id, dir, startX, startY, startW, startH, startLeft, startTop } = resizeRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const minSize = 16;
      const lockAspect = event.shiftKey;
      const aspect = startW / startH || 1;

      let nextW = startW;
      let nextH = startH;
      let nextX = startLeft;
      let nextY = startTop;

      if (dir.includes('e')) {
        nextW = Math.max(minSize, startW + dx);
      }
      if (dir.includes('s')) {
        nextH = Math.max(minSize, startH + dy);
      }
      if (dir.includes('w')) {
        nextW = Math.max(minSize, startW - dx);
        nextX = startLeft + dx;
      }
      if (dir.includes('n')) {
        nextH = Math.max(minSize, startH - dy);
        nextY = startTop + dy;
      }

      if (lockAspect) {
        const widthFromHeight = nextH * aspect;
        const heightFromWidth = nextW / aspect;
        if (Math.abs(nextW - startW) >= Math.abs(nextH - startH)) {
          nextH = Math.max(minSize, heightFromWidth);
        } else {
          nextW = Math.max(minSize, widthFromHeight);
        }

        if (dir.includes('w')) {
          nextX = startLeft + (startW - nextW);
        }
        if (dir.includes('n')) {
          nextY = startTop + (startH - nextH);
        }
      }

      const snapping = snapEnabled && !event.altKey;
      updateElementLayout(
        id,
        { x: applySnap(nextX, snapping), y: applySnap(nextY, snapping) },
        true,
      );
      updateElementSize(id, { w: applySnap(nextW, snapping), h: applySnap(nextH, snapping) }, true);
      resizeRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [applySnap, resizeRef, snapEnabled, updateElementLayout, updateElementSize]);
}
