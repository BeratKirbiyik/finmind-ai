"use client";
import { useEffect, useState } from "react";

export default function LogoSVG() {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 100);
    return () => clearTimeout(t);
  }, []);

  const letters = [
    // F
    { d: "M14 16 L14 74 M14 16 L52 16 M14 44 L46 44", color: "#f59e0b", delay: 0 },
    // i
    { d: "M70 36 L70 74 M70 22 L70 24", color: "#f0f0f5", delay: 120 },
    // n
    { d: "M86 74 L86 36 Q86 32 90 32 L100 32 Q112 32 112 44 L112 74", color: "#f0f0f5", delay: 240 },
    // M
    { d: "M128 74 L128 32 L142 56 L156 32 L156 74", color: "#f0f0f5", delay: 360 },
    // i
    { d: "M174 36 L174 74 M174 22 L174 24", color: "#f0f0f5", delay: 480 },
    // n
    { d: "M190 74 L190 36 Q190 32 194 32 L204 32 Q216 32 216 44 L216 74", color: "#f0f0f5", delay: 600 },
    // d
    { d: "M250 16 L250 74 M250 36 Q244 32 238 32 Q228 32 228 50 Q228 74 240 74 Q246 74 250 70", color: "#f0f0f5", delay: 720 },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 310 90" width="260" height="78" className="overflow-visible">
        {letters.map((l, i) => (
          <path
            key={i}
            d={l.d}
            fill="none"
            stroke={l.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 300,
              strokeDashoffset: drawn ? 0 : 300,
              opacity: drawn ? 1 : 0.2,
              transition: drawn
                ? `stroke-dashoffset 700ms cubic-bezier(.65,0,.35,1) ${l.delay}ms, opacity 200ms ease ${l.delay}ms`
                : "none",
            }}
          />
        ))}

        {/* AI rozeti — çizim bittikten sonra pop */}
        <g
          style={{
            opacity: drawn ? 1 : 0,
            transform: drawn ? "scale(1)" : "scale(0)",
            transformOrigin: "289px 45px",
            transition: "transform 400ms cubic-bezier(.34,1.56,.64,1) 900ms, opacity 200ms ease 900ms",
          }}
        >
          <rect x="272" y="34" width="34" height="22" rx="6" fill="#f59e0b" />
          <text x="289" y="50" fontSize="12" fontFamily="JetBrains Mono, monospace"
            fontWeight="700" fill="#0a0a0f" textAnchor="middle">
            AI
          </text>
        </g>
      </svg>

      {/* tagline */}
      <p
        className="text-[#44445a] text-xs tracking-widest uppercase"
        style={{
          opacity: drawn ? 1 : 0,
          transform: drawn ? "translateY(0)" : "translateY(8px)",
          transition: "all 400ms ease 1100ms",
        }}
      >
        Personal Finance Intelligence
      </p>
    </div>
  );
}
