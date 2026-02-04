import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareIcon, CircleIcon, TextIcon } from '@hugeicons/core-free-icons';

export function SelectionBox({
  box,
}: {
  box: { x: number; y: number; w: number; h: number } | null;
}) {
  if (!box) return null;
  return (
    <div
      className="absolute border border-primary/70 bg-primary/10 pointer-events-none"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    />
  );
}

export function MultiSelectBox({
  bounds,
}: {
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null;
}) {
  if (!bounds) return null;
  return (
    <div
      className="absolute border border-primary/70 pointer-events-none"
      style={{
        left: bounds.minX,
        top: bounds.minY,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
      }}
    />
  );
}

export function CanvasGuides({ guides }: { guides: { x: number[]; y: number[] } }) {
  return (
    <>
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
    </>
  );
}

export function DragLabel({ label }: { label: { id: string; x: number; y: number } | null }) {
  if (!label) return null;
  return (
    <div
      className="absolute text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground pointer-events-none shadow-sm"
      style={{ left: label.x + 8, top: label.y - 24 }}
    >
      {Math.round(label.x)}, {Math.round(label.y)}
    </div>
  );
}

export function EmptyCanvasState({
  isEmpty,
  onAdd,
}: {
  isEmpty: boolean;
  onAdd: (type: 'box' | 'circle' | 'text') => void;
}) {
  if (!isEmpty) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground select-none">
      <div className="text-center space-y-3">
        <div className="text-sm font-medium text-foreground/80">Canvas Empty</div>
        <div className="text-xs text-muted-foreground">Add elements to start your scene</div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onAdd('box')}>
            <HugeiconsIcon icon={SquareIcon} size={14} />
            Box
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onAdd('circle')}>
            <HugeiconsIcon icon={CircleIcon} size={14} />
            Circle
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onAdd('text')}>
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
  );
}
