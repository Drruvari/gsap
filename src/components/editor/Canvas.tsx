import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  CanvasGuides,
  DragLabel,
  EmptyCanvasState,
  MultiSelectBox,
  SelectionBox,
} from '@/components/editor/canvas/CanvasOverlays';
import { useCanvasKeyboard } from '@/hooks/use-canvas-keyboard';
import { useCanvasResize } from '@/hooks/use-canvas-resize';
import { useCanvasSelection } from '@/hooks/use-canvas-selection';

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
    setCanvasSize,
    updateElementText,
    gridOpacity,
    gridMajorOpacity,
    showCenterCrosshair,
    canvasSize,
  } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<Record<string, { x: number; y: number }>>({});
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [dragLabel, setDragLabel] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    displayX: number;
    displayY: number;
  } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
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

  const elementIdsKey = elements.map((el) => el.id).join('|');
  const dragRefMap = useMemo(() => {
    return new Map(elements.map((el) => [el.id, createRef<HTMLDivElement>()]));
  }, [elementIdsKey]);

  const elementMap = useMemo(() => {
    return new Map(elements.map((el) => [el.id, el]));
  }, [elements]);

  const getSize = useCallback((el: { type?: string; size?: { w: number; h: number } }) => {
    if (el.size) return el.size;
    if (el.type === 'text') return { w: 220, h: 64 };
    return { w: 120, h: 120 };
  }, []);

  const minTextSize = { w: 120, h: 48 };

  const sizeMap = useMemo(() => {
    const map = new Map<string, { w: number; h: number }>();
    elements.forEach((el) => map.set(el.id, getSize(el)));
    return map;
  }, [elements, getSize]);

  const selectedElements = useMemo(
    () => elements.filter((el) => selectedIds.includes(el.id)),
    [elements, selectedIds],
  );

  const selectionBounds = useMemo(() => {
    if (selectedElements.length < 2) return null;
    const minX = Math.min(...selectedElements.map((el) => el.layout.x));
    const minY = Math.min(...selectedElements.map((el) => el.layout.y));
    const maxX = Math.max(
      ...selectedElements.map((el) => el.layout.x + (sizeMap.get(el.id)?.w ?? getSize(el).w)),
    );
    const maxY = Math.max(
      ...selectedElements.map((el) => el.layout.y + (sizeMap.get(el.id)?.h ?? getSize(el).h)),
    );
    return { minX, minY, maxX, maxY };
  }, [getSize, selectedElements, sizeMap]);

  const applySnap = useCallback(
    (value: number, enabled = snapEnabled, offset = 0) => {
      if (!enabled) return value;
      const snapped = Math.round((value - offset) / gridSize) * gridSize + offset;
      return snapped;
    },
    [gridSize, snapEnabled],
  );

  const gridOffset = useMemo(() => {
    if (canvasSize.w === 0 || canvasSize.h === 0) {
      return {
        minorX: 0,
        minorY: 0,
        majorX: 0,
        majorY: 0,
      };
    }
    const minor = gridSize;
    const major = gridSize * 5;
    return {
      minorX: (canvasSize.w / 2) % minor,
      minorY: (canvasSize.h / 2) % minor,
      majorX: (canvasSize.w / 2) % major,
      majorY: (canvasSize.h / 2) % major,
    };
  }, [canvasSize.h, canvasSize.w, gridSize]);

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

  const getCenterDisplay = useCallback((x: number, y: number, size: { w: number; h: number }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { displayX: x, displayY: y };
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    return {
      displayX: x + size.w / 2 - centerX,
      displayY: y + size.h / 2 - centerY,
    };
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

  const applyAxisLock = useCallback((dx: number, dy: number, event: { shiftKey?: boolean }) => {
    if (!event.shiftKey) return { dx, dy };
    if (Math.abs(dx) >= Math.abs(dy)) return { dx, dy: 0 };
    return { dx: 0, dy };
  }, []);

  useCanvasKeyboard({
    applySnap,
    gridOffset: { x: gridOffset.minorX, y: gridOffset.minorY },
    elementMap,
    selectedIds,
    snapEnabled,
    gridSize,
    isPlaying,
    clearSelection,
    selectAll,
    duplicateSelected,
    toggleSnap,
    resetElements,
    deleteElement,
    undo,
    redo,
    updateElementsLayout,
  });

  useCanvasResize({
    resizeRef,
    applySnap,
    snapEnabled,
    gridOffset: { x: gridOffset.minorX, y: gridOffset.minorY },
    updateElementLayout,
    updateElementSize,
  });

  useCanvasSelection({
    containerRef,
    selectionStartRef,
    suppressClickRef,
    selectionBox,
    setSelectionBox,
    elements,
    getSize,
    setSelection,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setCanvasSize({ w: rect.width, h: rect.height });
    };
    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [setCanvasSize]);

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
                `repeating-linear-gradient(to right, rgba(148,163,184,${gridOpacity}) 0 1px, transparent 1px ${gridSize}px), ` +
                `repeating-linear-gradient(to bottom, rgba(148,163,184,${gridOpacity}) 0 1px, transparent 1px ${gridSize}px), ` +
                `repeating-linear-gradient(to right, rgba(148,163,184,${gridMajorOpacity}) 0 1px, transparent 1px ${gridSize * 5}px), ` +
                `repeating-linear-gradient(to bottom, rgba(148,163,184,${gridMajorOpacity}) 0 1px, transparent 1px ${gridSize * 5}px)`,
              backgroundPosition:
                `${gridOffset.minorX}px ${gridOffset.minorY}px, ` +
                `${gridOffset.minorX}px ${gridOffset.minorY}px, ` +
                `${gridOffset.majorX}px ${gridOffset.majorY}px, ` +
                `${gridOffset.majorX}px ${gridOffset.majorY}px`,
            }
          : undefined
      }
    >
      {showCenterCrosshair && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20"
            style={{ transform: 'translateX(-0.5px)' }}
          />
          <div
            className="absolute top-1/2 left-0 right-0 h-px bg-primary/20"
            style={{ transform: 'translateY(-0.5px)' }}
          />
          <div
            className="absolute left-1/2 top-1/2 size-2 rounded-full border border-primary/40 bg-primary/10"
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        </div>
      )}
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
        <SelectionBox box={selectionBox} />
        <MultiSelectBox bounds={selectionBounds} />
        <CanvasGuides guides={guides} />
        <DragLabel label={dragLabel} />
        <EmptyCanvasState isEmpty={elements.length === 0} onAdd={addElement} />

        {elements.map((el) => {
          const nodeRef = dragRefMap.get(el.id);
          if (!nodeRef) return null;
          const isSelected = selectedIds.includes(el.id);
          const size = sizeMap.get(el.id) ?? getSize(el);
          return (
            <Draggable
              key={el.id}
              nodeRef={nodeRef}
              cancel="[data-resize-handle], [contenteditable='true']"
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
                  {
                    x: applySnap(data.x, snapping, gridOffset.minorX),
                    y: applySnap(data.y, snapping, gridOffset.minorY),
                  },
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
                  const nextActiveX = applySnap(data.x, snapping, gridOffset.minorX);
                  const nextActiveY = applySnap(data.y, snapping, gridOffset.minorY);
                  const rawDx = nextActiveX - activeStart.x;
                  const rawDy = nextActiveY - activeStart.y;
                  const { dx, dy } = applyAxisLock(rawDx, rawDy, event);
                  const updates = selectedIds
                    .map((id) => {
                      const item = start[id];
                      if (!item) return null;
                      return {
                        id,
                        x: applySnap(item.x + dx, snapping, gridOffset.minorX),
                        y: applySnap(item.y + dy, snapping, gridOffset.minorY),
                      };
                    })
                    .filter(Boolean) as Array<{ id: string; x: number; y: number }>;
                  scheduleUpdate(() => updateElementsLayout(updates, false));
                  return;
                }

                if (snapping) {
                  const smart = getSmartSnap(data.x, data.y, size.w, size.h, el.id);
                  let snappedX = smart.guidesX.length
                    ? smart.x
                    : applySnap(data.x, true, gridOffset.minorX);
                  let snappedY = smart.guidesY.length
                    ? smart.y
                    : applySnap(data.y, true, gridOffset.minorY);
                  const { dx, dy } = applyAxisLock(
                    snappedX - el.layout.x,
                    snappedY - el.layout.y,
                    event,
                  );
                  snappedX = el.layout.x + dx;
                  snappedY = el.layout.y + dy;
                  const display = getCenterDisplay(snappedX, snappedY, size);
                  setGuides({ x: smart.guidesX, y: smart.guidesY });
                  setDragLabel({
                    id: el.id,
                    x: snappedX,
                    y: snappedY,
                    w: size.w,
                    ...display,
                  });
                  scheduleUpdate(() =>
                    updateElementLayout(el.id, { x: snappedX, y: snappedY }, false),
                  );
                  return;
                }

                setGuides({ x: [], y: [] });
                const { dx, dy } = applyAxisLock(data.x - el.layout.x, data.y - el.layout.y, event);
                const nextX = el.layout.x + dx;
                const nextY = el.layout.y + dy;
                const display = getCenterDisplay(nextX, nextY, size);
                setDragLabel({
                  id: el.id,
                  x: nextX,
                  y: nextY,
                  w: size.w,
                  ...display,
                });
                scheduleUpdate(() =>
                  updateElementLayout(
                    el.id,
                    {
                      x: applySnap(nextX, false, gridOffset.minorX),
                      y: applySnap(nextY, false, gridOffset.minorY),
                    },
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
                  const nextActiveX = applySnap(data.x, snapping, gridOffset.minorX);
                  const nextActiveY = applySnap(data.y, snapping, gridOffset.minorY);
                  const rawDx = nextActiveX - activeStart.x;
                  const rawDy = nextActiveY - activeStart.y;
                  const { dx, dy } = applyAxisLock(rawDx, rawDy, event);
                  const updates = selectedIds
                    .map((id) => {
                      const item = start[id];
                      if (!item) return null;
                      return {
                        id,
                        x: applySnap(item.x + dx, snapping, gridOffset.minorX),
                        y: applySnap(item.y + dy, snapping, gridOffset.minorY),
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
                  let snappedX = smart.guidesX.length
                    ? smart.x
                    : applySnap(data.x, true, gridOffset.minorX);
                  let snappedY = smart.guidesY.length
                    ? smart.y
                    : applySnap(data.y, true, gridOffset.minorY);
                  const { dx, dy } = applyAxisLock(
                    snappedX - el.layout.x,
                    snappedY - el.layout.y,
                    event,
                  );
                  snappedX = el.layout.x + dx;
                  snappedY = el.layout.y + dy;
                  updateElementLayout(el.id, { x: snappedX, y: snappedY }, true);
                } else {
                  const { dx, dy } = applyAxisLock(
                    data.x - el.layout.x,
                    data.y - el.layout.y,
                    event,
                  );
                  const nextX = el.layout.x + dx;
                  const nextY = el.layout.y + dy;
                  updateElementLayout(
                    el.id,
                    {
                      x: applySnap(nextX, false, gridOffset.minorX),
                      y: applySnap(nextY, false, gridOffset.minorY),
                    },
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
                <div data-gsap-id={el.id} className="w-full h-full">
                  {/* Element Visual Representation */}
                  {el.type === 'box' && (
                    <div className="w-full h-full bg-blue-500 corner-squircle shadow-sm" />
                  )}

                  {el.type === 'circle' && (
                    <div className="w-full h-full bg-rose-500 rounded-full shadow-sm" />
                  )}

                  {el.type === 'text' && (
                    <div className="w-full h-full px-3 py-2 border border-transparent hover:border-zinc-200 corner-squircle flex items-center">
                      <span
                        className="text-foreground leading-none whitespace-pre-wrap break-words w-full outline-none block"
                        contentEditable={editingTextId === el.id}
                        suppressContentEditableWarning
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          setEditingTextId(el.id);
                          window.setTimeout(() => {
                            event.currentTarget.focus();
                          }, 0);
                        }}
                        onMouseDown={(event) => {
                          if (editingTextId !== el.id) return;
                          event.stopPropagation();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            if (!event.shiftKey) {
                              event.preventDefault();
                              (event.currentTarget as HTMLSpanElement).blur();
                            }
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            (event.currentTarget as HTMLSpanElement).blur();
                          }
                        }}
                        onInput={(event) => {
                          const node = event.currentTarget;
                          const nextW = Math.max(minTextSize.w, Math.ceil(node.scrollWidth));
                          const nextH = Math.max(minTextSize.h, Math.ceil(node.scrollHeight));
                          updateElementSize(el.id, { w: nextW, h: nextH }, false);
                        }}
                        onBlur={(event) => {
                          const next = event.currentTarget.textContent || '';
                          const normalized = next.trim() ? next.replace(/\s+$/g, '') : 'Text';
                          updateElementText(el.id, normalized);
                          const node = event.currentTarget;
                          const nextW = Math.max(minTextSize.w, Math.ceil(node.scrollWidth));
                          const nextH = Math.max(minTextSize.h, Math.ceil(node.scrollHeight));
                          updateElementSize(el.id, { w: nextW, h: nextH }, true);
                          setEditingTextId((current) => (current === el.id ? null : current));
                        }}
                        style={{
                          fontSize: el.textStyle?.fontSize ?? 24,
                          fontWeight: el.textStyle?.fontWeight ?? 600,
                          lineHeight: el.textStyle?.lineHeight ?? 1.1,
                        }}
                      >
                        {el.text ?? 'Animate Me'}
                      </span>
                    </div>
                  )}
                </div>

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
