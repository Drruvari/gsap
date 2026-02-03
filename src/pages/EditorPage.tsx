import { Canvas } from '@/components/editor/Canvas';
import { Inspector } from '@/components/editor/Inspector';
import { Timeline } from '@/components/editor/Timeline';
import { CodePreview } from '@/components/editor/CodePreview';
import { usePlayback } from '@/hooks/use-playback';
import { ModeToggle } from '@/components/mode-toggle';

export function EditorPage() {
  usePlayback();
  return (
    <div className="h-screen w-full bg-[radial-gradient(1200px_circle_at_top,rgba(255,255,255,0.9),transparent_60%)] dark:bg-[radial-gradient(1200px_circle_at_top,rgba(24,24,27,0.9),transparent_60%)] text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="h-full w-full p-3 sm:p-4 lg:p-6 flex flex-col gap-3 sm:gap-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between corner-squircle border bg-background/90 px-3 sm:px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 corner-squircle bg-linear-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-400" />
            <div>
              <div className="text-sm font-semibold tracking-tight">GSAP Animation Editor</div>
              <div className="text-xs text-muted-foreground">Prototype Studio</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[280px_minmax(0,1fr)_360px] gap-3 sm:gap-4">
          {/* Left Sidebar: Inspector */}
          <div className="order-2 lg:order-0 corner-squircle border bg-background/90 overflow-hidden">
            <Inspector />
          </div>

          {/* Center Region: Canvas & Timeline */}
          <div className="order-1 lg:order-0 min-w-0 min-h-0 flex flex-col gap-4">
            <div className="flex-1 min-h-0 corner-squircle bg-background/90 p-3 sm:p-4 flex">
              <Canvas />
            </div>
            <div className="corner-squircle bg-background/90">
              <Timeline />
            </div>
          </div>

          {/* Right Sidebar: Code Preview */}
          <div className="order-3 lg:order-0 corner-squircle border bg-background/90 overflow-hidden">
            <CodePreview />
          </div>
        </div>
      </div>
    </div>
  );
}
