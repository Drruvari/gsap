import { useEditorStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { useRef } from 'react';
import { ANIMATION_PRESETS } from '@/lib/presets';

export function Inspector() {
  const {
    elements,
    selectedId,
    selectedIds,
    updateElementAnimation,
    deleteElement,
    alignSelected,
    distributeSelected,
  } = useEditorStore();
  const easePreviewRef = useRef<string | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedId);

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => deleteElement(id));
  };

  if (selectedIds.length > 1) {
    return (
      <div className="w-full flex flex-col h-full">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-transparent">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 corner-squircle bg-muted flex items-center justify-center">
              <HugeiconsIcon icon={Settings01Icon} size={16} />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Selection</div>
              <div className="text-sm font-semibold">{selectedIds.length} elements</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDeleteSelected}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
          </Button>
        </div>
        <div className="p-4 space-y-3 text-xs text-muted-foreground">
          <div>Adjust properties one at a time.</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-foreground/80">
              Shift
            </span>
            <span>to multi‑select</span>
          </div>
          <div className="pt-2 space-y-2">
            <div className="text-[11px] font-medium text-foreground/70">Align</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="xs" onClick={() => alignSelected('left')}>
                L
              </Button>
              <Button variant="outline" size="xs" onClick={() => alignSelected('center')}>
                C
              </Button>
              <Button variant="outline" size="xs" onClick={() => alignSelected('right')}>
                R
              </Button>
              <Button variant="outline" size="xs" onClick={() => alignSelected('top')}>
                T
              </Button>
              <Button variant="outline" size="xs" onClick={() => alignSelected('middle')}>
                M
              </Button>
              <Button variant="outline" size="xs" onClick={() => alignSelected('bottom')}>
                B
              </Button>
            </div>
            <div className="text-[11px] font-medium text-foreground/70">Distribute</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="xs" onClick={() => distributeSelected('x')}>
                H
              </Button>
              <Button variant="outline" size="xs" onClick={() => distributeSelected('y')}>
                V
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedElement) {
    return (
      <div className="w-full flex flex-col h-full">
        <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-transparent">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 corner-squircle bg-muted flex items-center justify-center">
              <HugeiconsIcon icon={Settings01Icon} size={16} />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Inspector</div>
              <div className="text-sm font-semibold">No selection</div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4 text-muted-foreground">
          <div className="text-sm">Select an element on the canvas to edit its properties.</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-foreground/80">
                Shift
              </span>
              <span>multi‑select</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-foreground/80">
                Alt
              </span>
              <span>disable snap while dragging</span>
            </div>
          </div>
          <div className="text-xs">
            Tip: use the Add buttons in the timeline if the canvas is empty.
          </div>
        </div>
      </div>
    );
  }

  const { animation } = selectedElement;

  const handleChange = (key: keyof typeof animation, value: string | number) => {
    updateElementAnimation(selectedElement.id, { [key]: Number(value) });
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/60 bg-transparent">
        <span className="font-semibold text-sm">{selectedElement.label}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => deleteElement(selectedElement.id)}
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
        </Button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* Transform Section */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Preset</Label>
            <Select
              onValueChange={(val) => {
                const preset = ANIMATION_PRESETS[val as keyof typeof ANIMATION_PRESETS];
                updateElementAnimation(selectedElement.id, preset);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ANIMATION_PRESETS).map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Transform Target
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Move X</Label>
              <Input
                type="number"
                value={animation.x}
                onChange={(e) => handleChange('x', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Move Y</Label>
              <Input
                type="number"
                value={animation.y}
                onChange={(e) => handleChange('y', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Rotation (deg)</Label>
              <Input
                type="number"
                value={animation.rotation}
                onChange={(e) => handleChange('rotation', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Scale</Label>
              <Input
                type="number"
                step="0.1"
                value={animation.scale}
                onChange={(e) => handleChange('scale', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Opacity</Label>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={animation.opacity}
              onChange={(e) => handleChange('opacity', e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Timing Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Timing & Easing
          </h4>

          <div className="space-y-1.5">
            <Label className="text-xs">Duration (s)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={animation.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Delay (s)</Label>
            <Input
              type="number"
              step="0.05"
              min="0"
              value={animation.delay}
              onChange={(e) => handleChange('delay', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Ease</Label>
            <Select
              value={animation.ease ?? undefined}
              onValueChange={(val) => {
                easePreviewRef.current = null;
                updateElementAnimation(selectedElement.id, { ease: val ?? undefined });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: 'none', label: 'Linear (none)' },
                  { value: 'power1.out', label: 'Power1 Out' },
                  { value: 'power2.out', label: 'Power2 Out (Default)' },
                  { value: 'bounce.out', label: 'Bounce' },
                  { value: 'elastic.out', label: 'Elastic' },
                  { value: 'back.out', label: 'Back Out' },
                ].map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    onMouseEnter={() => {
                      if (easePreviewRef.current === null) {
                        easePreviewRef.current = animation.ease;
                      }
                      updateElementAnimation(selectedElement.id, { ease: item.value });
                    }}
                    onMouseLeave={() => {
                      if (easePreviewRef.current !== null) {
                        updateElementAnimation(selectedElement.id, {
                          ease: easePreviewRef.current,
                        });
                      }
                    }}
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
