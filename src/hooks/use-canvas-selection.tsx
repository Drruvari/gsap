import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

type SelectionBox = { x: number; y: number; w: number; h: number };

type UseCanvasSelectionProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  selectionStartRef: MutableRefObject<{ x: number; y: number } | null>;
  suppressClickRef: MutableRefObject<boolean>;
  selectionBox: SelectionBox | null;
  setSelectionBox: (box: SelectionBox | null) => void;
  elements: Array<{
    id: string;
    layout: { x: number; y: number };
    size?: { w: number; h: number };
    type?: string;
  }>;
  getSize: (el: { type?: string; size?: { w: number; h: number } }) => { w: number; h: number };
  setSelection: (ids: string[]) => void;
};

export function useCanvasSelection({
  containerRef,
  selectionStartRef,
  suppressClickRef,
  selectionBox,
  setSelectionBox,
  elements,
  getSize,
  setSelection,
}: UseCanvasSelectionProps) {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!selectionStartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const start = selectionStartRef.current;
      const left = Math.min(start.x, x);
      const top = Math.min(start.y, y);
      const width = Math.abs(x - start.x);
      const height = Math.abs(y - start.y);
      setSelectionBox({ x: left, y: top, w: width, h: height });
    };

    const handleMouseUp = () => {
      if (!selectionStartRef.current) return;
      const box = selectionBox;
      selectionStartRef.current = null;

      if (!box || box.w < 2 || box.h < 2) {
        setSelectionBox(null);
        return;
      }

      const hits = elements.filter((el) => {
        const size = getSize(el);
        const left = el.layout.x;
        const right = el.layout.x + size.w;
        const top = el.layout.y;
        const bottom = el.layout.y + size.h;
        return right >= box.x && left <= box.x + box.w && bottom >= box.y && top <= box.y + box.h;
      });

      setSelection(hits.map((el) => el.id));
      setSelectionBox(null);
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    containerRef,
    elements,
    getSize,
    selectionBox,
    selectionStartRef,
    setSelection,
    setSelectionBox,
    suppressClickRef,
  ]);
}
