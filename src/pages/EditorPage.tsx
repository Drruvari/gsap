import { Canvas } from '@/components/editor/Canvas';
import { Inspector } from '@/components/editor/Inspector';
import { Timeline } from '@/components/editor/Timeline';
import { lazy, Suspense } from 'react';
import { usePlayback } from '@/hooks/use-playback';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { SidebarLeft01Icon, SidebarRight01Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';

const CodePreview = lazy(() =>
  import('@/components/editor/CodePreview').then((m) => ({ default: m.CodePreview })),
);

export function EditorPage() {
  usePlayback();
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  return (
    <div className="h-screen w-full text-foreground font-sans app-shell">
      <div className="h-full w-full p-3 sm:p-4 lg:p-6 flex flex-col gap-3 sm:gap-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between corner-squircle glass-panel-strong px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 corner-squircle border border-border/60 bg-muted/60 shadow-sm" />
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm font-semibold tracking-tight">GSAP Animation Editor</div>
                <div className="text-xs text-muted-foreground">Prototype Studio</div>
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setShowLeft((prev) => !prev)}
                title={showLeft ? 'Hide left sidebar' : 'Show left sidebar'}
                aria-label={showLeft ? 'Hide left sidebar' : 'Show left sidebar'}
              >
                <HugeiconsIcon icon={SidebarLeft01Icon} size={16} />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setShowRight((prev) => !prev)}
              title={showRight ? 'Hide right sidebar' : 'Show right sidebar'}
              aria-label={showRight ? 'Hide right sidebar' : 'Show right sidebar'}
            >
              <HugeiconsIcon icon={SidebarRight01Icon} size={16} />
            </Button>
            <a
              href="https://buymeacoffee.com/drruvari"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-yellow-300 text-black px-3 py-1.5 text-xs font-semibold hover:bg-yellow-200"
            >
              ☕ Support
            </a>
            <ModeToggle />
          </div>
        </div>

        {/* Main Grid */}
        <div
          className={[
            'flex-1 min-h-0 grid grid-cols-1 gap-3 sm:gap-4',
            showLeft &&
              showRight &&
              'lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[280px_minmax(0,1fr)_360px]',
            showLeft &&
              !showRight &&
              'lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]',
            !showLeft &&
              showRight &&
              'lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]',
            !showLeft && !showRight && 'lg:grid-cols-[minmax(0,1fr)]',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Left Sidebar: Inspector */}
          {showLeft && (
            <div className="order-2 lg:order-0 corner-squircle glass-panel overflow-hidden">
              <Inspector />
            </div>
          )}

          {/* Center Region: Canvas & Timeline */}
          <div className="order-1 lg:order-0 min-w-0 min-h-0 flex flex-col gap-4">
            <div className="flex-1 min-h-0 corner-squircle glass-panel p-3 sm:p-4 flex">
              <Canvas />
            </div>
            <div className="corner-squircle glass-panel">
              <Timeline />
            </div>
          </div>

          {/* Right Sidebar: Code Preview */}
          {showRight && (
            <div className="order-3 lg:order-0 corner-squircle glass-panel overflow-hidden">
              <Suspense
                fallback={<div className="p-4 text-sm text-muted-foreground">Loading code…</div>}
              >
                <CodePreview />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
