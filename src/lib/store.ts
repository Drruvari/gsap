import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ElementType = 'box' | 'circle' | 'text';

export interface AnimationProps {
  // Layout
  x: number;
  y: number;
  // Animation Target (relative to layout or absolute)
  rotation: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
  ease: string;
}

export interface SceneElement {
  id: string;
  type: ElementType;
  label: string;
  text?: string;
  textStyle?: {
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
  };
  presetKey?: string | null;
  // We separate layout state from animation target state for clarity
  layout: { x: number; y: number };
  initialLayout: { x: number; y: number };
  size: { w: number; h: number };
  initialSize: { w: number; h: number };
  animation: AnimationProps;
}

interface EditorState {
  elements: SceneElement[];
  selectedId: string | null;
  selectedIds: string[];
  isPlaying: boolean;
  loopEnabled: boolean;
  currentTime: number;
  duration: number;
  stagger: number;
  previewResetId: number;
  canvasSize: { w: number; h: number };
  historyPast: EditorSnapshot[];
  historyFuture: EditorSnapshot[];

  addElement: (type: ElementType) => void;
  updateElementLayout: (id: string, layout: { x: number; y: number }, commit?: boolean) => void;
  updateElementSize: (id: string, size: { w: number; h: number }, commit?: boolean) => void;
  updateElementsLayout: (
    updates: Array<{ id: string; x: number; y: number }>,
    commit?: boolean,
  ) => void;
  updateElementAnimation: (id: string, props: Partial<AnimationProps>) => void;
  updateElementPreset: (id: string, presetKey: string, preset: Partial<AnimationProps>) => void;
  setElementPresetKey: (id: string, presetKey: string | null) => void;
  updateElementText: (id: string, text: string) => void;
  updateElementTextStyle: (
    id: string,
    style: Partial<NonNullable<SceneElement['textStyle']>>,
  ) => void;
  selectElement: (id: string | null, additive?: boolean) => void;
  clearSelection: () => void;
  deleteElement: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setLoopEnabled: (enabled: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setStagger: (stagger: number) => void;
  resetPreview: () => void;
  setCanvasSize: (size: { w: number; h: number }) => void;
  resetElements: () => void;
  snapEnabled: boolean;
  gridSize: number;
  toggleSnap: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  duplicateSelected: () => void;
  setSelection: (ids: string[]) => void;
  alignSelected: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelected: (axis: 'x' | 'y') => void;
}

type EditorSnapshot = Pick<
  EditorState,
  'elements' | 'selectedId' | 'selectedIds' | 'stagger' | 'snapEnabled' | 'gridSize'
>;

const MAX_HISTORY = 50;

const createSnapshot = (state: EditorState): EditorSnapshot => ({
  elements: structuredClone(state.elements),
  selectedId: state.selectedId,
  selectedIds: [...state.selectedIds],
  stagger: state.stagger,
  snapEnabled: state.snapEnabled,
  gridSize: state.gridSize,
});

const defaultSizeFor = (type: ElementType) => {
  if (type === 'text') return { w: 220, h: 64 };
  return { w: 120, h: 120 };
};

const buildNextIndexMap = (elements: SceneElement[]) => {
  const next = new Map<ElementType, number>([
    ['box', 1],
    ['circle', 1],
    ['text', 1],
  ]);
  elements.forEach((el) => {
    const match = new RegExp(`^${el.type}\\s+(\\d+)$`, 'i').exec(el.label);
    const current = match ? Number(match[1]) : 0;
    const candidate = Math.max(current + 1, next.get(el.type) ?? 1);
    next.set(el.type, candidate);
  });
  return next;
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, _get) => ({
      elements: [],
      selectedId: null,
      selectedIds: [],
      isPlaying: false,
      loopEnabled: false,
      currentTime: 0,
      duration: 0,
      stagger: 0,
      previewResetId: 0,
      canvasSize: { w: 0, h: 0 },
      snapEnabled: false,
      gridSize: 8,
      historyPast: [],
      historyFuture: [],

      addElement: (type) =>
        set((state) => {
          const id = crypto.randomUUID();
          const size = defaultSizeFor(type);
          const nextIndex = buildNextIndexMap(state.elements).get(type) ?? 1;
          const hasCanvas = state.canvasSize.w > 0 && state.canvasSize.h > 0;
          const centeredX = Math.max(0, (state.canvasSize.w - size.w) / 2);
          const centeredY = Math.max(0, (state.canvasSize.h - size.h) / 2);
          const origin = hasCanvas ? { x: centeredX, y: centeredY } : { x: 50, y: 50 };
          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            elements: [
              ...state.elements,
              {
                id,
                type,
                label: `${type} ${nextIndex}`,
                text: type === 'text' ? 'Animate Me' : undefined,
                textStyle:
                  type === 'text'
                    ? {
                        fontSize: 24,
                        fontWeight: 600,
                        lineHeight: 1.1,
                      }
                    : undefined,
                layout: { ...origin },
                initialLayout: { ...origin },
                size,
                initialSize: size,
                animation: {
                  x: 0,
                  y: 0,
                  rotation: 0,
                  scale: 1,
                  opacity: 1,
                  duration: 1,
                  delay: 0,
                  ease: 'power2.out',
                },
                presetKey: null,
              },
            ],
            selectedId: id,
            selectedIds: [id],
          };
        }),

      updateElementLayout: (id, layout, commit = true) =>
        set((state) => ({
          ...(commit
            ? {
                historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
                historyFuture: [],
              }
            : {}),
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, layout: { ...el.layout, ...layout } } : el,
          ),
        })),

      updateElementSize: (id, size, commit = true) =>
        set((state) => ({
          ...(commit
            ? {
                historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
                historyFuture: [],
              }
            : {}),
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, size: { ...el.size, ...size } } : el,
          ),
        })),

      updateElementsLayout: (updates, commit = true) =>
        set((state) => {
          const updateMap = new Map(updates.map((item) => [item.id, item]));
          return {
            ...(commit
              ? {
                  historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
                  historyFuture: [],
                }
              : {}),
            elements: state.elements.map((el) => {
              const next = updateMap.get(el.id);
              if (!next) return el;
              return { ...el, layout: { ...el.layout, x: next.x, y: next.y } };
            }),
          };
        }),

      updateElementAnimation: (id, props) =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, animation: { ...el.animation, ...props } } : el,
          ),
        })),
      updateElementPreset: (id, presetKey, preset) =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, animation: { ...el.animation, ...preset }, presetKey } : el,
          ),
        })),
      setElementPresetKey: (id, presetKey) =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
          elements: state.elements.map((el) => (el.id === id ? { ...el, presetKey } : el)),
        })),
      updateElementText: (id, text) =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
          elements: state.elements.map((el) => (el.id === id ? { ...el, text } : el)),
        })),
      updateElementTextStyle: (id, style) =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
          elements: state.elements.map((el) =>
            el.id === id
              ? {
                  ...el,
                  textStyle: {
                    fontSize: 24,
                    fontWeight: 600,
                    lineHeight: 1.1,
                    ...el.textStyle,
                    ...style,
                  },
                }
              : el,
          ),
        })),

      selectElement: (id, additive = false) =>
        set((state) => {
          if (id === null) {
            return {
              selectedId: null,
              selectedIds: [],
            };
          }

          if (additive) {
            const exists = state.selectedIds.includes(id);
            const nextSelectedIds = exists
              ? state.selectedIds.filter((selected) => selected !== id)
              : [...state.selectedIds, id];

            return {
              selectedId: nextSelectedIds.length
                ? nextSelectedIds[nextSelectedIds.length - 1]
                : null,
              selectedIds: nextSelectedIds,
            };
          }

          return {
            selectedId: id,
            selectedIds: [id],
          };
        }),

      clearSelection: () =>
        set(() => ({
          selectedId: null,
          selectedIds: [],
        })),

      deleteElement: (id) =>
        set((state) => {
          const nextElements = state.elements.filter((el) => el.id !== id);
          const nextSelectedIds = state.selectedIds.filter((selected) => selected !== id);
          const nextSelectedId =
            state.selectedId === id
              ? (nextSelectedIds[nextSelectedIds.length - 1] ?? null)
              : state.selectedId;

          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            elements: nextElements,
            selectedIds: nextSelectedIds,
            selectedId: nextSelectedId,
          };
        }),

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setLoopEnabled: (enabled) => set({ loopEnabled: enabled }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setStagger: (stagger) => set({ stagger }),
      resetPreview: () =>
        set((state) => ({
          isPlaying: false,
          currentTime: 0,
          previewResetId: state.previewResetId + 1,
        })),
      setCanvasSize: (size) => set(() => ({ canvasSize: size })),
      toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),

      resetElements: () =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
          elements: state.elements.map((el) => ({
            ...el,
            layout: { ...el.initialLayout },
            size: { ...el.initialSize },
          })),
        })),
      selectAll: () =>
        set((state) => ({
          selectedIds: state.elements.map((el) => el.id),
          selectedId: state.elements.length ? state.elements[state.elements.length - 1].id : null,
        })),
      duplicateSelected: () =>
        set((state) => {
          if (state.selectedIds.length === 0) return state;
          const nextIndexMap = buildNextIndexMap(state.elements);
          const clones = state.selectedIds
            .map((id) => state.elements.find((el) => el.id === id))
            .filter(Boolean)
            .map((el) => {
              const type = el!.type;
              const nextIndex = nextIndexMap.get(type) ?? 1;
              nextIndexMap.set(type, nextIndex + 1);
              return {
                ...el!,
                id: crypto.randomUUID(),
                label: `${type} ${nextIndex}`,
                layout: { x: el!.layout.x + 16, y: el!.layout.y + 16 },
                initialLayout: { x: el!.initialLayout.x + 16, y: el!.initialLayout.y + 16 },
                initialSize: { ...el!.size },
              };
            });

          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            elements: [...state.elements, ...clones],
            selectedIds: clones.map((el) => el.id),
            selectedId: clones.length ? clones[clones.length - 1].id : state.selectedId,
          };
        }),
      setSelection: (ids) =>
        set(() => ({
          selectedIds: ids,
          selectedId: ids.length ? ids[ids.length - 1] : null,
        })),
      alignSelected: (mode) =>
        set((state) => {
          if (state.selectedIds.length < 2) return state;
          const selected = state.elements.filter((el) => state.selectedIds.includes(el.id));
          if (selected.length < 2) return state;

          const minX = Math.min(...selected.map((el) => el.layout.x));
          const maxX = Math.max(...selected.map((el) => el.layout.x + el.size.w));
          const minY = Math.min(...selected.map((el) => el.layout.y));
          const maxY = Math.max(...selected.map((el) => el.layout.y + el.size.h));

          const updates = selected.map((el) => {
            if (mode === 'left') return { id: el.id, x: minX, y: el.layout.y };
            if (mode === 'right') return { id: el.id, x: maxX - el.size.w, y: el.layout.y };
            if (mode === 'center')
              return { id: el.id, x: minX + (maxX - minX) / 2 - el.size.w / 2, y: el.layout.y };
            if (mode === 'top') return { id: el.id, x: el.layout.x, y: minY };
            if (mode === 'bottom') return { id: el.id, x: el.layout.x, y: maxY - el.size.h };
            return { id: el.id, x: el.layout.x, y: minY + (maxY - minY) / 2 - el.size.h / 2 };
          });

          const updateMap = new Map(updates.map((u) => [u.id, u]));
          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            elements: state.elements.map((el) => {
              const next = updateMap.get(el.id);
              if (!next) return el;
              return { ...el, layout: { x: next.x, y: next.y } };
            }),
          };
        }),
      distributeSelected: (axis) =>
        set((state) => {
          if (state.selectedIds.length < 3) return state;
          const selected = state.elements
            .filter((el) => state.selectedIds.includes(el.id))
            .slice()
            .sort((a, b) => (axis === 'x' ? a.layout.x - b.layout.x : a.layout.y - b.layout.y));

          if (selected.length < 3) return state;

          if (axis === 'x') {
            const min = selected[0];
            const max = selected[selected.length - 1];
            const totalSize = selected.reduce((sum, el) => sum + el.size.w, 0);
            const space =
              (max.layout.x + max.size.w - min.layout.x - totalSize) / (selected.length - 1);
            let cursor = min.layout.x;
            const updates = selected.map((el) => {
              const next = { id: el.id, x: cursor, y: el.layout.y };
              cursor += el.size.w + space;
              return next;
            });
            const updateMap = new Map(updates.map((u) => [u.id, u]));
            return {
              historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
              historyFuture: [],
              elements: state.elements.map((el) => {
                const next = updateMap.get(el.id);
                if (!next) return el;
                return { ...el, layout: { x: next.x, y: next.y } };
              }),
            };
          }

          const min = selected[0];
          const max = selected[selected.length - 1];
          const totalSize = selected.reduce((sum, el) => sum + el.size.h, 0);
          const space =
            (max.layout.y + max.size.h - min.layout.y - totalSize) / (selected.length - 1);
          let cursor = min.layout.y;
          const updates = selected.map((el) => {
            const next = { id: el.id, x: el.layout.x, y: cursor };
            cursor += el.size.h + space;
            return next;
          });
          const updateMap = new Map(updates.map((u) => [u.id, u]));
          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            elements: state.elements.map((el) => {
              const next = updateMap.get(el.id);
              if (!next) return el;
              return { ...el, layout: { x: next.x, y: next.y } };
            }),
          };
        }),
      undo: () =>
        set((state) => {
          const previous = state.historyPast[state.historyPast.length - 1];
          if (!previous) return state;
          const nextPast = state.historyPast.slice(0, -1);
          return {
            ...state,
            ...previous,
            isPlaying: false,
            currentTime: 0,
            duration: state.duration,
            historyPast: nextPast,
            historyFuture: [...state.historyFuture, createSnapshot(state)].slice(-MAX_HISTORY),
          };
        }),

      redo: () =>
        set((state) => {
          const next = state.historyFuture[state.historyFuture.length - 1];
          if (!next) return state;
          const nextFuture = state.historyFuture.slice(0, -1);
          return {
            ...state,
            ...next,
            isPlaying: false,
            currentTime: 0,
            duration: state.duration,
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: nextFuture,
          };
        }),
    }),
    {
      name: 'gsap-editor',
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<EditorState>) };
        state.elements = (state.elements ?? []).map((el) => {
          const fallback = defaultSizeFor(el.type);
          const currentSize = el.size ?? fallback;
          const normalizedSize = currentSize.w < 80 || currentSize.h < 80 ? fallback : currentSize;
          const textStyle =
            el.type === 'text'
              ? {
                  fontSize: 24,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  ...el.textStyle,
                }
              : undefined;
          return {
            ...el,
            size: normalizedSize,
            initialSize: el.initialSize ?? normalizedSize,
            text: el.type === 'text' ? (el.text ?? 'Animate Me') : el.text,
            textStyle,
            presetKey: el.presetKey ?? null,
          };
        });
        return state;
      },
      partialize: (state) => ({
        elements: state.elements,
        selectedId: state.selectedId,
        selectedIds: state.selectedIds,
        stagger: state.stagger,
        snapEnabled: state.snapEnabled,
        gridSize: state.gridSize,
      }),
    },
  ),
);
