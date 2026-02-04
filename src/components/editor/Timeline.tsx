import { useMemo } from 'react';
import { useEditorStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, StopIcon, SquareIcon, CircleIcon, TextIcon } from '@hugeicons/core-free-icons';

export function Timeline() {
  const {
    isPlaying,
    loopEnabled,
    setIsPlaying,
    setLoopEnabled,
    loopRepeat,
    loopYoyo,
    previewSpeed,
    setLoopRepeat,
    setLoopYoyo,
    setPreviewSpeed,
    addElement,
    resetPreview,
    currentTime,
    duration,
    setCurrentTime,
    snapEnabled,
    toggleSnap,
    gridSize,
    stagger,
    setStagger,
    undo,
    redo,
    historyPast,
    historyFuture,
    elements,
    setElementPresetKey,
    updateElementAnimation,
    gridOpacity,
    gridMajorOpacity,
    setGridOpacity,
    setGridMajorOpacity,
    showCenterCrosshair,
    setShowCenterCrosshair,
  } = useEditorStore();

  const itemOffsets = useMemo(
    () =>
      elements
        .map((el) => ({
          id: el.id,
          label: el.label,
          delay: el.animation.delay,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [elements],
  );

  return (
    <div className="flex flex-col gap-2 px-3 sm:px-4 py-2.5">
      {/* Row 1: Playback + Playhead */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => undo()}
            disabled={historyPast.length === 0}
          >
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => redo()}
            disabled={historyFuture.length === 0}
          >
            Redo
          </Button>
          <Button
            variant={isPlaying ? 'destructive' : 'default'}
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="rounded-full"
            aria-label={isPlaying ? 'Stop preview' : 'Play preview'}
          >
            <HugeiconsIcon icon={isPlaying ? StopIcon : PlayIcon} fill="currentColor" />
          </Button>
          <Button
            variant={loopEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLoopEnabled(!loopEnabled)}
            className={loopEnabled ? 'ring-1 ring-primary/40' : undefined}
          >
            Loop
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Repeat</span>
            <Input
              type="number"
              min="0"
              step="1"
              value={loopRepeat}
              onChange={(e) => setLoopRepeat(Number(e.target.value))}
              className="h-7 w-16 text-[11px]"
            />
          </div>
          <Button
            variant={loopYoyo ? 'default' : 'outline'}
            size="xs"
            onClick={() => setLoopYoyo(!loopYoyo)}
            className={loopYoyo ? 'ring-1 ring-primary/40' : undefined}
          >
            Yoyo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetPreview();
            }}
          >
            Reset
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTime(Number(e.target.value));
            }}
            className="w-[200px] sm:w-[240px] md:w-[280px] h-2.5 appearance-none rounded-full bg-gradient-to-r from-primary/30 via-primary/20 to-muted/50 shadow-inner ring-1 ring-border/60 accent-primary/80 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/60 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/60 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-primary/30"
            disabled={!duration}
          />
          <div className="text-xs text-muted-foreground tabular-nums min-w-[84px] text-right">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Stagger</span>
            <Input
              type="number"
              step="0.05"
              min="0"
              value={stagger}
              onChange={(e) => setStagger(Number(e.target.value))}
              className="h-8 w-20 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Speed</span>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={previewSpeed}
              onChange={(e) => setPreviewSpeed(Number(e.target.value))}
              className="h-8 w-20 text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground min-w-[56px] text-right">
            {isPlaying ? 'Previewing...' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Row 2: Add + Offsets */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={snapEnabled ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={() => toggleSnap()}
          >
            Snap {gridSize}px
          </Button>
          <span className="text-xs font-medium text-muted-foreground">Add:</span>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement('box')}>
            <HugeiconsIcon icon={SquareIcon} size={16} />
            Box
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => addElement('circle')}
          >
            <HugeiconsIcon icon={CircleIcon} size={16} />
            Circle
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement('text')}>
            <HugeiconsIcon icon={TextIcon} size={16} />
            Text
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[11px] text-muted-foreground">Grid</span>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="0.6"
              value={gridOpacity}
              onChange={(e) => setGridOpacity(Number(e.target.value))}
              className="h-7 w-16 text-[11px]"
            />
            <span className="text-[11px] text-muted-foreground">Major</span>
            <Input
              type="number"
              step="0.05"
              min="0"
              max="0.8"
              value={gridMajorOpacity}
              onChange={(e) => setGridMajorOpacity(Number(e.target.value))}
              className="h-7 w-16 text-[11px]"
            />
            <Button
              variant={showCenterCrosshair ? 'secondary' : 'outline'}
              size="xs"
              onClick={() => setShowCenterCrosshair(!showCenterCrosshair)}
            >
              Center
            </Button>
          </div>
        </div>
        {itemOffsets.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Offsets
            </div>
            {itemOffsets.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1"
              >
                <span className="text-[11px] text-foreground/70">{item.label}</span>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  value={item.delay}
                  onChange={(e) => {
                    updateElementAnimation(item.id, { delay: Number(e.target.value) });
                    setElementPresetKey(item.id, null);
                  }}
                  className="h-7 w-20 text-[11px]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-element Offsets */}
    </div>
  );
}
