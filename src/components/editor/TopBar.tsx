import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { SidebarLeft01Icon, SidebarRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type TopBarProps = {
  showLeft: boolean;
  showRight: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
};

export function TopBar({ showLeft, showRight, onToggleLeft, onToggleRight }: TopBarProps) {
  return (
    <div className="corner-squircle glass-panel-strong px-4 py-2.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 corner-squircle border border-border/60 bg-muted/60 shadow-sm" />
          <div className="flex items-center gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">GSAP Animation Editor</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Prototype Studio</div>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onToggleLeft}
              title={showLeft ? 'Hide left sidebar' : 'Show left sidebar'}
              aria-label={showLeft ? 'Hide left sidebar' : 'Show left sidebar'}
            >
              <HugeiconsIcon icon={SidebarLeft01Icon} size={16} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onToggleRight}
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
            aria-label="Support the project"
          >
            ☕ Support
          </a>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
