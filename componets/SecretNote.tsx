"use client";

import { useEffect, useState } from "react";

/** A little handwritten-style note that types itself out. Tap to close. */
export default function SecretNote({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let n = 0;
    setShown(0);
    const id = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= text.length) window.clearInterval(id);
    }, 38);
    return () => window.clearInterval(id);
  }, [text]);

  return (
    <div
      role="dialog"
      aria-label="Secret note"
      onClick={onClose}
      className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/60"
    >
      <div
        className="note-in relative w-[440px] px-9 pb-6 pt-10 text-stone-700 shadow-2xl"
        style={{
          background: "#fff8e7",
          backgroundImage:
            "repeating-linear-gradient(transparent 0 31px, rgba(200,150,160,.35) 31px 32px)",
          backgroundPosition: "0 6px",
        }}
      >
        <span className="absolute -top-3 left-6 h-6 w-20 -rotate-6 bg-pink-300/70" />
        <span className="absolute -top-3 right-6 h-6 w-20 rotate-6 bg-pink-300/70" />
        <p className="min-h-[128px] font-serif text-2xl italic leading-8">
          {text.slice(0, shown)}
          <span className="note-caret">|</span>
        </p>
        <p className="mt-4 text-right text-xs tracking-widest text-stone-400">
          tap anywhere to close ♡
        </p>
      </div>
    </div>
  );
}
