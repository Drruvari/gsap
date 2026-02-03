import type { AnimationProps } from '@/lib/store';

export const ANIMATION_PRESETS: Record<string, Partial<AnimationProps>> = {
  'Bouncy Entrance': {
    scale: 1,
    opacity: 1,
    duration: 1.2,
    ease: 'elastic.out(1, 0.3)',
    x: 0,
    y: 0,
  },
  'Slide & Rotate': {
    x: 200,
    rotation: 360,
    duration: 1,
    ease: 'power2.inOut',
  },
};
