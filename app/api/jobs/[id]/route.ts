import { NextRequest, NextResponse } from "next/server";
import { db, getJob, jobState } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: "Unknown job." }, { status: 404 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required.", code: "auth" }, { status: 401 });
  if (job.user_id && job.user_id !== user.id) {
    return NextResponse.json({ error: "This listing belongs to another account." }, { status: 403 });
  }
  // Attach ownerless (pre-accounts) jobs to the signed-in user viewing them.
  if (!job.user_id) {
    db.prepare("UPDATE jobs SET user_id = ? WHERE id = ?").run(user.id, id);
  }

  return NextResponse.json(jobState(id));
}
