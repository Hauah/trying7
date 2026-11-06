// "use client";
// import React from "react";
// import { PageFlip } from "page-flip";
// import { useEffect, useRef, useState } from "react";

// const Book = () => {
//   const bookref = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!bookref.current) return;

//     const pageFlip = new PageFlip(bookref.current, {
//       height: 500,
//       width: 600,
//       showCover: true,
//        maxShadowOpacity: 0.5,
//   drawShadow: true,
//   autoSize: false,

//     });

//     pageFlip.loadFromHTML(bookref.current.querySelectorAll(".book-page"));

//     return () => {
//       pageFlip.destroy();
//     };
//   }, []);
//   return (
//     <div  ref={bookref}>
//       <div

//         className=" bg-amber-50 text-black book-page"
//   data-density="hard"
//   style={{ width: 600, height: 500 }}

//       >
//         first page
//       </div>

//       <div
//         className="book-page bg-amber-50 text-black flex items-center justify-center border"
//         style={{ width: "600px", height: "500px" }}
//       >
//         1
//       </div>

//       <div
//         className="book-page bg-amber-50 text-black flex items-center justify-center border"
//         style={{ width: "600px", height: "500px" }}
//       >
//         2
//       </div>

//       <div
//         className="book-page bg-amber-50  text-black flex items-center justify-center border"
//         style={{ width: "600px", height: "500px" }}
//       >
//         3
//       </div>

//        <div
//         className="book-page bg-amber-50  text-black flex items-center justify-center border"
//         style={{ width: "600px", height: "500px" }}
//       >
//         4
//       </div>

//       <div
//        className="bg-amber-50 text-black book-page"
//   data-density="hard"
//   style={{ width: 600, height: 500 }}
//       >
//         Last page
//       </div>
//     </div>
//   );
// };

// export default Book;

"use client";

import { useEffect, useRef, useState } from "react";
import { PageFlip } from "page-flip";
import Image from "next/image";
import Draggable from "react-draggable";
import DraggableItem from "./DragItem";
import Ambient from "./Ambient";
import SecretNote from "./SecretNote";

// ---- Landscape "PC feel" stage -------------------------------------------
// The whole diary lives on a fixed-size desktop stage (STAGE_W x STAGE_H).
// That stage is scaled to fit any screen, and on a phone held in portrait it
// is also rotated 90deg so the diary always looks horizontal.
const BOOK_W = 800; // two pages of 400
const BOOK_H = 500;
const STAGE_W = 880;
const STAGE_H = 570;
const MAX_SCALE = 1.6;

// Little notes hidden behind the 💌 button. Edit these to your own words!
const SECRET_NOTES = [
  "Some feelings are too big for words, so I keep them here, between these pages.",
  "If you're reading this, you've found my favourite hiding place.",
  "Every page is a little piece of me I wasn't brave enough to say out loud.",
  "Plot twist: you were the best chapter all along. ♡",
  "Psst… turn the page. There's more of me waiting there.",
];

const TAP_EMOJIS = ["✨", "💖", "⭐", "🤍"];

type Layout = {
  scale: number;
  rotated: boolean;
  ready: boolean;
  ew: number; // usable width after rotation (px)
  eh: number; // usable height after rotation (px)
};

type Spark = { id: number; x: number; y: number; e: string; dx: number; dy: number };

// Soft "paper swish" made with the Web Audio API (no sound file needed).
function playPaperSwish(ctxRef: { current: AudioContext | null }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      const ctx: AudioContext = ctxRef.current ?? (ctxRef.current = new Ctx());
      if (ctx.state === "suspended") void ctx.resume();
      const t = ctx.currentTime;
      const dur = 0.38;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 0.8;
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(4200, t + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
    }
  } catch {
    // Audio is a nice-to-have; ignore any failure.
  }
  // Tiny haptic tick on phones that support it (Android).
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
}

