import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

const NAV_LINKS = [
  { href: "/#offerings", label: "What it does" },
  { href: "/#styles", label: "Styles" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const;

export default function SiteHeader({ trailing }: { trailing?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-serif text-2xl transition-colors hover:text-accent"
        >
          <Logo />
          Stagely
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted sm:gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hidden hover:text-ink sm:block">
              {label}
            </Link>
          ))}
          {trailing}
          <Link
            href="/dashboard"
            className="shrink-0 rounded-xl border border-ink bg-ink px-4 py-2 text-paper transition-colors hover:bg-transparent hover:text-ink"
          >
            Stage a room
          </Link>
        </nav>
      </div>
    </header>
  );
}
