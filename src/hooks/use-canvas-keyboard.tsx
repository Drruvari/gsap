import { useEffect } from 'react';
import type { SceneElement } from '@/lib/store';

type UseCanvasKeyboardProps = {
  applySnap: (value: number, enabled?: boolean) => number;
  elementMap: Map<string, SceneElement>;
  selectedIds: string[];
  snapEnabled: boolean;
  gridSize: number;
  isPlaying: boolean;
  clearSelection: () => void;
  selectAll: () => void;
  duplicateSelected: () => void;
  toggleSnap: () => void;
  resetElements: () => void;
  deleteElement: (id: string) => void;
  undo: () => void;
  redo: () => void;
  updateElementsLayout: (
    updates: Array<{ id: string; x: number; y: number }>,
    commit?: boolean,
  ) => void;
};

export function useCanvasKeyboard({
  applySnap,
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
}: UseCanvasKeyboardProps) {
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

      const snapping = snapEnabled && !event.altKey;
      const baseStep = snapping ? gridSize : 1;
      const step = event.shiftKey ? baseStep * 5 : baseStep;
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

      const updates = selectedIds
        .map((id) => {
          const el = elementMap.get(id);
          if (!el) return null;
          const nextX = applySnap(el.layout.x + dx, snapping);
          const nextY = applySnap(el.layout.y + dy, snapping);
          return { id, x: nextX, y: nextY };
        })
        .filter(Boolean) as Array<{ id: string; x: number; y: number }>;

      if (updates.length > 0) {
        updateElementsLayout(updates, true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    applySnap,
    clearSelection,
    deleteElement,
    duplicateSelected,
    elementMap,
    gridSize,
    isPlaying,
    redo,
    resetElements,
    selectAll,
    selectedIds,
    snapEnabled,
    toggleSnap,
    undo,
    updateElementsLayout,
  ]);
}
