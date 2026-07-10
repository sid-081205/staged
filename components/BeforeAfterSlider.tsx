"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Gently sweeps the divider until the user first interacts. */
  autoplay?: boolean;
  className?: string;
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Empty",
  afterLabel = "Staged",
  autoplay = false,
  className = "",
}: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const interacted = useRef(false);

  useEffect(() => {
    if (!autoplay) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      if (interacted.current) return;
      setPos(50 + 32 * Math.sin((t - start) / 1600));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoplay]);

  const update = useCallback((clientX: number) => {
    interacted.current = true;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      ref={ref}
      className={`relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden rounded-2xl border border-line ${className}`}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Staged room" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt="Empty room"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgba(28,25,23,0.2)]" />
        <div className="absolute top-1/2 -ml-4 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper text-xs text-ink shadow-sm">
          ↔
        </div>
      </div>

      <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-paper">
        {beforeLabel}
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-paper">
        {afterLabel}
      </span>
    </div>
  );
}
