import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon } from '@hugeicons/core-free-icons';

const shortcuts = [
  { keys: 'Cmd/Ctrl + Z', desc: 'Undo' },
  { keys: 'Cmd/Ctrl + Y', desc: 'Redo' },
  { keys: 'Cmd/Ctrl + A', desc: 'Select all' },
  { keys: 'Cmd/Ctrl + D', desc: 'Duplicate selection' },
  { keys: 'Delete / Backspace', desc: 'Delete selection' },
  { keys: 'Arrow Keys', desc: 'Nudge selection' },
  { keys: 'Shift + Arrow', desc: 'Nudge x5' },
  { keys: 'G', desc: 'Toggle snap' },
  { keys: 'C', desc: 'Toggle center crosshair' },
  { keys: 'R', desc: 'Reset layout' },
  { keys: 'Esc', desc: 'Clear selection' },
  { keys: 'Shift + Drag', desc: 'Axis lock drag' },
  { keys: 'Alt + Drag', desc: 'Disable snap while dragging' },
  { keys: 'Shift + Resize', desc: 'Lock aspect ratio' },
];

const tips = [
  'Use the Inspector to edit animation offsets and timing.',
  'Presets can be reset per element after tweaks.',
  'Use the Timeline slider to scrub the preview.',
  'Text elements can be edited by double‑clicking.',
];

export function HelpDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        aria-label="Help & shortcuts"
        className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))}
      >
        <HugeiconsIcon icon={Settings01Icon} size={16} />
      </AlertDialogTrigger>
      <AlertDialogContent data-size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Help & Shortcuts</AlertDialogTitle>
          <AlertDialogDescription>
            Quick reference for editor controls and tips.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Shortcuts
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {shortcuts.map((item) => (
              <div
                key={item.keys}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs"
              >
                <span className="font-medium text-foreground/90">{item.keys}</span>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tips
          </div>
          <div className="grid grid-cols-1 gap-2">
            {tips.map((tip) => (
              <div key={tip} className="text-xs text-muted-foreground">
                {tip}
              </div>
            ))}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
