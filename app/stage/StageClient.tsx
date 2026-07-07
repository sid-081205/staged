"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import {
  FREE_PREVIEWS,
  MAX_PHOTOS,
  PACK_CREDITS,
  PACK_LABEL,
  ROOM_TYPES,
  STYLES,
  RoomKey,
  StyleKey,
} from "@/lib/config";

interface RenderInfo {
  id: string;
  photoId: string;
  style: string;
  roomType: string;
  status: string;
  error?: string | null;
  paid: boolean;
}

interface JobState {
  id: string;
  photos: { id: string }[];
  renders: RenderInfo[];
}

interface Me {
  email: string;
  credits: number;
  freeLeft: number;
}

const JOB_KEY = "staged:job";
const IS_TEST_MODE = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").startsWith("pk_test");

export default function StageClient() {
  const [job, setJob] = useState<JobState | null>(null);
  const [user, setUser] = useState<Me | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [withLabel, setWithLabel] = useState(false);
  const [busyPhotos, setBusyPhotos] = useState<Record<string, boolean>>({});
  const [checkingOut, setCheckingOut] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(message: string) {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 8000);
  }

  const refreshUser = useCallback(async () => {
    try {
      const d = await fetch("/api/auth/me").then((r) => r.json());
      setUser(d.user);
      return d.user as Me | null;
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/jobs/${jobId}`);
    if (res.ok) {
      const state = (await res.json()) as JobState;
      setJob(state);
      localStorage.setItem(JOB_KEY, state.id);
      return state;
    }
    localStorage.removeItem(JOB_KEY);
    return null;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const urlJob = params.get("job");
    const storedJob = localStorage.getItem(JOB_KEY);
    const jobId = urlJob || storedJob;

    (async () => {
      if (sessionId) {
        try {
          const res = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
          const data = await res.json();
          if (data.paid) setJustPurchased(true);
        } catch {
          /* verified again by webhook or next visit */
        }
        window.history.replaceState({}, "", jobId ? `/stage?job=${jobId}` : "/stage");
      }
      await refreshUser();
      if (jobId) await refresh(jobId);
    })();
  }, [refresh, refreshUser]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || f.name.match(/\.(heic|heif)$/i));
    if (list.length === 0) {
      showError("Those files don't look like images. JPG, PNG or HEIC work.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      if (job) form.set("jobId", job.id);
      for (const f of list) form.append("photos", f);
      const res = await fetch("/api/jobs", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setJob(data);
      localStorage.setItem(JOB_KEY, data.id);
      window.history.replaceState({}, "", `/stage?job=${data.id}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function useSamplePhoto() {
    setUploading(true);
    setError(null);
    try {
      const blob = await fetch("/demo/before.jpg").then((r) => r.blob());
      await upload([new File([blob], "sample-living-room.jpg", { type: "image/jpeg" })]);
    } catch {
      showError("Could not load the sample photo.");
    } finally {
      setUploading(false);
    }
  }

  async function generate(photoId: string, style: StyleKey, roomType: RoomKey) {
    if (!job) return;
    setError(null);
    setBusyPhotos((b) => ({ ...b, [photoId]: true }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, style, roomType }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "auth") {
          window.location.href = "/signin?next=/stage";
          return;
        }
        throw new Error(data.error ?? "Generation failed.");
      }
      await Promise.all([refresh(job.id), refreshUser()]);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusyPhotos((b) => ({ ...b, [photoId]: false }));
    }
  }

  async function buyPack() {
    setError(null);
    setCheckingOut(true);
    try {
      const returnTo = job ? `/stage?job=${job.id}` : "/stage";
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      showError(e instanceof Error ? e.message : "Checkout failed.");
      setCheckingOut(false);
    }
  }

  function resetListing() {
    localStorage.removeItem(JOB_KEY);
    window.history.replaceState({}, "", "/stage");
    setJob(null);
    setError(null);
  }

  const credits = user?.credits ?? 0;
  const freeLeft = user?.freeLeft ?? FREE_PREVIEWS;
  const outOfRenders = credits <= 0 && freeLeft <= 0;
  const onFreePreviews = credits <= 0 && freeLeft > 0;

  return (
    <div className="mx-auto max-w-5xl px-6 pb-36">
      <header className="sticky top-0 z-40 -mx-6 border-b border-line bg-paper/85 px-6 backdrop-blur-sm">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="font-serif text-2xl">
            Staged.
          </Link>
          <div className="flex items-center gap-5 text-sm">
            {user && (
              <span className={`hidden rounded-full border border-line px-3 py-1 sm:block ${outOfRenders ? "text-ink" : "text-muted"}`}>
                {credits > 0
                  ? `${credits} image${credits === 1 ? "" : "s"} left`
                  : `${freeLeft} free preview${freeLeft === 1 ? "" : "s"} left`}
              </span>
            )}
            <button
              onClick={buyPack}
              disabled={checkingOut}
              className="hidden text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-50 sm:block"
            >
              Buy {PACK_CREDITS} images — {PACK_LABEL}
            </button>
            {job && (
              <button onClick={resetListing} className="text-muted underline-offset-2 hover:text-ink hover:underline">
                New listing
              </button>
            )}
            <Link href="/dashboard" className="text-muted underline-offset-2 hover:text-ink hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Purchase confirmation */}
      {justPurchased && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-accent bg-paper-2 px-4 py-3 text-sm">
          <p>
            <span className="font-medium text-accent">Pack added.</span>{" "}
            <span className="text-muted">
              {PACK_CREDITS} images on your account — renders are now clean, full resolution, and downloadable.
            </span>
          </p>
          <span className="text-xs uppercase tracking-widest text-muted">Payment received</span>
        </div>
      )}

      {/* Free-preview notice */}
      {!justPurchased && onFreePreviews && (
        <div className="mt-6 rounded-2xl border border-line bg-paper-2 px-4 py-3 text-sm text-muted">
          You&rsquo;re on free previews — watermarked, {freeLeft} left. Buy {PACK_CREDITS} images for {PACK_LABEL} to
          get clean full-resolution downloads.
        </div>
      )}

      {/* Upload zone */}
      <section
        className={`mt-8 rounded-3xl border border-dashed p-10 text-center transition-all ${
          dragOver ? "scale-[1.01] border-accent bg-paper-2" : "border-line"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
      >
        <p className="font-serif text-2xl">{job ? "Add more photos" : "Drop photos of empty rooms"}</p>
        <p className="mt-2 text-sm text-muted">
          JPG, PNG or HEIC · up to {MAX_PHOTOS} photos per listing
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="rounded-xl border border-ink bg-ink px-5 py-2.5 text-paper transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Choose photos"}
          </button>
          {!job && (
            <button
              onClick={useSamplePhoto}
              disabled={uploading}
              className="rounded-xl border border-line px-5 py-2.5 text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              No photo handy? Try our sample room
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </section>

      {/* Error toast */}
      {error && (
        <div className="fixed left-1/2 top-20 z-50 w-[min(92vw,480px)] -translate-x-1/2 rounded-2xl border border-ink bg-paper px-4 py-3 text-sm shadow-[4px_4px_0_0_#1c1917]" role="alert">
          <div className="flex items-start justify-between gap-4">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Label toggle */}
      {job && job.renders.some((r) => r.paid && r.status === "done") && (
        <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={withLabel}
            onChange={(e) => setWithLabel(e.target.checked)}
            className="accent-ink"
          />
          Add a &ldquo;Virtually staged&rdquo; disclosure label to downloads (required by most MLSs)
        </label>
      )}

      {/* Photos */}
      {job?.photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photoId={photo.id}
          withLabel={withLabel}
          busy={!!busyPhotos[photo.id]}
          disabled={outOfRenders}
          renders={job.renders.filter((r) => r.photoId === photo.id && r.status === "done")}
          onGenerate={generate}
        />
      ))}

      {/* First-visit hint */}
      {!job && (
        <p className="mt-8 text-center text-sm text-muted">
          Every account starts with {FREE_PREVIEWS} free watermarked previews. Packs are {PACK_LABEL} for{" "}
          {PACK_CREDITS} clean full-resolution images.
        </p>
      )}

      {/* Buy bar */}
      {outOfRenders && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-paper">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div className="text-sm">
              <p>
                <span className="font-medium">You&rsquo;re out of images.</span>{" "}
                <span className="text-muted">
                  {PACK_LABEL} adds {PACK_CREDITS} more — clean, full resolution, any mode. Credits never expire.
                </span>
              </p>
              {IS_TEST_MODE && (
                <p className="mt-1 text-xs text-accent">
                  Test mode — pay with card 4242 4242 4242 4242, any future expiry, any CVC.
                </p>
              )}
            </div>
            <button
              onClick={buyPack}
              disabled={checkingOut}
              className="rounded-xl border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
            >
              {checkingOut ? "Redirecting…" : `Buy ${PACK_CREDITS} images — ${PACK_LABEL}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photoId,
  withLabel,
  busy,
  disabled,
  renders,
  onGenerate,
}: {
  photoId: string;
  withLabel: boolean;
  busy: boolean;
  disabled: boolean;
  renders: RenderInfo[];
  onGenerate: (photoId: string, style: StyleKey, roomType: RoomKey) => void;
}) {
  const [style, setStyle] = useState<StyleKey>("modern");
  const [room, setRoom] = useState<RoomKey>("living");
  const [compare, setCompare] = useState<RenderInfo | null>(null);

  const isUtility = style === "declutter" || style === "enhance";

  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-line">
      <div className="grid gap-0 md:grid-cols-[320px_1fr]">
        <div className="border-b border-line md:border-b-0 md:border-r">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/image/${photoId}?kind=original`}
            alt="Original room"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="space-y-3 p-4">
            <Select
              label="Room"
              value={room}
              onChange={(v) => setRoom(v as RoomKey)}
              options={Object.entries(ROOM_TYPES).map(([k, v]) => [k, v])}
            />
            <Select
              label="Mode"
              value={style}
              onChange={(v) => setStyle(v as StyleKey)}
              options={Object.entries(STYLES).map(([k, v]) => [k, v.label])}
            />
            <button
              onClick={() => onGenerate(photoId, style, room)}
              disabled={busy || disabled}
              className="w-full rounded-xl border border-ink bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
            >
              {busy
                ? "Working… 1–3 min"
                : isUtility
                ? style === "declutter"
                  ? "Empty this room"
                  : "Enhance this photo"
                : renders.length > 0
                ? "Stage again"
                : "Stage this room"}
            </button>
            {disabled && !busy && (
              <p className="text-xs text-muted">Out of images — buy a pack below to continue.</p>
            )}
          </div>
        </div>

        <div className="p-4">
          {renders.length === 0 && !busy && (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-1 text-center text-sm text-muted">
              <p>Renders appear here.</p>
              <p className="text-xs">Pick a mode and hit the button — compare results side by side after.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {renders.map((r) => (
              <figure key={r.id} className="group overflow-hidden rounded-2xl border border-line">
                <button className="relative block w-full cursor-zoom-in" onClick={() => setCompare(r)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/image/${r.id}?kind=preview`}
                    alt={`${r.style} render`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1.5 text-center text-xs uppercase tracking-widest text-paper opacity-0 transition-opacity group-hover:opacity-100">
                    Compare before / after
                  </span>
                </button>
                <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="truncate text-muted">
                    {STYLES[r.style as StyleKey]?.label.split(" (")[0] ?? r.style} ·{" "}
                    {ROOM_TYPES[r.roomType as RoomKey] ?? r.roomType}
                  </span>
                  {r.paid ? (
                    <a
                      href={`/api/image/${r.id}?kind=full${withLabel ? "&label=1" : ""}`}
                      className="shrink-0 font-medium underline-offset-2 hover:underline"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="shrink-0 text-muted">Free preview</span>
                  )}
                </figcaption>
              </figure>
            ))}
            {busy && (
              <div className="overflow-hidden rounded-2xl border border-line">
                <div className="flex aspect-[4/3] w-full animate-pulse items-center justify-center bg-paper-2">
                  <span className="text-sm text-muted">Furnishing…</span>
                </div>
                <div className="px-3 py-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-paper-2" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare modal */}
      {compare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
          onClick={() => setCompare(null)}
        >
          <div className="w-full max-w-3xl rounded-3xl border border-ink bg-paper p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm">
                <span className="font-medium">
                  {STYLES[compare.style as StyleKey]?.label.split(" (")[0] ?? compare.style}
                </span>{" "}
                <span className="text-muted">· drag the divider</span>
              </p>
              <button onClick={() => setCompare(null)} className="text-muted hover:text-ink">
                ✕ Close
              </button>
            </div>
            <BeforeAfterSlider
              before={`/api/image/${photoId}?kind=original`}
              after={`/api/image/${compare.id}?kind=preview`}
              beforeLabel="Before"
              afterLabel="After"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full cursor-pointer rounded-xl border border-line bg-paper px-3 py-2 outline-none focus:border-ink"
      >
        {options.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
