import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import StageClient from "./StageClient";

export const metadata: Metadata = {
  title: "Stage a listing — Staged",
};

export const dynamic = "force-dynamic";

export default async function StagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUser();
  if (!user) {
    // Preserve job/session_id params through the sign-in round trip.
    const params = await searchParams;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === "string") qs.set(k, v);
    }
    const next = qs.size > 0 ? `/stage?${qs.toString()}` : "/stage";
    redirect(`/signin?next=${encodeURIComponent(next)}`);
  }
  return <StageClient />;
}
