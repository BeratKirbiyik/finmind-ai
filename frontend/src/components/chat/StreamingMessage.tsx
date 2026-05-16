"use client";
import React, { useEffect, useRef, useState } from "react";

interface StreamingMessageProps {
  content: string;
  onComplete?: () => void;
}

// Bir satırdaki **bold** ve normal metin parçalarını parse et
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// Tam içeriği satır/blok yapısına dönüştür
function parseContent(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      // Boş satır → küçük boşluk
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Madde işareti: - veya •
    if (/^[-•]\s/.test(trimmed)) {
      nodes.push(
        <div key={key++} className="flex gap-2 leading-relaxed">
          <span className="text-[#f59e0b] shrink-0 mt-0.5">•</span>
          <span>{parseInline(trimmed.replace(/^[-•]\s/, ""))}</span>
        </div>
      );
      continue;
    }

    // Numaralı liste: 1. 2. vb.
    const numMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      nodes.push(
        <div key={key++} className="flex gap-2 leading-relaxed">
          <span className="text-[#f59e0b] shrink-0 font-mono text-xs mt-0.5">{numMatch[1]}.</span>
          <span>{parseInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // emoji ile başlayan başlık satırı (kod noktası > 127 ile yakala)
    const firstCode = trimmed.codePointAt(0) ?? 0;
    if (firstCode > 127) {
      nodes.push(
        <p key={key++} className="font-semibold text-white leading-relaxed mt-1">
          {parseInline(trimmed)}
        </p>
      );
      continue;
    }

    // Normal paragraf
    nodes.push(
      <p key={key++} className="leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
  }

  return nodes;
}

export default function StreamingMessage({ content, onComplete }: StreamingMessageProps) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    setVisible(false);
    setDone(false);

    const t = setTimeout(() => {
      setVisible(true);
      const t2 = setTimeout(() => {
        setDone(true);
        onComplete?.();
      }, reduced.current ? 0 : 200);
      return () => clearTimeout(t2);
    }, 30);

    return () => clearTimeout(t);
  }, [content]);

  return (
    <div
      className="space-y-1 text-sm text-[#d0d0e0]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
        transition: reduced.current ? "none" : "opacity 200ms ease, transform 200ms ease",
      }}
    >
      {parseContent(content)}
      {!done && (
        <span
          className="inline-block w-0.5 h-[1em] bg-[#f59e0b] ml-0.5 align-middle"
          style={{ animation: "caret-blink 800ms steps(1) infinite" }}
        />
      )}
    </div>
  );
}
