"use client";

import { useState } from "react";
import { PACK_CREDITS, PACK_LABEL } from "@/lib/config";

export default function BuyPackButton({ subtle = false }: { subtle?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/dashboard" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={buy}
        disabled={busy}
        className={
          subtle
            ? "rounded-xl border border-line px-5 py-2.5 text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            : "rounded-xl border border-ink bg-ink px-5 py-2.5 text-paper transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
        }
      >
        {busy ? "Redirecting…" : `Buy ${PACK_CREDITS} images — ${PACK_LABEL}`}
      </button>
      {error && <p className="mt-2 text-sm text-muted">{error}</p>}
    </div>
  );
}
