import { type SceneElement } from '@/lib/store';

export const generateReactCode = (elements: SceneElement[], stagger = 0) => {
  // 1. Generate JSX
  const jsxElements = elements
    .map((el) => {
      // Basic tailwind mapping
      let className = 'absolute ';
      if (el.type === 'box') className += 'w-20 h-20 bg-blue-500 rounded-lg';
      if (el.type === 'circle') className += 'w-20 h-20 bg-rose-500 rounded-full';
      if (el.type === 'text') className += 'text-zinc-800';

      // Note: We use the layout X/Y for initial CSS positioning
      const fontSize = el.textStyle?.fontSize ?? 24;
      const fontWeight = el.textStyle?.fontWeight ?? 600;
      const lineHeight = el.textStyle?.lineHeight ?? 1.1;
      const textStyles =
        el.type === 'text'
          ? `, fontSize: ${fontSize}, fontWeight: ${fontWeight}, lineHeight: ${lineHeight}, whiteSpace: 'pre-wrap'`
          : '';
      const content = el.type === 'text' ? `{${JSON.stringify(el.text ?? 'Text')}}` : '';
      return `      <div
        ref={(el) => refs.current['${el.id}'] = el}
        className="${className}"
        style={{ left: ${el.layout.x}, top: ${el.layout.y}, width: ${el.size?.w ?? (el.type === 'text' ? 220 : 120)}, height: ${el.size?.h ?? (el.type === 'text' ? 64 : 120)}${textStyles} }}
      >
        ${content}
      </div>`;
    })
    .join('\n');

  // 2. Generate GSAP Code
  const gsapLogic = elements
    .map((el, index) => {
      const at = stagger > 0 ? `${index} * ${stagger}` : '0';
      const duration = el.animation.duration;
      const delay = el.animation.delay;
      const baseEase = el.animation.ease;
      const easeX = el.animation.easeX ?? baseEase;
      const easeY = el.animation.easeY ?? baseEase;
      const easeRotation = el.animation.easeRotation ?? baseEase;
      const easeScale = el.animation.easeScale ?? baseEase;
      const easeOpacity = el.animation.easeOpacity ?? baseEase;
      return [
        `    tl.to(refs.current['${el.id}'], { x: ${el.animation.x}, duration: ${duration}, delay: ${delay}, ease: "${easeX}" }, ${at});`,
        `    tl.to(refs.current['${el.id}'], { y: ${el.animation.y}, duration: ${duration}, delay: ${delay}, ease: "${easeY}" }, ${at});`,
        `    tl.to(refs.current['${el.id}'], { rotation: ${el.animation.rotation}, duration: ${duration}, delay: ${delay}, ease: "${easeRotation}" }, ${at});`,
        `    tl.to(refs.current['${el.id}'], { scale: ${el.animation.scale}, duration: ${duration}, delay: ${delay}, ease: "${easeScale}" }, ${at});`,
        `    tl.to(refs.current['${el.id}'], { opacity: ${el.animation.opacity}, duration: ${duration}, delay: ${delay}, ease: "${easeOpacity}" }, ${at});`,
      ].join('\n');
    })
    .join('\n\n');

  // 3. Construct Full File
  return `import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Animation() {
  const refs = useRef({});

  useGSAP(() => {
    const tl = gsap.timeline();
${gsapLogic}
  }, []);

  return (
    <div className="relative w-full h-screen bg-zinc-50 overflow-hidden">
${jsxElements}
    </div>
  );
};`;
};
