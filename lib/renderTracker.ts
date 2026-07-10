"use client";

/**
 * Tiny client-side store for in-flight renders, persisted to localStorage so a
 * render keeps showing progress even if the user navigates away from /stage or
 * reloads the page. The global <RenderTracker/> widget and the staging
 * workspace both read/write this and listen for the change event.
 */

export interface TrackedRender {
  id: string;
  jobId: string;
  style: string;
  roomType: string;
  status: "processing" | "done" | "failed";
  error?: string | null;
  startedAt: number;
}

const KEY = "staged:tracked";
export const TRACKED_EVENT = "staged:tracked-changed";

export function getTracked(): TrackedRender[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackedRender[]) : [];
  } catch {
    return [];
  }
}

function save(list: TrackedRender[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
  window.dispatchEvent(new CustomEvent(TRACKED_EVENT));
}

export function addTracked(item: TrackedRender) {
  const list = getTracked().filter((t) => t.id !== item.id);
  list.push(item);
  save(list);
}

export function updateTracked(id: string, patch: Partial<TrackedRender>) {
  const list = getTracked().map((t) => (t.id === id ? { ...t, ...patch } : t));
  save(list);
}

export function removeTracked(id: string) {
  save(getTracked().filter((t) => t.id !== id));
}
