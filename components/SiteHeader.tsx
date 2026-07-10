"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

const NAV_LINKS = [
  { href: "/#offerings", label: "What it does" },
  { href: "/#styles", label: "Styles" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

export default function SiteHeader({ trailing }: { trailing?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-serif text-2xl transition-colors hover:text-accent"
          onClick={() => setOpen(false)}
        >
          <Logo />
          Stagely
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted sm:gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hidden hover:text-ink sm:block">
              {label}
            </Link>
          ))}
          {trailing}
          <Link
            href="/dashboard"
            className="shrink-0 rounded-xl border border-ink bg-ink px-3.5 py-2 text-paper transition-colors hover:bg-transparent hover:text-ink sm:px-4"
          >
            Stage a room
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-lg text-ink sm:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </nav>
      </div>
      {open && (
        <nav className="border-t border-line bg-paper px-4 py-2 sm:hidden">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3 text-[15px] text-ink last:border-b-0"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
