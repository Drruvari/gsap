import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useEditorStore } from '@/lib/store';

export function usePlayback() {
  const {
    isPlaying,
    elements,
    currentTime,
    stagger,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useEditorStore();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPlayingRef = useRef(false);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    // Rebuild timeline when elements change
    timelineRef.current?.kill();

    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => setCurrentTime(tl.time()),
      onComplete: () => setIsPlaying(false),
    });

    elements.forEach((el, index) => {
      const target = `[data-gsap-id='${el.id}']`;
      tl.to(target, {
        x: el.animation.x,
        y: el.animation.y,
        rotation: el.animation.rotation,
        scale: el.animation.scale,
        opacity: el.animation.opacity,
        duration: el.animation.duration,
        delay: el.animation.delay,
        ease: el.animation.ease,
      }, index * stagger);
    });

    timelineRef.current = tl;
    setDuration(tl.duration());
    tl.time(currentTimeRef.current, false);

    if (isPlayingRef.current) {
      tl.play();
      wasPlayingRef.current = true;
    }
  }, [elements, stagger, setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;

    if (isPlaying) {
      if (!tl.isActive()) {
        tl.play();
      }
      return;
    }

    // Only reset when transitioning from playing -> stopped
    if (wasPlayingRef.current) {
      tl.pause(0);
      setCurrentTime(0);
      // Reset elements back to their layout (clear transform/opacity props)
      elements.forEach((el) => {
        const target = `[data-gsap-id='${el.id}']`;
        gsap.set(target, { clearProps: "all" });
      });
    } else {
      // Scrub when not playing
      tl.pause();
      tl.time(currentTime, false);
    }

    wasPlayingRef.current = false;
  }, [isPlaying, currentTime, elements, setCurrentTime]);

  return timelineRef;
}
