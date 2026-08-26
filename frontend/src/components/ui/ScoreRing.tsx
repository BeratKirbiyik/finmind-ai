"use client";
import { useEffect, useRef, useState } from "react";
import { ease } from "@/hooks/useAnimation";

export default function ScoreRing({ score }: { score: number }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number>(0);
  const isGlowing = score >= 80;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 40;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setProgress(score); return; }

    setProgress(0);
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setProgress(ease.outQuart(t) * score);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [score]);

  const dash = (progress / 100) * circ;
  const grade =
    progress >= 85 ? "Mükemmel" :
    progress >= 70 ? "Çok iyi" :
    progress >= 50 ? "İyi" : "Geliştir";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={isGlowing ? {
        animation: "score-glow 2.8s ease-in-out infinite",
      } : {}}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#ffffff08" strokeWidth="8"/>
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{
              filter: isGlowing ? `drop-shadow(0 0 8px ${color}aa)` : `drop-shadow(0 0 4px ${color}66)`,
              transition: "stroke 0.3s ease",
            }}
          />
          <text x="50" y="45" textAnchor="middle"
            fontSize="20" fontWeight="700" fontFamily="JetBrains Mono, monospace"
            className="score-ring-value">
            {Math.round(progress)}
          </text>
          <text x="50" y="60" textAnchor="middle" fill="#44445a"
            fontSize="10" fontFamily="Outfit, sans-serif">
            /100
          </text>
        </svg>
      </div>
      <p className="text-[10px] text-[#44445a] uppercase tracking-widest">
        {grade}
      </p>
    </div>
  );
}
