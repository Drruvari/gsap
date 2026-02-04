import { Canvas } from '@/components/editor/Canvas';
import { Inspector } from '@/components/editor/Inspector';
import { Timeline } from '@/components/editor/Timeline';
import { TopBar } from '@/components/editor/TopBar';
import { lazy, Suspense } from 'react';
import { usePlayback } from '@/hooks/use-playback';
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
        <TopBar
          showLeft={showLeft}
          showRight={showRight}
          onToggleLeft={() => setShowLeft((prev) => !prev)}
          onToggleRight={() => setShowRight((prev) => !prev)}
        />

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
