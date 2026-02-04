import type { AnimationProps } from '@/lib/store';

export const ANIMATION_PRESETS: Record<string, Partial<AnimationProps>> = {
  'Fade In': {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
  },
  'Pop In': {
    scale: 1,
    opacity: 1,
    duration: 0.6,
    ease: 'back.out(1.7)',
  },
  'Slide Up': {
    y: -120,
    opacity: 1,
    duration: 0.9,
    ease: 'power3.out',
  },
  'Slide Down': {
    y: 120,
    opacity: 1,
    duration: 0.9,
    ease: 'power3.out',
  },
  'Slide Left': {
    x: -160,
    opacity: 1,
    duration: 0.9,
    ease: 'power3.out',
  },
  'Slide Right': {
    x: 160,
    opacity: 1,
    duration: 0.9,
    ease: 'power3.out',
  },
  'Bouncy Entrance': {
    scale: 1,
    opacity: 1,
    duration: 1.2,
    ease: 'elastic.out(1, 0.3)',
    x: 0,
    y: 0,
  },
  Wobble: {
    rotation: 8,
    duration: 0.8,
    ease: 'elastic.out(1, 0.5)',
  },
  Spin: {
    rotation: 360,
    duration: 1,
    ease: 'power2.inOut',
  },
  'Slide & Rotate': {
    x: 200,
    rotation: 360,
    duration: 1,
    ease: 'power2.inOut',
  },
  'Scale Down': {
    scale: 0.7,
    duration: 0.8,
    ease: 'power2.inOut',
  },
};
