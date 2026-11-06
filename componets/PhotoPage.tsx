"use client";

import Image from "next/image";

export type PagePhoto = { src: string; caption?: string };
export type PageConfig = { photos: PagePhoto[]; title?: string };
export type SpreadConfig = { left: PageConfig; right: PageConfig };

// Photo slots for a RIGHT page: [left %, top %, width %, rotation deg].
// (Left pages are mirrored automatically so nothing sits on the spiral.)
const LAYOUTS: Record<number, [number, number, number, number][]> = {
  1: [[17, 11, 62, -3]],
  2: [
    [14, 6, 44, -5],
    [40, 46, 44, 4],
  ],
  3: [
    [12, 5, 38, -5],
    [46, 25, 38, 4],
    [14, 54, 38, -3],
  ],
};

// Cute stickers that already exist in /public/elements. [file, top %, left %, size px, rotate]
const STICKERS: [string, number, number, number, number][] = [
  ["/elements/twoStar.png", 3, 76, 54, 8],
  ["/elements/moon.png", 78, 70, 50, -8],
  ["/elements/starem.png", 82, 14, 46, 10],
];

const HAND_FONT = '"Segoe Script","Bradley Hand","Comic Sans MS",cursive';

/** One diary page with polaroid-style photos. Must stay a direct child of the book. */
export default function PhotoPage({
  side,
  photos,
  title,
}: PageConfig & { side: "left" | "right" }) {
  const slots = LAYOUTS[Math.min(Math.max(photos.length, 1), 3)];
  const mirror = side === "left";

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

      {/* stickers */}
      {STICKERS.map(([src, top, left, size, rot], i) => (
        <div
          key={src}
          className="pointer-events-none absolute z-10"
          style={{
            top: `${top}%`,
            left: `${mirror ? 100 - left - 10 : left}%`,
            width: size,
            height: size,
            transform: `rotate(${mirror ? -rot : rot}deg)`,
            opacity: i === 0 || photos.length < 3 ? 1 : 0,
          }}
        >
          <Image
            src={src}
            alt=""
            width={size}
            height={size}
            draggable={false}
            className="h-full w-full object-contain select-none"
          />
        </div>
      ))}

      {/* photos */}
      {photos.slice(0, 3).map((photo, i) => {
        const [x, top, w, rot] = slots[i];
        const left = mirror ? 100 - x - w : x;
        return (
          <figure
            key={photo.src}
            className="absolute z-20 bg-white p-2 pb-8 shadow-lg"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${w}%`,
              transform: `rotate(${mirror ? -rot : rot}deg)`,
            }}
          >
            <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 bg-pink-200/80" />
            <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
              <Image
                src={photo.src}
                alt={photo.caption ?? ""}
                fill
                sizes="240px"
                loading="eager"
                draggable={false}
                className="object-cover pointer-events-none select-none"
              />
            </div>
            {photo.caption && (
              <figcaption
                className="absolute inset-x-1 bottom-1.5 truncate text-center text-[11px] text-stone-600"
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
          className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 -rotate-2 whitespace-nowrap bg-[#f5d9b0] px-3 py-1 text-sm text-stone-700 shadow"
          style={{ fontFamily: HAND_FONT }}
        >
          {title}
        </p>
      )}
    </div>
  );
}
