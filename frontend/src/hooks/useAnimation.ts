"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export const ease = {
  outExpo:    (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  outQuart:   (t: number) => 1 - Math.pow(1 - t, 4),
  outBack:    (t: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inOutCubic: (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2,
};

export function useTween(duration: number, active = true) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(t);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [duration, active]);

  return value;
}

export function useCountUp(target: number, duration = 800, active = true) {
  const tween = useTween(duration, active);
  return Math.round(ease.outExpo(tween) * target);
}

export function useReplay() {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey(k => k + 1), []);
  return { key, replay };
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
