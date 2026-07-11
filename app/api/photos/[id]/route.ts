import { NextRequest, NextResponse } from "next/server";
import { deletePhoto, getJob, getPhoto } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

/** DELETE /api/photos/:id — delete an uploaded photo and all renders from it. */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const photo = getPhoto(id);
  if (!photo) return NextResponse.json({ error: "Unknown photo." }, { status: 404 });

  const job = getJob(photo.job_id);
  if (!job) return NextResponse.json({ error: "Unknown listing." }, { status: 404 });

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required.", code: "auth" }, { status: 401 });
  if (job.user_id && job.user_id !== user.id) {
    return NextResponse.json({ error: "This listing belongs to another account." }, { status: 403 });
  }

  const result = deletePhoto(id);
  if (!result) return NextResponse.json({ error: "Unknown photo." }, { status: 404 });

  return NextResponse.json({ ok: true, jobId: result.jobId, renderIds: result.renderIds });
}
