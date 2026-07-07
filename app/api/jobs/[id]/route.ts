import { NextRequest, NextResponse } from "next/server";
import { db, deleteJob, getJob, jobState, renameJob } from "@/lib/db";
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

/** PATCH /api/jobs/:id  { name }  — rename a listing. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const owned = await requireOwnedJob(id);
  if ("error" in owned) return owned.error;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  renameJob(id, name);
  return NextResponse.json(jobState(id));
}

/** DELETE /api/jobs/:id — delete a listing and all of its photos + renders. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const owned = await requireOwnedJob(id);
  if ("error" in owned) return owned.error;

  deleteJob(id);
  return NextResponse.json({ ok: true });
}

async function requireOwnedJob(id: string): Promise<{ ok: true } | { error: NextResponse }> {
  const job = getJob(id);
  if (!job) return { error: NextResponse.json({ error: "Unknown job." }, { status: 404 }) };
  const user = await currentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required.", code: "auth" }, { status: 401 }) };
  }
  if (job.user_id && job.user_id !== user.id) {
    return {
      error: NextResponse.json({ error: "This listing belongs to another account." }, { status: 403 }),
    };
  }
  return { ok: true };
}
