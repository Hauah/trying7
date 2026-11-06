// ─────────────────────────────────────────────────────────────────────────
//  ADD YOUR PHOTO PAGES HERE
//
//  1. Put your photos in  public/photos/   (e.g. public/photos/trip1.jpg)
//  2. Add a new { left, right } block below. Each block = one open spread
//     (a left page + a right page), so pages are always added in pairs.
//  3. Each page holds 1, 2 or 3 photos. Cute stickers are added around them
//     automatically. Optional extras per page:
//       caption (on a photo), title, decor: ["ted", "billa", ...],
//       corners: { top: "side1", bottom: "side2" }
//
//  Photos:   "/photos/trip1.jpg"
//  Stickers: ids from public/stickers, e.g. "ted", "billa6", "peng", "kit",
//            "rabbit", "mouse", "butter", "lovetape", "start", "starem" ...
//  Tip: avoid special characters like # or spaces in photo file names.
// ─────────────────────────────────────────────────────────────────────────
import type { SpreadConfig } from "./PhotoPage";

export const PHOTO_SPREADS: SpreadConfig[] = [
  {
    // LEFT page (spiral on the right edge)
    left: {
      photos: [{ src: "/ref/girl6.jpg", caption: "one of my favourite days" }],
      decor: ["butter", "lovetape", "lovey", "starem", "ted", "billa6", "stamp"],
      corners: { top: "side1", bottom: "side2" },
    },
    // RIGHT page (spiral on the left edge)
    right: {
      photos: [{ src: "/photos/memory1.jpg", caption: "a memory I keep" }],
      decor: ["fits", "start", "fwine", "twoStar", "peng", "billa5", "kit"],
      corners: { top: "paper", bottom: "side2" },
    },
  },
];
