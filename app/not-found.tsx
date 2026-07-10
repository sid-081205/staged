import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-7xl">404</p>
      <p className="mt-4 text-lg text-muted">This room doesn&rsquo;t exist, not even unstaged.</p>
      <Link
        href="/"
        className="mt-8 rounded-xl border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:bg-transparent hover:text-ink"
      >
        Back to Stagely
      </Link>
    </div>
  );
}
