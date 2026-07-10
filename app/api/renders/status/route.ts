import { NextRequest, NextResponse } from "next/server";
import { activeRendersForUser, rendersForUser } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/renders/status?ids=a,b,c
 *
 * Returns the status of the given renders (owned by the signed-in user). With
 * no `ids`, returns every render still processing — lets the progress widget
 * recover in-flight jobs after a full page reload. Powers the background
 * progress popup that keeps furnishing visible across page navigations.
 */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required.", code: "auth" }, { status: 401 });

  const idsParam = req.nextUrl.searchParams.get("ids");
  const ids = idsParam
    ? idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50)
    : [];

  const renders = ids.length > 0 ? rendersForUser(ids, user.id) : activeRendersForUser(user.id);

  return NextResponse.json({
    renders: renders.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      photoId: r.photo_id,
      style: r.style,
      roomType: r.room_type,
      status: r.status,
      error: r.error,
      paid: r.paid === 1,
    })),
  });
}
