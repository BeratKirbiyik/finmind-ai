"use client";
import { useEffect, useRef, useState } from "react";
import { ease } from "@/hooks/useAnimation";

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function CountUp({
  value, duration = 800, prefix = "", suffix = "", className = "",
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setDisplay(value); return; }

    setDisplay(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(ease.outExpo(t) * value));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{display.toLocaleString("tr-TR")}{suffix}
    </span>
  );
}
