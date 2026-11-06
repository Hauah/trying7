"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { POOLS, SCRAPS, STICKER_SIZES, stickerSrc, type StickerKind } from "./stickers";

export type PagePhoto = { src: string; caption?: string };

// Fully manual sticker (use when you want exact control).
// top/left = % of the page, w/h = px, rot = degrees.
export type PageSticker = {
  src: string;
  top: number;
  left: number;
  w: number;
  h?: number;
  rot?: number;
  z?: number;
};

export type PageConfig = {
  photos: PagePhoto[];
  title?: string;
  /** Sticker ids (from public/stickers) for the decor slots, in order. Missing ones are picked automatically. */
  decor?: string[];
  /** Torn-paper corner pieces: ids like "side1" (top) / "side2" (bottom). Pass {} for none. */
  corners?: { top?: string; bottom?: string };
  /** Manual stickers: replaces the automatic decor completely. */
  stickers?: PageSticker[];
};
export type SpreadConfig = { left: PageConfig; right: PageConfig };

// Photo slots for a RIGHT page: [left %, top %, width %, rotation deg].
// Left pages are mirrored so nothing sits on the spiral.
const PHOTO_SLOTS: Record<number, [number, number, number, number][]> = {
  1: [[20, 25, 44, -4]],
  2: [
    [14, 10, 38, -5],
    [46, 48, 38, 4],
  ],
  3: [
    [12, 6, 34, -5],
    [48, 24, 34, 4],
    [16, 54, 34, -3],
  ],
};

type Slot = { kind: StickerKind; top: number; left: number; w: number; h: number; rot: number };

// Where cute stickers go around the photos (RIGHT page coordinates).
const DECOR_SLOTS: Record<number, Slot[]> = {
  1: [
    { kind: "small", top: 3, left: 11, w: 72, h: 72, rot: -8 },
    { kind: "wide", top: 4, left: 36, w: 104, h: 38, rot: -3 },
    { kind: "tall", top: 28, left: 67, w: 62, h: 92, rot: 6 },
    { kind: "tiny", top: 51, left: 11, w: 34, h: 34, rot: -10 },
    { kind: "big", top: 73, left: 11, w: 100, h: 100, rot: -5 },
    { kind: "big", top: 75, left: 41, w: 88, h: 88, rot: 5 },
    { kind: "small", top: 61, left: 62, w: 62, h: 62, rot: 12 },
  ],
  2: [
    { kind: "small", top: 2, left: 56, w: 74, h: 74, rot: -6 },
    { kind: "tall", top: 22, left: 64, w: 60, h: 88, rot: 6 },
    { kind: "wide", top: 56, left: 10, w: 112, h: 38, rot: -3 },
    { kind: "big", top: 67, left: 9, w: 104, h: 104, rot: -5 },
    { kind: "tiny", top: 2, left: 12, w: 38, h: 38, rot: -10 },
    { kind: "small", top: 84, left: 76, w: 66, h: 66, rot: 10 },
    { kind: "tiny", top: 44, left: 84, w: 40, h: 40, rot: 12 },
  ],
  3: [
    { kind: "wide", top: 3, left: 52, w: 100, h: 36, rot: 3 },
    { kind: "small", top: 12, left: 76, w: 66, h: 66, rot: 8 },
    { kind: "tiny", top: 30, left: 85, w: 40, h: 40, rot: -8 },
    { kind: "wide", top: 45, left: 12, w: 108, h: 38, rot: -3 },
    { kind: "big", top: 66, left: 54, w: 98, h: 98, rot: 5 },
    { kind: "small", top: 72, left: 80, w: 62, h: 62, rot: -6 },
    { kind: "tiny", top: 90, left: 56, w: 40, h: 40, rot: 10 },
  ],
};

const HAND_FONT = '"Segoe Script","Bradley Hand","Comic Sans MS",cursive';
const PAGE_W = 400; // px width of one page

