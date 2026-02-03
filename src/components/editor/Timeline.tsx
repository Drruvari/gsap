import { useEditorStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, StopIcon, SquareIcon, CircleIcon, TextIcon } from '@hugeicons/core-free-icons';

export function Timeline() {
  const {
    isPlaying,
    setIsPlaying,
    addElement,
    resetElements,
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
  } = useEditorStore();

  return (
    <div className="h-16 bg-background/90 flex items-center px-3 sm:px-4 justify-between gap-3 corner-squircle">
      {/* Playback Controls */}
      <div className="flex items-center gap-3">
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
        >
          <HugeiconsIcon icon={isPlaying ? StopIcon : PlayIcon} fill="currentColor" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsPlaying(false);
            setCurrentTime(0);
            resetElements();
          }}
        >
          Reset
        </Button>
        <div className="text-xs text-muted-foreground ml-2">
          {isPlaying ? 'Previewing...' : 'Ready'}
        </div>
      </div>

      {/* Playhead */}
      <div className="flex items-center gap-3 min-w-[360px]">
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
          className="w-48 h-2 appearance-none rounded-full bg-muted/60 accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-blue-600"
          disabled={!duration}
        />
        <div className="text-xs text-muted-foreground tabular-nums min-w-[72px] text-right">
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
      </div>

      {/* Add Elements */}
      <div className="flex items-center gap-2">
        <Button
          variant={snapEnabled ? 'secondary' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => toggleSnap()}
        >
          Snap {gridSize}px
        </Button>
        <span className="text-xs font-medium text-muted-foreground mr-2">Add:</span>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement('box')}>
          <HugeiconsIcon icon={SquareIcon} size={16} />
          Box
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement('circle')}>
          <HugeiconsIcon icon={CircleIcon} size={16} />
          Circle
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement('text')}>
          <HugeiconsIcon icon={TextIcon} size={16} />
          Text
        </Button>
      </div>
    </div>
  );
}
