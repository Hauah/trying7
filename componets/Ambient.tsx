"use client";

import { useMemo } from "react";

// Tiny seeded random so server and client render the exact same stars/hearts.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLORS = ["#ff7ac0", "#ffc2e2", "#c9a7ff", "#ffffff"];
const GLYPHS = ["♡", "♥", "✦", "✧"];

/**
 * Dreamy backdrop behind the diary: a soft pink glow, twinkling stars and
 * slowly rising hearts. Purely decorative (no pointer events).
 * `h` = height of the area in px, used for how far the hearts float.
 */
export default function Ambient({ h }: { h: number }) {
  const { stars, hearts } = useMemo(() => {
    const r = rng(7);
    const stars = Array.from({ length: 36 }, () => ({
      left: r() * 100,
      top: r() * 100,
      size: 2 + r() * 3,
      delay: r() * 5,
      dur: 2.5 + r() * 3,
    }));
    const hearts = Array.from({ length: 14 }, (_, i) => ({
      left: r() * 100,
      size: 12 + r() * 16,
      delay: r() * 14,
      dur: 9 + r() * 8,
      sway: (r() - 0.5) * 80,
      glyph: GLYPHS[i % GLYPHS.length],
      color: COLORS[i % COLORS.length],
    }));
    return { stars, hearts };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="amb-glow absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 48%, rgba(255,79,163,.22), rgba(120,60,200,.12) 42%, transparent 72%)",
        }}
      />
      {stars.map((s, i) => (
        <span
          key={`s${i}`}
          className="amb-star absolute rounded-full bg-white"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              "--dur": `${s.dur}s`,
              "--delay": `${s.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
      {hearts.map((p, i) => (
        <span
          key={`h${i}`}
          className="amb-heart absolute"
          style={
            {
              left: `${p.left}%`,
              bottom: -30,
              fontSize: p.size,
              color: p.color,
              textShadow: `0 0 8px ${p.color}`,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--sway": `${p.sway}px`,
              "--rise": `${h + 80}px`,
            } as React.CSSProperties
          }
        >
          {p.glyph}
        </span>
      ))}
    </div>
  );
}
