import { useEditorStore } from '@/lib/store';
import { generateReactCode } from '@/lib/generator';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodePreview() {
  const { elements, stagger, snapEnabled, gridSize, importScene } = useEditorStore();
  const [copied, setCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [jsonImported, setJsonImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEmpty = elements.length === 0;

  const generateCode = () => generateReactCode(elements, stagger);

  const exportScene = () => JSON.stringify({ elements, stagger, snapEnabled, gridSize }, null, 2);

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const payload = JSON.parse(text);
      if (!payload || !Array.isArray(payload.elements)) return;
      importScene({
        elements: payload.elements,
        stagger: payload.stagger,
        snapEnabled: payload.snapEnabled,
        gridSize: payload.gridSize,
      });
      setJsonImported(true);
      window.setTimeout(() => setJsonImported(false), 1400);
    } catch {
      setJsonImported(true);
      window.setTimeout(() => setJsonImported(false), 1400);
    }
  };

  const handleFileImport = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!payload || !Array.isArray(payload.elements)) return;
      importScene({
        elements: payload.elements,
        stagger: payload.stagger,
        snapEnabled: payload.snapEnabled,
        gridSize: payload.gridSize,
      });
      setJsonImported(true);
      window.setTimeout(() => setJsonImported(false), 1400);
    } catch {
      setJsonImported(true);
      window.setTimeout(() => setJsonImported(false), 1400);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([exportScene()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gsap-scene.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex flex-col gap-2 border-b border-border/60 bg-transparent">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
            Export
          </span>
          <span className="font-semibold text-sm">React + GSAP</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-start">
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
            {copied ? 'Copied' : 'Copy Code'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={async () => {
              await navigator.clipboard.writeText(exportScene());
              setJsonCopied(true);
              window.setTimeout(() => setJsonCopied(false), 1400);
            }}
          >
            <HugeiconsIcon icon={jsonCopied ? Tick02Icon : Copy01Icon} size={16} />
            {jsonCopied ? 'Scene Copied' : 'Copy JSON'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleImport}>
            {jsonImported ? 'Imported' : 'Import JSON'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadJson}>
            Download JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            Import File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              handleFileImport(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
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
