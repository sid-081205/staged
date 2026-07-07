"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const codeInput = useRef<HTMLInputElement>(null);

  function nextUrl(): string {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send the code.");
      setDevCode(data.devCode ?? null);
      setStep("code");
      setCode("");
      setTimeout(() => codeInput.current?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That code didn't work.");
      window.location.href = nextUrl();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between border-b border-line py-5">
        <Link href="/" className="font-serif text-2xl">
          Staged.
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-ink">
          Back to home
        </Link>
      </header>

      <div className="mx-auto max-w-md py-24">
        <h1 className="font-serif text-4xl">Sign in</h1>
        <p className="mt-3 leading-relaxed text-muted">
          {step === "email"
            ? "Enter your email and we'll send a 6 digit code. No passwords. Your images and credits stay on your account."
            : `We emailed a 6-digit code to ${email}. It expires in 10 minutes.`}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="mt-8 space-y-4">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brokerage.com"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none placeholder:text-muted/60 focus:border-ink"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
            >
              {busy ? "Sending…" : "Email me a code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-8 space-y-4">
            <input
              ref={codeInput}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none placeholder:text-muted/40 focus:border-ink"
            />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full rounded-xl border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:bg-transparent hover:text-ink disabled:opacity-50"
            >
              {busy ? "Checking…" : "Sign in"}
            </button>
            {devCode && (
              <p className="rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm text-muted">
                Dev mode (no email key set). Your code is <span className="font-medium text-ink">{devCode}</span>
              </p>
            )}
            <div className="flex items-center justify-between text-sm text-muted">
              <button type="button" onClick={() => setStep("email")} className="underline-offset-2 hover:text-ink hover:underline">
                Use a different email
              </button>
              <button type="button" onClick={() => sendCode()} disabled={busy} className="underline-offset-2 hover:text-ink hover:underline disabled:opacity-50">
                Resend code
              </button>
            </div>
          </form>
        )}

        {error && <p className="mt-4 rounded-xl border border-ink/20 bg-paper-2 px-4 py-3 text-sm">{error}</p>}
      </div>
    </div>
  );
}
