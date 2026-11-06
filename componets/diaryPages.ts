// ─────────────────────────────────────────────────────────────────────────
//  ADD YOUR PHOTO PAGES HERE
//
//  1. Put your photos in  public/photos/   (e.g. public/photos/trip1.jpg)
//  2. Add a new { left, right } block below. Each block = one open spread
//     (a left page + a right page), so pages are always added in pairs.
//  3. Each page can hold 1, 2 or 3 photos. `caption`, `title` and
//     `stickers` are optional.
//
//  Photos are referenced like:  "/photos/trip1.jpg"
//  Stickers come from public/elements, e.g. "/elements/ted.png".
//  Sticker position: top/left = % of the page, w/h = size in px, rot = degrees.
//  Tip: avoid special characters like # or spaces in photo file names.
// ─────────────────────────────────────────────────────────────────────────
import type { SpreadConfig } from "./PhotoPage";

export const PHOTO_SPREADS: SpreadConfig[] = [
  {
    // LEFT page (spiral on the right edge)
    left: {
      photos: [{ src: "/ref/girl6.jpg", caption: "one of my favourite days" }],
      stickers: [
        { src: "/elements/butter.png", top: 2, left: 3, w: 84, rot: -10 },
        { src: "/elements/stamp.png", top: 2, left: 70, w: 56, rot: 10 },
        { src: "/elements/mine.png", top: 42, left: 1, w: 74, rot: -8 },
        { src: "/elements/start.png", top: 57, left: 74, w: 60, rot: 6 },
        { src: "/elements/ted.png", top: 74, left: 4, w: 110, rot: -6 },
        { src: "/elements/recorder.png", top: 76, left: 52, w: 110, rot: 6 },
      ],
    },
    // RIGHT page (spiral on the left edge)
    right: {
      photos: [{ src: "/photos/memory1.jpg", caption: "a memory I keep" }],
      stickers: [
        { src: "/elements/starem.png", top: 2, left: 14, w: 46, rot: -10 },
        { src: "/elements/rabbit.png", top: 0, left: 74, w: 74, h: 96, rot: 12 },
        { src: "/elements/lovey.png", top: 30, left: 82, w: 56, h: 100, rot: 4 },
        { src: "/elements/peng.png", top: 75, left: 14, w: 100, rot: -4 },
        { src: "/elements/cutold.png", top: 72, left: 60, w: 110, rot: 6 },
      ],
    },
  },
];
