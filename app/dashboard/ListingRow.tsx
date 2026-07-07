"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ListingRow({
  id,
  name,
  createdAt,
  photoCount,
  renderCount,
  firstPhotoId,
}: {
  id: string;
  name: string | null;
  createdAt: number;
  photoCount: number;
  renderCount: number;
  firstPhotoId: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const title = name && name.trim().length > 0 ? name : `Listing · ${dateLabel}`;

  async function saveName() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      if (!res.ok) throw new Error("Could not rename.");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not rename.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${title}"? This permanently removes its photos and renders.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-6 px-5 py-5 first:rounded-t-2xl last:rounded-b-2xl">
      <Link href={`/stage?job=${id}`} className="shrink-0">
        {firstPhotoId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/image/${firstPhotoId}?kind=original`}
            alt=""
            className="h-20 w-28 rounded-xl border border-line object-cover"
          />
        ) : (
          <div className="flex h-20 w-28 items-center justify-center rounded-xl border border-line text-xs text-muted">
            No photos
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={value}
              autoFocus
              maxLength={80}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setEditing(false);
                  setValue(name ?? "");
                }
              }}
              placeholder="e.g. 12 Oak St — unit 4"
              className="w-full max-w-xs rounded-lg border border-line bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink"
            />
            <button
              onClick={saveName}
              disabled={busy}
              className="rounded-lg border border-ink bg-ink px-3 py-1.5 text-xs text-paper hover:bg-transparent hover:text-ink disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setValue(name ?? "");
              }}
              className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Link href={`/stage?job=${id}`} className="block">
            <p className="truncate font-medium hover:underline">{title}</p>
          </Link>
        )}
        <p className="mt-1 text-sm text-muted">
          {photoCount} photo{photoCount === 1 ? "" : "s"} · {renderCount} render
          {renderCount === 1 ? "" : "s"}
        </p>
        {error && <p className="mt-1 text-xs text-ink">{error}</p>}
      </div>

      {!editing && (
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <button
            onClick={() => setEditing(true)}
            disabled={busy}
            className="text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
          >
            Rename
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
          >
            Delete
          </button>
          <Link href={`/stage?job=${id}`} className="text-muted hover:text-ink">
            Open →
          </Link>
        </div>
      )}
    </div>
  );
}
