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
  currentTime: number;
  duration: number;
  stagger: number;
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
  selectElement: (id: string | null, additive?: boolean) => void;
  clearSelection: () => void;
  deleteElement: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setStagger: (stagger: number) => void;
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

export const useEditorStore = create<EditorState>()(
  persist(
    (set, _get) => ({
      elements: [],
      selectedId: null,
      selectedIds: [],
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      stagger: 0,
      snapEnabled: false,
      gridSize: 8,
      historyPast: [],
      historyFuture: [],

      addElement: (type) =>
        set((state) => {
          const id = crypto.randomUUID();
          const size = defaultSizeFor(type);
          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            elements: [
              ...state.elements,
              {
                id,
                type,
                label: `${type} ${state.elements.length + 1}`,
                layout: { x: 50, y: 50 },
                initialLayout: { x: 50, y: 50 },
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

      selectElement: (id, additive = false) =>
        set((state) => {
          if (id === null) {
            return {
              historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
              historyFuture: [],
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
              historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
              historyFuture: [],
              selectedId: nextSelectedIds.length
                ? nextSelectedIds[nextSelectedIds.length - 1]
                : null,
              selectedIds: nextSelectedIds,
            };
          }

          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            selectedId: id,
            selectedIds: [id],
          };
        }),

      clearSelection: () =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
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
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setStagger: (stagger) => set({ stagger }),
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
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
          selectedIds: state.elements.map((el) => el.id),
          selectedId: state.elements.length ? state.elements[state.elements.length - 1].id : null,
        })),
      duplicateSelected: () =>
        set((state) => {
          if (state.selectedIds.length === 0) return state;
          const now = state.elements.length;
          const clones = state.selectedIds
            .map((id, index) => state.elements.find((el) => el.id === id))
            .filter(Boolean)
            .map((el, index) => ({
              ...el!,
              id: crypto.randomUUID(),
              label: `${el!.type} ${now + index + 1}`,
              layout: { x: el!.layout.x + 16, y: el!.layout.y + 16 },
              initialLayout: { x: el!.initialLayout.x + 16, y: el!.initialLayout.y + 16 },
              initialSize: { ...el!.size },
            }));

          return {
            historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
            historyFuture: [],
            elements: [...state.elements, ...clones],
            selectedIds: clones.map((el) => el.id),
            selectedId: clones.length ? clones[clones.length - 1].id : state.selectedId,
          };
        }),
      setSelection: (ids) =>
        set((state) => ({
          historyPast: [...state.historyPast, createSnapshot(state)].slice(-MAX_HISTORY),
          historyFuture: [],
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
          return {
            ...el,
            size: normalizedSize,
            initialSize: el.initialSize ?? normalizedSize,
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
