import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { countSuccessfulRenders, getUser, grantCredits, jobPhotos, jobsForUser } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { FREE_PREVIEWS, PACK_CREDITS, PACK_LABEL } from "@/lib/config";
import BuyPackButton from "./BuyPackButton";
import ListingRow from "./ListingRow";

export const metadata: Metadata = { title: "Dashboard — Staged" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  let user = await currentUser();
  if (!user) redirect("/signin?next=/dashboard");

  // Returning from Stripe: verify and credit the pack (idempotent).
  const { session_id: sessionId } = await searchParams;
  let justPurchased = false;
  if (sessionId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const credits = Number(session.metadata?.credits ?? 0);
        if (session.metadata?.userId === user.id && credits > 0 && session.payment_status === "paid") {
          grantCredits(sessionId, user.id, credits, session.amount_total ?? 0);
          justPurchased = true;
          user = getUser(user.id)!;
        }
      } catch {
        /* webhook covers it */
      }
    }
  }

  const jobs = jobsForUser(user.id);
  const freeLeft = Math.max(0, FREE_PREVIEWS - user.free_used);

  return (
    <div className="mx-auto max-w-5xl px-6">
      <header className="flex items-center justify-between border-b border-line py-5">
        <Link href="/" className="font-serif text-2xl">
          Staged.
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <span className="text-muted">{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button className="text-muted underline-offset-2 hover:text-ink hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {justPurchased && (
        <div className="mt-6 rounded-2xl border border-accent bg-paper-2 px-4 py-3 text-sm">
          <span className="font-medium text-accent">Pack added.</span>{" "}
          <span className="text-muted">{PACK_CREDITS} images are on your account.</span>
        </div>
      )}

      {/* Account strip */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line p-6">
          <p className="text-xs uppercase tracking-widest text-muted">Images left</p>
          <p className="mt-1 font-serif text-4xl">{user.credits}</p>
          <p className="mt-1 text-sm text-muted">Clean, full resolution, any mode.</p>
        </div>
        <div className="rounded-2xl border border-line p-6">
          <p className="text-xs uppercase tracking-widest text-muted">Free previews left</p>
          <p className="mt-1 font-serif text-4xl">{freeLeft}</p>
          <p className="mt-1 text-sm text-muted">Watermarked, for trying it out.</p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-ink bg-paper-2 p-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted">Top up</p>
            <p className="mt-1 font-serif text-2xl">
              {PACK_LABEL} for {PACK_CREDITS} images
            </p>
            <p className="mt-1 text-sm text-muted">Packs stack. Credits never expire.</p>
          </div>
          <div className="mt-4">
            <BuyPackButton />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-10">
        <h1 className="font-serif text-4xl">Your listings</h1>
        <Link
          href="/stage"
          className="rounded-xl border border-ink bg-ink px-5 py-2.5 text-paper transition-colors hover:bg-transparent hover:text-ink"
        >
          New listing
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-16 text-center">
          <p className="font-serif text-2xl">Nothing here yet.</p>
          <p className="mt-2 text-muted">
            Stage your first listing — your first {FREE_PREVIEWS} previews are free.
          </p>
          <Link
            href="/stage"
            className="mt-6 inline-block rounded-xl border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:bg-transparent hover:text-ink"
          >
            Stage a room
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-line rounded-2xl border border-line">
          {jobs.map((job) => {
            const photos = jobPhotos(job.id);
            const renders = countSuccessfulRenders(job.id);
            return (
              <ListingRow
                key={job.id}
                id={job.id}
                name={job.name}
                createdAt={job.created_at}
                photoCount={photos.length}
                renderCount={renders}
                firstPhotoId={photos[0]?.id ?? null}
              />
            );
          })}
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}
