"use client";

import { useCallback, useEffect, useState } from "react";
import { modeLabel, ROOM_TYPES, RoomKey } from "@/lib/config";
import {
  getTracked,
  removeTracked,
  TRACKED_EVENT,
  TrackedRender,
  updateTracked,
} from "@/lib/renderTracker";

function roomLabel(k: string) {
  return ROOM_TYPES[k as RoomKey] ?? k;
}

/**
 * Global background-progress widget (bottom-left). Present on every page, it
 * polls the status of tracked renders and lets the user jump back to review a
 * finished image — so furnishing keeps running and stays visible even after
 * leaving the staging workspace.
 */
export default function RenderTracker() {
  const [items, setItems] = useState<TrackedRender[]>([]);

  const sync = useCallback(() => setItems(getTracked()), []);

  useEffect(() => {
    sync();
    window.addEventListener(TRACKED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TRACKED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  // Poll while anything is still processing.
  useEffect(() => {
    const processing = items.filter((i) => i.status === "processing");
    if (processing.length === 0) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const ids = processing.map((p) => p.id).join(",");
        const res = await fetch(`/api/renders/status?ids=${encodeURIComponent(ids)}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          renders: { id: string; status: TrackedRender["status"]; error?: string | null }[];
        };
        if (cancelled) return;
        for (const r of data.renders) {
          if (r.status !== "processing") updateTracked(r.id, { status: r.status, error: r.error });
        }
      } catch {
        /* transient — try again next tick */
      }
    };

    const t = setInterval(poll, 3000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] w-[min(92vw,340px)] space-y-2">
      {items
        .slice()
        .sort((a, b) => b.startedAt - a.startedAt)
        .map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-ink bg-paper px-4 py-3 text-sm shadow-[4px_4px_0_0_#1c1917]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {item.status === "processing" && (
                  <p className="flex items-center gap-2 font-medium">
                    <span className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-line border-t-ink" />
                    Working on your image…
                  </p>
                )}
                {item.status === "done" && (
                  <p className="font-medium text-accent">Ready to review</p>
                )}
                {item.status === "failed" && <p className="font-medium">Render failed</p>}
                {item.status === "processing" && (
                  <p className="mt-0.5 text-muted">
                    Takes 1&ndash;2 minutes. We&rsquo;ll notify you when it&rsquo;s done.
                  </p>
                )}
                <p className="mt-0.5 truncate text-muted">
                  {roomLabel(item.roomType)} · {modeLabel(item.style)}
                </p>
                {item.status === "failed" && item.error && (
                  <p className="mt-0.5 text-xs text-muted">{item.error}</p>
                )}
              </div>
              <button
                onClick={() => removeTracked(item.id)}
                aria-label="Dismiss"
                className="shrink-0 text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            {item.status === "done" && (
              // Full navigation (not client nav) so /stage always re-reads the
              // ?review= param and opens the compare view for this render.
              <a
                href={`/stage?job=${item.jobId}&review=${item.id}`}
                onClick={() => removeTracked(item.id)}
                className="mt-2 block rounded-xl border border-ink bg-ink px-4 py-2 text-center text-paper transition-colors hover:bg-transparent hover:text-ink"
              >
                Review image →
              </a>
            )}
            {item.status === "failed" && (
              <a
                href={`/stage?job=${item.jobId}`}
                onClick={() => removeTracked(item.id)}
                className="mt-2 block rounded-xl border border-line px-4 py-2 text-center text-muted transition-colors hover:border-ink hover:text-ink"
              >
                Back to listing
              </a>
            )}
          </div>
        ))}
    </div>
  );
}
