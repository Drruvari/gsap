import { type SceneElement } from '@/lib/store';

export const generateReactCode = (elements: SceneElement[]) => {
  // 1. Generate JSX
  const jsxElements = elements
    .map((el) => {
      // Basic tailwind mapping
      let className = 'absolute ';
      if (el.type === 'box') className += 'w-20 h-20 bg-blue-500 rounded-lg';
      if (el.type === 'circle') className += 'w-20 h-20 bg-rose-500 rounded-full';
      if (el.type === 'text') className += 'text-2xl font-bold';

      // Note: We use the layout X/Y for initial CSS positioning
      return `      <div
        ref={(el) => refs.current['${el.id}'] = el}
        className="${className}"
        style={{ left: ${el.layout.x}, top: ${el.layout.y}, width: ${el.size?.w ?? (el.type === 'text' ? 220 : 120)}, height: ${el.size?.h ?? (el.type === 'text' ? 64 : 120)} }}
      >
        ${el.label}
      </div>`;
    })
    .join('\n');

  // 2. Generate GSAP Code
  const gsapLogic = elements
    .map((el) => {
      // Note: We use animation props here
      return `    gsap.to(refs.current['${el.id}'], {
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

  // 3. Construct Full File
  return `import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Animation() {
  const refs = useRef({});

  useGSAP(() => {
${gsapLogic}
  }, []);

  return (
    <div className="relative w-full h-screen bg-zinc-50 overflow-hidden">
${jsxElements}
    </div>
  );
};`;
};