export default function Book() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const [layout, setLayout] = useState<Layout>({
    scale: 1,
    rotated: false,
    ready: false,
    ew: 0,
    eh: 0,
  });
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkId = useRef(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteIdx, setNoteIdx] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Mirror of `layout` for use inside the PageFlip pointer patch below.
  const layoutRef = useRef<Layout>(layout);
  layoutRef.current = layout;

  const bookRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasStarted = useRef(false);
  const [lyricIndex, setLyricIndex] = useState(0);
  const [lyricVisible, setLyricVisible] = useState(true);
  // Each line starts at this audio timestamp (seconds). Adjust these to your MP3.
  const lyrics = [
    {text : "ㅤ", at: 0 },
    {text: "I wanna be your", at: 0.1 },
    { text: "Secrets I have held in my heart", at: 3 },
    { text: "Are harder to hide than I thought", at: 7 },
    { text: "Maybe I just wanna be yours", at: 10 },
    { text: "I wanna be yours, I wanna be yours", at: 13 },
    { text: "Wanna be yours, wanna be yours, wanna be yours", at: 19 },
    { text: "Wanna be yours..", at: 29 },
    { text: "Wanna be yours...", at: 33 },
    { text: "Wanna be yours....", at: 37 }
  ];

  // Lyrics follow the audio's currentTime, not a free-running interval.
  const syncLyricsToAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    let nextIndex = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (audio.currentTime >= lyrics[i].at) nextIndex = i;
    }
    setLyricIndex((current) => {
      if (current !== nextIndex) {
        setLyricVisible(false);
        window.setTimeout(() => setLyricVisible(true), 180);
      }
      return nextIndex;
    });
  };

  // Sparkle burst wherever the screen is tapped / clicked.
  const handleTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const { rotated, ew, eh } = layoutRef.current;
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    // Screen point -> position inside the (possibly rotated) world layer.
    const x = rotated ? ew / 2 + dy : ew / 2 + dx;
    const y = rotated ? eh / 2 - dx : eh / 2 + dy;
    const id = ++sparkId.current;
    const fresh: Spark[] = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 + Math.random();
      const d = 34 + Math.random() * 30;
      return {
        id: id * 10 + i,
        x,
        y,
        e: TAP_EMOJIS[(id + i) % TAP_EMOJIS.length],
        dx: Math.cos(a) * d,
        dy: Math.sin(a) * d,
      };
    });
    setSparks((prev) => [...prev.slice(-15), ...fresh]);
    window.setTimeout(
      () => setSparks((prev) => prev.filter((s) => Math.floor(s.id / 10) !== id)),
      950
    );
  };

  // Fit + rotate the stage to the screen.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      if (!vw || !vh) return;
      // Phone/tablet held upright -> turn the diary sideways.
      // Narrow screens OR touch devices (covers "Desktop site" mode, where the
      // reported width is ~980px even on a phone).
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      const rotated = vh > vw && (vw < 768 || isTouch);
      const availW = rotated ? vh : vw;
      const availH = rotated ? vw : vh;
      const scale = Math.min(availW / STAGE_W, availH / STAGE_H, MAX_SCALE);
      setLayout((prev) =>
        prev.ready &&
        prev.rotated === rotated &&
        prev.ew === availW &&
        prev.eh === availH &&
        Math.abs(prev.scale - scale) < 0.001
          ? prev
          : { scale, rotated, ready: true, ew: availW, eh: availH }
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Start music on the first screen tap only; later taps won't pause it.
  useEffect(() => {
    const startMusic = () => {
      if (hasStarted.current || !audioRef.current) return;
      audioRef.current.play().then(() => {
        hasStarted.current = true;
      }).catch(() => {
        // Browser may block playback until another user interaction.
      });
    };
    document.addEventListener("click", startMusic);
    document.addEventListener("touchstart", startMusic, { passive: true });
    return () => {
      document.removeEventListener("click", startMusic);
      document.removeEventListener("touchstart", startMusic);
    };
  }, []);

  useEffect(() => {
    if (!bookRef.current) return;

    const pageFlip = new PageFlip(bookRef.current, {
      width: 400,
      height: 500,
      autoSize: false,
      showCover: true,
      drawShadow: true,
      maxShadowOpacity: 0.5,
      usePortrait: false,
      startPage: 0,
    });

    // const pages = bookRef.current.querySelectorAll(".book-page");
    pageFlip.loadFromHTML(bookRef.current.querySelectorAll(".book-page"));
    pageFlipRef.current = pageFlip;
    setPageCount(pageFlip.getPageCount());
    pageFlip.on("flip", (e: { data: unknown }) => setPage(Number(e.data) || 0));
    pageFlip.on("changeState", (e: { data: unknown }) => {
      if (e.data === "flipping") playPaperSwish(audioCtxRef);
    });

    // PageFlip converts finger/mouse position with getBoundingClientRect(),
    // which is wrong once the book is CSS-scaled or rotated. Replace it with a
    // version that undoes our scale + 90deg rotation so dragging pages still
    // follows the finger exactly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ui: any = (pageFlip as any).getUI?.();
    if (ui && typeof ui.getMousePos === "function") {
      ui.getMousePos = (x: number, y: number) => {
        const el: HTMLElement = ui.distElement ?? bookRef.current;
        const { scale: s, rotated } = layoutRef.current;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const w = el.offsetWidth || BOOK_W;
        const h = el.offsetHeight || BOOK_H;
        return rotated
          ? { x: w / 2 + (y - cy) / s, y: h / 2 - (x - cx) / s }
          : { x: w / 2 + (x - cx) / s, y: h / 2 + (y - cy) / s };
      };
    }

    return () => {
      pageFlipRef.current = null;
      pageFlip.destroy();
    };
  }, []);

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 overflow-hidden bg-black select-none"
      style={{ touchAction: "none" }}
      onPointerDown={handleTap}
    >
      {/* "World": a layer the size of the usable screen, turned sideways on
          portrait phones. Everything (backdrop, book, sparkles) lives in it. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: layout.ew,
          height: layout.eh,
          marginLeft: -layout.ew / 2,
          marginTop: -layout.eh / 2,
          transform: `rotate(${layout.rotated ? 90 : 0}deg)`,
          transformOrigin: "50% 50%",
          visibility: layout.ready ? "visible" : "hidden",
        }}
      >
      <Ambient h={layout.eh} />

      {/* Fixed-size desktop stage, scaled to fit the world */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: STAGE_W,
          height: STAGE_H,
          marginLeft: -STAGE_W / 2,
          marginTop: -STAGE_H / 2,
          transform: `scale(${layout.scale})`,
          transformOrigin: "50% 50%",
        }}
      >
      <div
        style={{
          position: "absolute",
          left: (STAGE_W - BOOK_W) / 2,
          top: 12,
          width: BOOK_W,
          height: BOOK_H,
        }}
      >
      {/* PageFlip container: only scrapbook pages go inside this div */}
      <div
        ref={bookRef}
        className="book-stage"
        style={{ width: BOOK_W, height: BOOK_H }}
      >
      {/* Front Cover */}
      <div
        className="book-page bg-blue-700 text-white"
        data-density="hard"
        style={{ width: 200, height: 700 }}
      >
        <Image
          // src="/frontr.png"
          src="/pages/front.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain scale-130 translate-x-3 pointer-events-none select-none"
        ></Image>

        <div className="flex h-full items-center justify-center text-5xl font-bold"></div>
      </div>

      {/* Page 1 */}
      <div
        className="  book-page bg-amber-50 text-black"
        style={{ width: 600, height: 500 }}
      >
        {/* <div className="flex h-full items-center justify-center text-4xl">
          Page 1
        </div> */}

        <Image
          src="/pages/left.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain  pointer-events-none select-none"
        ></Image>

        <Image
          src="/elements/fwine.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain  -rotate-12  -translate-x-34 -translate-y-33 scale-35   "
        ></Image>

        {/* <Image
      src="/elements/stamp.png"
        alt="Front Cover"
    fill
    priority
    draggable={false}
    className="object-contain  -rotate-12  -translate-x-20 translate-y-30 scale-40   "
        ></Image>  */}

        <Image
          src="/elements/side3.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain   -translate-x-23 -translate-y-14 scale-78   "
        ></Image>

        <Image
          src="/elements/mouse.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain   z-50 translate-x-20 translate-y-46 scale-55   "
        ></Image>

        <Image
          src="/elements/butter.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain scale-45 rotate-30  -translate-x-28 translate-y-32 "
        ></Image>

        <Image
          src="/ref/girl.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain scale-33  rotate-10  translate-x-14 -translate-y-23 "
        ></Image>

        <Image
          src="/elements/frame10.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain scale-65 rotate-10  translate-x-14 -translate-y-20 "
        ></Image>

        <Image
          src="/elements/text1.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain scale-45   translate-x-10 translate-y-15 "
        ></Image>
      </div>

      {/* Page 2 */}
      <div
        className="relative overflow-hidden book-page bg-amber-50 text-black"
        style={{ width: 600, height: 500 }}
      >
        {/* <div className="flex h-full items-center justify-center text-4xl">
          Page 2
        </div> */}
        <Image
          src="/pages/right.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain  pointer-events-none select-none"
        ></Image>

        <Image
          src="/elements/paper.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain rotate-90 shadow-black   translate-x-18 translate-y-38  scale-50   "
        ></Image>

        <Image
          src="/elements/starB.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain shadow-black  -rotate-50 -translate-x-17 translate-y-30  scale-50   "
        ></Image>

        <Image
          src="/ref/girl.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain shadow-black rotate-20  translate-x-19 -translate-y-22  scale-22   "
        ></Image>

        <Image
          src="/ref/girl2.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain shadow-black rotate-20  translate-x-26 -translate-y-43  scale-22   "
        ></Image>

        <Image
          src="/ref/girl3.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain shadow-black rotate-20  translate-x-11 translate-y-1  scale-22   "
        ></Image>

        <Image
          src="/elements/frame9.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain shadow-black rotate-12  translate-x-18 -translate-y-20  scale-80   "
        ></Image>

        <Image
          src="/elements/text2.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain shadow-black rotate-0 -translate-x-13 -translate-y-40  scale-60   "
        ></Image>

        <Image
          src="/elements/kit.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain shadow-black rotate-0 -translate-x-13 -translate-y-16  scale-60   "
        ></Image>
      </div>

      {/* Page 3 */}
      <div
        className="relative overflow-hidden book-page bg-amber-50 text-black"
        style={{ width: 600, height: 500 }}
      >
        {/* <div className="flex h-full items-center justify-center text-4xl">
          Page 3
        </div> */}

        <Image
          src="/pages/left.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain pointer-events-none select-none"
        />

        {/* Lyrics */}
        <Image
          src="/elements/billa6.png"
          alt="Lyrics"
          fill
          priority
          draggable={false}
          className="object-contain scale-55 rotate-1 -translate-x-30 -translate-y-10"
        />

        {/* Wine */}
        <Image
          src="/elements/side1.png"
          alt="Wine"
          fill
          priority
          draggable={false}
          className="object-contain scale-50 rotate-180 -translate-x-26 translate-y-31"
        />

        {/* Tape */}
        <Image
          src="/elements/starem.png"
          alt="Tape"
          fill
          priority
          draggable={false}
          className="object-contain scale-16 -rotate-18 translate-x-18 -translate-y-56 z-20"
        />

        <Image
          src="/ref/girl4.jpg"
          alt="Frame"
          fill
          priority
          draggable={false}
          className="object-contain scale-33 rotate-17 translate-x-13 -translate-y-21 z-30"
        />

        {/* Photo Frame (Main Focus) */}
        <Image
          src="/elements/frame11.png"
          alt="Frame"
          fill
          priority
          draggable={false}
          className="object-contain scale-75 rotate-18 translate-x-10 -translate-y-11 z-30"
        />

        {/* Recorder */}
        <Image
          src="/elements/moon.png"
          alt="Recorder"
          fill
          priority
          draggable={false}
          className="object-contain scale-34 -rotate-14 -translate-x-20 translate-y-30 z-40"
        />

        <Image
          src="/elements/fits.png"
          alt="Recorder"
          fill
          priority
          draggable={false}
          className="object-contain scale-44 -rotate-14 -translate-x-30 -translate-y-50 z-40"
        />

        {/* Vinyl Disk */}
        <Image
          src="/elements/note1.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68 -rotate-7 z-50 translate-x-14 translate-y-38 "
        />

        {/* Old Paper */}
        <Image
          src="/elements/lovetape.png"
          alt="Old Paper"
          fill
          priority
          draggable={false}
          className="object-contain scale-19 rotate-0 z-50 translate-x-10 translate-y-24"
        />
      </div>

      {/* Page 4 */}
      <div
        className="relative overflow-hidden book-page bg-amber-50 text-black"
        style={{ width: 600, height: 500 }}
      >
        <Image
          src="/pages/right.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain pointer-events-none select-none"
        />

        <Image
          src="/elements/side2.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 translate-x-16 translate-y-23 "
        />

        <Image
          src="/elements/billa.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-38  rotate-0 z-50 -translate-x-14 -translate-y-28 "
        />

        <Image
          src="/elements/boqey.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-48  rotate-0 z-50 -translate-x-14 translate-y-28 "
        />

        <Image
          src="/ref/girl5.jpg"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-32  rotate-0 z-50 translate-x-19 -translate-y-32 "
        />

        <Image
          src="/ref/girl1.jpg"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 translate-x-18 -translate-y-28 "
        />

        <Image
          src="/frames/frame5.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 translate-x-18 -translate-y-28 "
        />

        <Image
          src="/elements/miss.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-48  rotate-18 z-50 translate-x-28 translate-y-4 "
        />
      </div>

      {/* Page 5 */}
      <div
        className="relative overflow-hidden book-page bg-amber-50 text-black"
        style={{ width: 600, height: 500 }}
      >
        <Image
          src="/pages/left.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain pointer-events-none select-none"
        />

        <Image
          src="/elements/side4.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 -translate-x-22 translate-y-23 "
        />

        <Image
          src="/elements/disk.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 -translate-x-50 -translate-y-15 "
        />

        <Image
          src="/elements/disk.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 -translate-x-50 -translate-y-15 "
        />

        <Image
          src="/elements/billa5.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 translate-x-19 translate-y-33 "
        />

        <Image
          src="/ref/girl11.jpg"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-26  -rotate-11 z-50 translate-x-4 -translate-y-12 "
        />

        <Image
          src="/ref/girl10.jpg"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-26  rotate-11 z-50 translate-x-16 -translate-y-40 "
        />

        <Image
          src="/elements/frame8.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 translate-x-10 -translate-y-25 "
        />

        <Image
          src="/elements/twoStar.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-38  rotate-0 z-50 -translate-x-14 translate-y-20 "
        />

        <Image
          src="/elements/text3.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-48  rotate-0 z-50 -translate-x-22 -translate-y-48 "
        />
      </div>

      {/* Page 6 */}
      <div
        className="relative overflow-hidden book-page bg-amber-50 text-black"
        style={{ width: 600, height: 500 }}
      >
        <Image
          src="/pages/right.jpg"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain pointer-events-none select-none"
        />

        <Image
          src="/elements/side5.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-78  rotate-0 z-50 translate-x-22 translate-y-14 "
        />

        <Image
          src="/elements/text4.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-58  rotate-0 z-50 -translate-x-6 -translate-y-40 "
        />


          <Image
          src="/ref/girl9.jpg"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-28  -rotate-4 z-50 -translate-x-18 -translate-y-16 "
        />
        
          <Image
          src="/ref/girl8.jpg"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-27  rotate-10 z-50 -translate-x-11 translate-y-13 "
        />

        <Image
          src="/elements/frame7.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-68  rotate-0 z-50 -translate-x-14 translate-y-1 "
        />

        <Image
          src="/elements/billa4.png"
          alt="Disk"
          fill
          priority
          draggable={false}
          className="object-contain scale-58  rotate-0 z-50 -translate-x-17 translate-y-40 "
        />
      </div>

      {/* Back Cover */}
      <div
        className="relative overflow-hidden book-page bg-blue-700 text-white"
        data-density="hard"
        style={{ width: 600, height: 500 }}
      >
        {/* <div className="flex h-full items-center justify-center text-5xl font-bold">
          Back Cover
        </div> */}
          <Image
          // src="/frontr.png"
          src="/pages/back.png"
          alt="Front Cover"
          fill
          priority
          draggable={false}
          className="object-contain scale-130 translate-x-3 pointer-events-none select-none"
        ></Image>
      </div>
      </div> {/* Close PageFlip book-stage BEFORE audio and lyrics */}

      {/* Cover hint: disappears after the first page turn */}
      {page === 0 && (
        <div
          className="hint-pulse pointer-events-none absolute bottom-5 right-0 z-30 text-center text-sm tracking-widest text-white"
          style={{ width: BOOK_W / 2, textShadow: "0 0 8px #ff4fa3, 0 1px 3px rgba(0,0,0,.9)" }}
        >
          ✨ tap ›  or drag the corner ✨
        </div>
      )}
      </div>

      {/* Tap arrows: easy page turning on touch screens */}
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => pageFlipRef.current?.flipPrev()}
        className="absolute left-1 top-1/2 -translate-y-1/2 px-2 py-6 text-4xl leading-none text-white/40 active:text-white/90"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next page"
        onClick={() => pageFlipRef.current?.flipNext()}
        className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-6 text-4xl leading-none text-white/40 active:text-white/90"
      >
        ›
      </button>

      {/* Secret notes: tap the envelope for a little surprise */}
      <button
        type="button"
        aria-label="Open a secret note"
        onClick={() => setNoteOpen(true)}
        className="env-wiggle absolute right-1 top-1 z-[50] text-3xl leading-none"
      >
        💌
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-pink-500" />
      </button>

      {/* Page counter */}
      {pageCount > 0 && (
        <p className="pointer-events-none absolute bottom-3 left-4 text-xs tracking-widest text-white/50">
          {Math.min(page + 1, pageCount)} / {pageCount}
        </p>
      )}

      {/* Hidden music: starts on first tap anywhere; no pause controls */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        src="/songs/i-wanna-be-yours.mp3"
        onTimeUpdate={syncLyricsToAudio}
      />

      {/* Floating lyrics — no card/box or song title; animated lyric only */}
      <div className="absolute bottom-2 left-0 right-0 z-[9999] px-5 text-center pointer-events-none">
        <p
          key={lyricIndex}
          aria-live="polite"
          className={`mx-auto max-w-3xl text-2xl font-semibold italic tracking-wide text-white transition-all duration-700 ease-out ${
            lyricVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-3 scale-95 opacity-0"
          }`}
          style={{
            textShadow: "0 0 8px #ff4fa3, 0 0 18px #ff4fa3, 0 2px 5px rgba(0,0,0,.8)",
            WebkitTextStroke: "0.25px rgba(255,255,255,.35)",
          }}
        >
          {lyrics[lyricIndex].text}
        </p>
      </div>

      {noteOpen && (
        <SecretNote
          key={noteIdx}
          text={SECRET_NOTES[noteIdx]}
          onClose={() => {
            setNoteOpen(false);
            setNoteIdx((i) => (i + 1) % SECRET_NOTES.length);
          }}
        />
      )}
      </div>

      {/* Tap sparkles */}
      {sparks.map((sp) => (
        <span
          key={sp.id}
          className="tap-pop pointer-events-none absolute z-[20000] text-xl"
          style={
            {
              left: sp.x,
              top: sp.y,
              "--dx": `${sp.dx}px`,
              "--dy": `${sp.dy}px`,
            } as React.CSSProperties
          }
        >
          {sp.e}
        </span>
      ))}
      </div>
    </div>
  );
}
