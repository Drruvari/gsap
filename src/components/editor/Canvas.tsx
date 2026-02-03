import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareIcon, CircleIcon, TextIcon } from '@hugeicons/core-free-icons';

export function Canvas() {
  const {
    elements,
    updateElementLayout,
    updateElementsLayout,
    updateElementSize,
    selectElement,
    clearSelection,
    addElement,
    setSelection,
    isPlaying,
    selectedIds,
    snapEnabled,
    gridSize,
    undo,
    redo,
    deleteElement,
    selectAll,
    duplicateSelected,
    toggleSnap,
    resetElements,
  } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Record<string, { x: number; y: number }>>({});
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [dragLabel, setDragLabel] = useState<{ id: string; x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);
  const resizeRef = useRef<{
    id: string;
    dir: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const dragRefMap = useMemo(() => {
    return new Map(elements.map((el) => [el.id, createRef<HTMLDivElement>()]));
  }, [elements]);

  const elementMap = useMemo(() => {
    return new Map(elements.map((el) => [el.id, el]));
  }, [elements]);

  const getSize = (el: { type?: string; size?: { w: number; h: number } }) => {
    if (el.size) return el.size;
    if (el.type === 'text') return { w: 220, h: 64 };
    return { w: 120, h: 120 };
  };

  const applySnap = useCallback(
    (value: number, enabled = snapEnabled) => {
      if (!enabled) return value;
      const snapped = Math.round(value / gridSize) * gridSize;
      return snapped;
    },
    [gridSize, snapEnabled],
  );

  const scheduleUpdate = useCallback((fn: () => void) => {
    pendingRef.current = fn;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const run = pendingRef.current;
      pendingRef.current = null;
      run?.();
    });
  }, []);

  const getSmartSnap = (
    x: number,
    y: number,
    w: number,
    h: number,
    ignoreId: string,
    tolerance = 6,
  ) => {
    let bestDx = tolerance + 1;
    let bestDy = tolerance + 1;
    let snappedX = x;
    let snappedY = y;
    const guideX: number[] = [];
    const guideY: number[] = [];

    const target = {
      left: x,
      right: x + w,
      center: x + w / 2,
      top: y,
      bottom: y + h,
      middle: y + h / 2,
    };

    elements.forEach((el) => {
      if (el.id === ignoreId) return;
      const size = getSize(el);
      const other = {
        left: el.layout.x,
        right: el.layout.x + size.w,
        center: el.layout.x + size.w / 2,
        top: el.layout.y,
        bottom: el.layout.y + size.h,
        middle: el.layout.y + size.h / 2,
      };

      const xCandidates: Array<{ delta: number; value: number; guide: number }> = [
        { delta: other.left - target.left, value: other.left, guide: other.left },
        { delta: other.right - target.right, value: other.right - w, guide: other.right },
        { delta: other.center - target.center, value: other.center - w / 2, guide: other.center },
        { delta: other.left - target.right, value: other.left - w, guide: other.left },
        { delta: other.right - target.left, value: other.right, guide: other.right },
      ];

      xCandidates.forEach((candidate) => {
        const delta = Math.abs(candidate.delta);
        if (delta <= tolerance && delta < bestDx) {
          bestDx = delta;
          snappedX = candidate.value;
          guideX[0] = candidate.guide;
        }
      });

      const yCandidates: Array<{ delta: number; value: number; guide: number }> = [
        { delta: other.top - target.top, value: other.top, guide: other.top },
        { delta: other.bottom - target.bottom, value: other.bottom - h, guide: other.bottom },
        { delta: other.middle - target.middle, value: other.middle - h / 2, guide: other.middle },
        { delta: other.top - target.bottom, value: other.top - h, guide: other.top },
        { delta: other.bottom - target.top, value: other.bottom, guide: other.bottom },
      ];

      yCandidates.forEach((candidate) => {
        const delta = Math.abs(candidate.delta);
        if (delta <= tolerance && delta < bestDy) {
          bestDy = delta;
          snappedY = candidate.value;
          guideY[0] = candidate.guide;
        }
      });
    });

    return { x: snappedX, y: snappedY, guidesX: guideX, guidesY: guideY };
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z';
      const isRedo =
        (event.metaKey || event.ctrlKey) &&
        (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'));

      if (isUndo) {
        event.preventDefault();
        undo();
        return;
      }

      if (isRedo) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        clearSelection();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        selectAll();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelected();
        return;
      }

      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        toggleSnap();
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetElements();
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (selectedIds.length === 0) return;
        event.preventDefault();
        selectedIds.forEach((id) => deleteElement(id));
        return;
      }

      if (isPlaying || selectedIds.length === 0) return;

      const target = event.target as HTMLElement | null;
      const isFormField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      if (isFormField) return;

      const step = event.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      switch (event.key) {
        case 'ArrowLeft':
          dx = -step;
          break;
        case 'ArrowRight':
          dx = step;
          break;
        case 'ArrowUp':
          dy = -step;
          break;
        case 'ArrowDown':
          dy = step;
          break;
        default:
          return;
      }

      event.preventDefault();

      selectedIds.forEach((id) => {
        const el = elementMap.get(id);
        if (!el) return;
        const nextX = applySnap(el.layout.x + dx, false);
        const nextY = applySnap(el.layout.y + dy, false);
        updateElementLayout(id, { x: nextX, y: nextY });
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    applySnap,
    clearSelection,
    deleteElement,
    duplicateSelected,
    elementMap,
    isPlaying,
    scheduleUpdate,
    redo,
    resetElements,
    selectAll,
    selectedIds,
    toggleSnap,
    undo,
    updateElementLayout,
  ]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const { id, dir, startX, startY, startW, startH, startLeft, startTop } = resizeRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const minSize = 16;

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
  }, [applySnap, snapEnabled, updateElementLayout, updateElementSize]);

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
  }, [elements, selectionBox, setSelection]);

  return (
    <div
      className={cn(
        'relative h-full w-full min-h-[360px] overflow-hidden corner-squircle border border-dashed border-border/70',
        snapEnabled ? 'ring-1 ring-primary/20' : 'bg-muted/30',
      )}
      style={
        snapEnabled
          ? {
              backgroundColor: 'var(--background)',
              backgroundImage:
                'repeating-linear-gradient(to right, rgba(148,163,184,0.18) 0 1px, transparent 1px 8px), ' +
                'repeating-linear-gradient(to bottom, rgba(148,163,184,0.18) 0 1px, transparent 1px 8px), ' +
                'repeating-linear-gradient(to right, rgba(148,163,184,0.35) 0 1px, transparent 1px 40px), ' +
                'repeating-linear-gradient(to bottom, rgba(148,163,184,0.35) 0 1px, transparent 1px 40px)',
            }
          : undefined
      }
    >
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onMouseDown={(event) => {
          if (!containerRef.current) return;
          if (event.target !== containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          selectionStartRef.current = { x, y };
          setSelectionBox({ x, y, w: 0, h: 0 });
          clearSelection();
        }}
        onClick={() => {
          if (suppressClickRef.current) return;
          clearSelection();
        }}
      >
        {selectionBox && (
          <div
            className="absolute border border-primary/70 bg-primary/10 pointer-events-none"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.w,
              height: selectionBox.h,
            }}
          />
        )}
        {selectedIds.length > 1 &&
          (() => {
            const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
            if (selectedElements.length === 0) return null;
            const minX = Math.min(...selectedElements.map((el) => el.layout.x));
            const minY = Math.min(...selectedElements.map((el) => el.layout.y));
            const maxX = Math.max(...selectedElements.map((el) => el.layout.x + getSize(el).w));
            const maxY = Math.max(...selectedElements.map((el) => el.layout.y + getSize(el).h));
            return (
              <div
                className="absolute border border-primary/70 pointer-events-none"
                style={{ left: minX, top: minY, width: maxX - minX, height: maxY - minY }}
              />
            );
          })()}

        {guides.x.map((x) => (
          <div
            key={`guide-x-${x}`}
            className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none"
            style={{ left: x }}
          />
        ))}
        {guides.y.map((y) => (
          <div
            key={`guide-y-${y}`}
            className="absolute left-0 right-0 h-px bg-primary/40 pointer-events-none"
            style={{ top: y }}
          />
        ))}

        {dragLabel && (
          <div
            className="absolute text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground pointer-events-none shadow-sm"
            style={{ left: dragLabel.x + 8, top: dragLabel.y - 24 }}
          >
            {Math.round(dragLabel.x)}, {Math.round(dragLabel.y)}
          </div>
        )}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground select-none">
            <div className="text-center space-y-3">
              <div className="text-sm font-medium text-foreground/80">Canvas Empty</div>
              <div className="text-xs text-muted-foreground">Add elements to start your scene</div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => addElement('box')}
                >
                  <HugeiconsIcon icon={SquareIcon} size={14} />
                  Box
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => addElement('circle')}
                >
                  <HugeiconsIcon icon={CircleIcon} size={14} />
                  Circle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => addElement('text')}
                >
                  <HugeiconsIcon icon={TextIcon} size={14} />
                  Text
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Tip: Hold <span className="font-semibold">Alt</span> to disable snap,{' '}
                <span className="font-semibold">Shift</span> to multi-select
              </div>
            </div>
          </div>
        )}

        {elements.map((el) => {
          const nodeRef = dragRefMap.get(el.id) ?? createRef<HTMLDivElement>();
          const isSelected = selectedIds.includes(el.id);
          const size = getSize(el);
          return (
            <Draggable
              key={el.id}
              nodeRef={nodeRef}
              cancel="[data-resize-handle]"
              // Controlled position: links Drag state to Store state
              position={{ x: el.layout.x, y: el.layout.y }}
              onStart={(event, data) => {
                if (!selectedIds.includes(el.id)) return;
                const start = new Map<string, { x: number; y: number }>();
                selectedIds.forEach((id) => {
                  const item = elementMap.get(id);
                  if (item) {
                    start.set(id, { x: item.layout.x, y: item.layout.y });
                  }
                });
                dragStartRef.current = Object.fromEntries(start);

                // Ensure the active element aligns with the snapped position immediately
                const snapping = snapEnabled && !event.altKey;
                updateElementLayout(
                  el.id,
                  { x: applySnap(data.x, snapping), y: applySnap(data.y, snapping) },
                  false,
                );
              }}
              // Keep store in sync during drag to avoid cursor/element offset
              onDrag={(event, data) => {
                const snapping = snapEnabled && !event.altKey;
                if (selectedIds.length > 1 && selectedIds.includes(el.id)) {
                  setGuides({ x: [], y: [] });
                  setDragLabel(null);
                  const start = dragStartRef.current;
                  const activeStart = start[el.id];
                  if (!activeStart) return;
                  const nextActiveX = applySnap(data.x, snapping);
                  const nextActiveY = applySnap(data.y, snapping);
                  const dx = nextActiveX - activeStart.x;
                  const dy = nextActiveY - activeStart.y;
                  const updates = selectedIds
                    .map((id) => {
                      const item = start[id];
                      if (!item) return null;
                      return {
                        id,
                        x: applySnap(item.x + dx, snapping),
                        y: applySnap(item.y + dy, snapping),
                      };
                    })
                    .filter(Boolean) as Array<{ id: string; x: number; y: number }>;
                  scheduleUpdate(() => updateElementsLayout(updates, false));
                  return;
                }

                if (snapping) {
                  const smart = getSmartSnap(data.x, data.y, size.w, size.h, el.id);
                  const snappedX = smart.guidesX.length ? smart.x : applySnap(data.x, true);
                  const snappedY = smart.guidesY.length ? smart.y : applySnap(data.y, true);
                  setGuides({ x: smart.guidesX, y: smart.guidesY });
                  setDragLabel({ id: el.id, x: snappedX, y: snappedY });
                  scheduleUpdate(() =>
                    updateElementLayout(el.id, { x: snappedX, y: snappedY }, false),
                  );
                  return;
                }

                setGuides({ x: [], y: [] });
                setDragLabel({ id: el.id, x: data.x, y: data.y });
                scheduleUpdate(() =>
                  updateElementLayout(
                    el.id,
                    { x: applySnap(data.x, false), y: applySnap(data.y, false) },
                    false,
                  ),
                );
              }}
              onStop={(event, data) => {
                if (rafRef.current !== null) {
                  cancelAnimationFrame(rafRef.current);
                  rafRef.current = null;
                  pendingRef.current = null;
                }
                const snapping = snapEnabled && !event.altKey;
                if (selectedIds.length > 1 && selectedIds.includes(el.id)) {
                  const start = dragStartRef.current;
                  const activeStart = start[el.id];
                  if (!activeStart) return;
                  const nextActiveX = applySnap(data.x, snapping);
                  const nextActiveY = applySnap(data.y, snapping);
                  const dx = nextActiveX - activeStart.x;
                  const dy = nextActiveY - activeStart.y;
                  const updates = selectedIds
                    .map((id) => {
                      const item = start[id];
                      if (!item) return null;
                      return {
                        id,
                        x: applySnap(item.x + dx, snapping),
                        y: applySnap(item.y + dy, snapping),
                      };
                    })
                    .filter(Boolean) as Array<{ id: string; x: number; y: number }>;
                  updateElementsLayout(updates, true);
                  dragStartRef.current = {};
                  setGuides({ x: [], y: [] });
                  setDragLabel(null);
                  return;
                }

                if (snapping) {
                  const smart = getSmartSnap(data.x, data.y, size.w, size.h, el.id);
                  const snappedX = smart.guidesX.length ? smart.x : applySnap(data.x, true);
                  const snappedY = smart.guidesY.length ? smart.y : applySnap(data.y, true);
                  updateElementLayout(el.id, { x: snappedX, y: snappedY }, true);
                } else {
                  updateElementLayout(
                    el.id,
                    { x: applySnap(data.x, false), y: applySnap(data.y, false) },
                    true,
                  );
                }
                dragStartRef.current = {};
                setGuides({ x: [], y: [] });
                setDragLabel(null);
              }}
              disabled={isPlaying} // Lock layout during animation
              bounds="parent"
            >
              <div
                ref={nodeRef}
                data-gsap-id={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  selectElement(el.id, e.shiftKey);
                }}
                className={cn(
                  'absolute cursor-grab active:cursor-grabbing transition-shadow duration-150',
                  'hover:shadow-md hover:outline-1 hover:outline-primary/60',
                  isSelected ? 'outline-1 outline-primary/80 z-10' : 'z-0',
                  isPlaying && 'cursor-default',
                )}
                style={{ width: size.w, height: size.h }}
              >
                {/* Element Visual Representation */}
                {el.type === 'box' && (
                  <div className="w-full h-full bg-blue-500 corner-squircle shadow-sm flex items-center justify-center text-white/80 text-sm font-medium">
                    Box
                  </div>
                )}

                {el.type === 'circle' && (
                  <div className="w-full h-full bg-rose-500 rounded-full shadow-sm flex items-center justify-center text-white/80 text-sm font-medium">
                    Circle
                  </div>
                )}

                {el.type === 'text' && (
                  <div className="w-full h-full whitespace-nowrap px-3 py-2 border border-transparent hover:border-zinc-200 corner-squircle flex items-center">
                    <span className="text-lg font-semibold text-foreground leading-none">
                      Animate Me
                    </span>
                  </div>
                )}

                {/* Selection Label (only when selected and not playing) */}
                {isSelected && !isPlaying && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-8 left-0 pointer-events-none opacity-80"
                  >
                    {el.label}
                  </Badge>
                )}

                {isSelected && selectedIds.length === 1 && !isPlaying && (
                  <>
                    {[
                      { dir: 'nw', className: '-left-1 -top-1 cursor-nwse-resize' },
                      { dir: 'ne', className: '-right-1 -top-1 cursor-nesw-resize' },
                      { dir: 'sw', className: '-left-1 -bottom-1 cursor-nesw-resize' },
                      { dir: 'se', className: '-right-1 -bottom-1 cursor-nwse-resize' },
                    ].map((handle) => (
                      <div
                        key={handle.dir}
                        className={cn(
                          'absolute size-2 corner-squircle bg-white border border-blue-500 shadow-sm',
                          handle.className,
                        )}
                        data-resize-handle
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          resizeRef.current = {
                            id: el.id,
                            dir: handle.dir as 'nw' | 'ne' | 'sw' | 'se',
                            startX: event.clientX,
                            startY: event.clientY,
                            startW: size.w,
                            startH: size.h,
                            startLeft: el.layout.x,
                            startTop: el.layout.y,
                          };
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            </Draggable>
          );
        })}
      </div>
    </div>
  );
}
