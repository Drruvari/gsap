import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useEditorStore } from '@/lib/store';

export function usePlayback() {
  const {
    isPlaying,
    loopEnabled,
    loopRepeat,
    loopYoyo,
    previewSpeed,
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
      const at = index * stagger;
      const duration = el.animation.duration;
      const delay = el.animation.delay;
      const baseEase = el.animation.ease;
      const easeX = el.animation.easeX ?? baseEase;
      const easeY = el.animation.easeY ?? baseEase;
      const easeRotation = el.animation.easeRotation ?? baseEase;
      const easeScale = el.animation.easeScale ?? baseEase;
      const easeOpacity = el.animation.easeOpacity ?? baseEase;

      tl.to(target, { x: el.animation.x, duration, delay, ease: easeX }, at);
      tl.to(target, { y: el.animation.y, duration, delay, ease: easeY }, at);
      tl.to(target, { rotation: el.animation.rotation, duration, delay, ease: easeRotation }, at);
      tl.to(target, { scale: el.animation.scale, duration, delay, ease: easeScale }, at);
      tl.to(target, { opacity: el.animation.opacity, duration, delay, ease: easeOpacity }, at);
    });

    timelineRef.current = tl;
    setDuration(tl.duration());
    tl.time(currentTimeRef.current, false);

    if (loopEnabled) {
      tl.repeat(loopRepeat === 0 ? -1 : loopRepeat);
      tl.yoyo(loopYoyo);
    } else {
      tl.repeat(0);
      tl.yoyo(false);
    }

    tl.timeScale(previewSpeed);

    if (isPlayingRef.current) {
      tl.play();
      wasPlayingRef.current = true;
    }
  }, [
    elements,
    loopEnabled,
    loopRepeat,
    loopYoyo,
    previewSpeed,
    stagger,
    setCurrentTime,
    setDuration,
    setIsPlaying,
  ]);

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
