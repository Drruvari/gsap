import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useEditorStore } from '@/lib/store';

export function usePlayback() {
  const {
    isPlaying,
    loopEnabled,
    elements,
    currentTime,
    stagger,
    previewResetId,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useEditorStore();
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasPlayingRef = useRef(false);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  const baseState = useRef({
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    opacity: 1,
  });

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
      onComplete: () => {
        if (!loopEnabled) {
          setIsPlaying(false);
        }
      },
    });

    elements.forEach((el, index) => {
      const target = `[data-gsap-id='${el.id}']`;
      gsap.set(target, baseState.current);
      tl.to(
        target,
        {
          x: el.animation.x,
          y: el.animation.y,
          rotation: el.animation.rotation,
          scale: el.animation.scale,
          opacity: el.animation.opacity,
          duration: el.animation.duration,
          delay: el.animation.delay,
          ease: el.animation.ease,
        },
        index * stagger,
      );
    });

    timelineRef.current = tl;
    setDuration(tl.duration());
    tl.time(currentTimeRef.current, false);

    if (loopEnabled) {
      tl.repeat(-1);
    } else {
      tl.repeat(0);
    }

    if (isPlayingRef.current) {
      tl.play();
      wasPlayingRef.current = true;
    }
  }, [elements, loopEnabled, stagger, setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;

    if (isPlaying) {
      if (!tl.isActive()) {
        tl.play();
      }
      return;
    }

    // Only reset when transitioning from playing -> stopped (and not looping)
    if (wasPlayingRef.current && !loopEnabled) {
      tl.pause(0);
      setCurrentTime(0);
      elements.forEach((el) => {
        const target = `[data-gsap-id='${el.id}']`;
        gsap.set(target, baseState.current);
      });
    } else {
      // Scrub when not playing
      tl.pause();
      tl.time(currentTime, false);
    }

    wasPlayingRef.current = false;
  }, [isPlaying, currentTime, elements, loopEnabled, setCurrentTime]);

  useEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    tl.pause(0);
    setCurrentTime(0);
    setIsPlaying(false);
    elements.forEach((el) => {
      const target = `[data-gsap-id='${el.id}']`;
      gsap.set(target, baseState.current);
    });
  }, [previewResetId, elements, setCurrentTime, setIsPlaying]);

  return timelineRef;
}
