import { useEditorStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodePreview() {
  const { elements } = useEditorStore();
  const [copied, setCopied] = useState(false);
  const isEmpty = elements.length === 0;

  const generateCode = () => {
    if (elements.length === 0) return '';

    const refs = elements
      .map((el) => `const ${el.type}${el.id.slice(0, 4)}Ref = useRef(null);`)
      .join('\n  ');

    const jsx = elements
      .map((el) => {
        let classes = 'absolute ';
        if (el.type === 'box') classes += 'w-20 h-20 bg-blue-500 rounded-lg';
        if (el.type === 'circle') classes += 'w-20 h-20 bg-rose-500 rounded-full';
        if (el.type === 'text') classes += 'text-2xl font-bold text-zinc-800';

        // Inline styles for initial layout
        const width = el.size?.w ?? (el.type === 'text' ? 220 : 120);
        const height = el.size?.h ?? (el.type === 'text' ? 64 : 120);
        const style = `{{ left: ${el.layout.x}, top: ${el.layout.y}, width: ${width}, height: ${height} }}`;

        return `      <div ref={${el.type}${el.id.slice(0, 4)}Ref} className="${classes}" style=${style}>\n        ${el.label}\n      </div>`;
      })
      .join('\n');

    const animations = elements
      .map((el) => {
        return `    gsap.to(${el.type}${el.id.slice(0, 4)}Ref.current, {
      x: ${el.animation.x},
      y: ${el.animation.y},
      rotation: ${el.animation.rotation},
      scale: ${el.animation.scale},
      opacity: ${el.animation.opacity},
      duration: ${el.animation.duration},
      delay: ${el.animation.delay},
      ease: "${el.animation.ease}"
    });`;
      })
      .join('\n\n');

    return `import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Animation() {
  ${refs}

  useGSAP(() => {
${animations}
  });

  return (
    <div className="relative w-full h-screen bg-zinc-50 overflow-hidden">
${jsx}
    </div>
  );
}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex justify-between items-center border-b border-border/60 bg-transparent">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
            Export
          </span>
          <span className="font-semibold text-sm">React + GSAP</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={async () => {
            await navigator.clipboard.writeText(generateCode());
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          }}
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="flex-1 p-0 overflow-hidden relative">
        <SyntaxHighlighter
          language="tsx"
          style={oneDark}
          customStyle={{
            background: 'transparent',
            margin: 0,
            height: '100%',
            overflow: 'auto',
            padding: '16px',
            fontSize: '12px',
            lineHeight: '1.5',
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace)",
            },
          }}
        >
          {generateCode()}
        </SyntaxHighlighter>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full border border-border/60 bg-background/60 px-4 py-2 text-xs font-medium text-foreground/80 backdrop-blur">
              Add elements to generate code
            </div>
          </div>
        )}
        {copied && (
          <div className="absolute inset-0 flex items-start justify-end p-4 pointer-events-none">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[11px] shadow-sm">
              <HugeiconsIcon icon={Tick02Icon} size={14} />
              Copied to clipboard
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