/** One diary page with polaroid photos + cute stickers. Must stay a direct child of the book. */
export default function PhotoPage({
  side,
  seed = 0,
  photos,
  title,
  decor = [],
  corners,
  stickers,
}: PageConfig & { side: "left" | "right"; seed?: number }) {
  const count = Math.min(Math.max(photos.length, 1), 3);
  const mirror = side === "left";
  const photoSlots = PHOTO_SLOTS[count];

  // Torn-paper corner pieces (default: one at the top + one at the bottom on single-photo pages).
  const cornerIds =
    corners ?? (count === 1 ? { top: ["side1", "paper", "side3"][seed % 3], bottom: "side2" } : {});

  // Decide which sticker goes in each slot.
  const used: Record<string, number> = {};
  const decorItems = (stickers ? [] : DECOR_SLOTS[count]).map((slot, i) => {
    const n = (used[slot.kind] = (used[slot.kind] ?? -1) + 1);
    const pool = POOLS[slot.kind];
    const id = decor[i] ?? pool[(seed * 2 + n) % pool.length];
    return { slot, id };
  });

  const renderSticker = (
    key: string,
    src: string,
    top: number,
    left: number,
    w: number,
    h: number,
    rot: number,
    z: number
  ) => (
    <div
      key={key}
      className="pointer-events-none absolute"
      style={{ top: `${top}%`, left: `${left}%`, width: w, height: h, zIndex: z, transform: `rotate(${rot}deg)` }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="160px"
        loading="eager"
        draggable={false}
        className="object-contain select-none"
      />
    </div>
  );

  return (
    <div
      className="relative overflow-hidden book-page bg-amber-50 text-black"
      style={{ width: 600, height: 500 }}
    >
      <Image
        src={mirror ? "/pages/left.jpg" : "/pages/right.jpg"}
        alt=""
        fill
        priority
        draggable={false}
        className="object-contain pointer-events-none select-none"
      />

      {/* torn-paper corners (behind everything else) */}
      {(["top", "bottom"] as const).map((pos) => {
        const id = cornerIds[pos];
        const info = id ? SCRAPS[id] : undefined;
        if (!id || !info) return null;
        const [iw, ih] = STICKER_SIZES[id];
        const outerRight = !mirror;
        const naturalRight = info.corner === "BR";
        const flip = outerRight !== naturalRight;
        const style: CSSProperties = {
          width: info.w,
          height: (info.w * ih) / iw,
          zIndex: 5,
          transform: flip ? "scaleX(-1)" : undefined,
        };
        if (pos === "top") style.top = 0;
        else style.bottom = 0;
        if (outerRight) style.right = 0;
        else style.left = 0;
        return (
          <div key={`corner-${pos}`} className="pointer-events-none absolute" style={style}>
            <Image
              src={stickerSrc(id)}
              alt=""
              fill
              sizes="130px"
              loading="eager"
              draggable={false}
              className="object-contain select-none"
            />
          </div>
        );
      })}

      {/* manual stickers */}
      {stickers?.map((st, i) =>
        renderSticker(`m${i}`, st.src, st.top, st.left, st.w, st.h ?? st.w, st.rot ?? 0, st.z ?? 30)
      )}

      {/* automatic / chosen decor stickers */}
      {decorItems.map(({ slot, id }, i) => {
        const left = mirror ? 100 - slot.left - (slot.w / PAGE_W) * 100 : slot.left;
        return renderSticker(`d${i}`, stickerSrc(id), slot.top, left, slot.w, slot.h, mirror ? -slot.rot : slot.rot, i === 6 ? 30 : 25);
      })}

      {/* photos */}
      {photos.slice(0, 3).map((photo, i) => {
        const [x, top, w, rot] = photoSlots[i];
        const left = mirror ? 100 - x - w : x;
        return (
          <figure
            key={photo.src}
            className="absolute z-20 bg-white p-1.5 pb-7 shadow-lg"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${w}%`,
              transform: `rotate(${mirror ? -rot : rot}deg)`,
            }}
          >
            <span className="absolute -top-2 left-1/2 h-3.5 w-10 -translate-x-1/2 -rotate-3 bg-pink-200/80" />
            <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
              <Image
                src={photo.src}
                alt={photo.caption ?? ""}
                fill
                sizes="180px"
                loading="eager"
                draggable={false}
                className="object-cover pointer-events-none select-none"
              />
            </div>
            {photo.caption && (
              <figcaption
                className="absolute inset-x-1 bottom-1 truncate text-center text-[10px] text-stone-600"
                style={{ fontFamily: HAND_FONT }}
              >
                {photo.caption}
              </figcaption>
            )}
          </figure>
        );
      })}

      {/* optional handwritten title strip */}
      {title && (
        <p
          className="absolute bottom-3 left-1/2 z-40 -translate-x-1/2 -rotate-2 whitespace-nowrap bg-[#f5d9b0] px-3 py-1 text-sm text-stone-700 shadow"
          style={{ fontFamily: HAND_FONT }}
        >
          {title}
        </p>
      )}
    </div>
  );
}
