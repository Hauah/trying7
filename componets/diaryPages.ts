// ─────────────────────────────────────────────────────────────────────────
//  ADD YOUR PHOTO PAGES HERE
//
//  1. Put your photos in  public/photos/   (e.g. public/photos/trip1.jpg)
//  2. Add a new { left, right } block below. Each block = one open spread
//     (a left page + a right page), so pages are always added in pairs.
//  3. Each page can hold 1, 2 or 3 photos. `caption` and `title` are optional.
//
//  Photos are referenced like:  "/photos/trip1.jpg"
//  Tip: avoid special characters like # or spaces in photo file names.
// ─────────────────────────────────────────────────────────────────────────
import type { SpreadConfig } from "./PhotoPage";

export const PHOTO_SPREADS: SpreadConfig[] = [
  {
    // Uses the photos that weren't used anywhere else. Swap them any time!
    left: {
      title: "little moments",
      photos: [
        { src: "/ref/girl6.jpg", caption: "one of my favourite days" },
        { src: "/photos/memory1.jpg", caption: "a memory I keep" },
      ],
    },
    right: {
      photos: [{ src: "/ref/girl7.jpg", caption: "just me being me ♡" }],
    },
  },
];
