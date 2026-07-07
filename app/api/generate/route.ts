import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";
import { db, getJob, getPhoto, OUTPUTS_DIR } from "@/lib/db";
import { buildPrompt, FREE_PREVIEWS, ROOM_TYPES, STYLES, RoomKey, StyleKey } from "@/lib/config";
import { stagePhoto } from "@/lib/cursorAgent";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/generate  { photoId, style, roomType }
 * Runs one render. Requires sign-in. Spends 1 credit per render; accounts
 * without credits get FREE_PREVIEWS watermarked previews first.
 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to render images.", code: "auth" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const photoId = body?.photoId as string | undefined;
  const style = body?.style as StyleKey | undefined;
  const roomType = body?.roomType as RoomKey | undefined;

  if (!photoId || !style || !roomType || !(style in STYLES) || !(roomType in ROOM_TYPES)) {
    return NextResponse.json({ error: "photoId, style and roomType are required." }, { status: 400 });
  }

  const photo = getPhoto(photoId);
  if (!photo) return NextResponse.json({ error: "Unknown photo." }, { status: 404 });
  const job = getJob(photo.job_id)!;
  if (job.user_id && job.user_id !== user.id) {
    return NextResponse.json({ error: "This listing belongs to another account." }, { status: 403 });
  }

  // A credit render is clean and downloadable; a free preview is watermarked.
  const useCredit = user.credits > 0;
  const freeLeft = Math.max(0, FREE_PREVIEWS - user.free_used);
  if (!useCredit && freeLeft <= 0) {
    return NextResponse.json(
      { error: "You're out of images. Buy a pack to keep rendering.", code: "paywall" },
      { status: 402 }
    );
  }

  const renderId = nanoid(12);
  try {
    const output = await stagePhoto(photo.original_path, buildPrompt(style, roomType), style);
    const outputPath = path.join(OUTPUTS_DIR, `${renderId}.jpg`);
    fs.writeFileSync(outputPath, output);

    // Charge only after the render succeeds.
    if (useCredit) {
      db.prepare("UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0").run(user.id);
    } else {
      db.prepare("UPDATE users SET free_used = free_used + 1 WHERE id = ?").run(user.id);
    }
    db.prepare(
      "INSERT INTO renders (id, job_id, photo_id, style, room_type, status, output_path, paid, created_at) VALUES (?, ?, ?, ?, ?, 'done', ?, ?, ?)"
    ).run(renderId, job.id, photoId, style, roomType, outputPath, useCredit ? 1 : 0, Date.now());

    return NextResponse.json({
      id: renderId,
      photoId,
      style,
      roomType,
      status: "done",
      paid: useCredit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    db.prepare(
      "INSERT INTO renders (id, job_id, photo_id, style, room_type, status, error, paid, created_at) VALUES (?, ?, ?, ?, ?, 'failed', ?, 0, ?)"
    ).run(renderId, job.id, photoId, style, roomType, message, Date.now());
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
