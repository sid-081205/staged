import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";
import { db, getJob, getPhoto, OUTPUTS_DIR } from "@/lib/db";
import {
  buildPrompt,
  FREE_PREVIEWS,
  ROOM_TYPES,
  STYLES,
  RoomKey,
  StyleKey,
  sanitizeExtraPrompt,
} from "@/lib/config";
import { stagePhoto } from "@/lib/cursorAgent";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/generate  { photoId, style, roomType, extraPrompt? }
 *
 * Requires sign-in. Reserves 1 credit (or 1 free preview) up front, records the
 * render as `processing`, then runs the render in the background and returns
 * immediately. The credit is refunded automatically if the render fails. The
 * client tracks the returned render id and polls /api/renders/status, so the
 * work continues even if the user navigates away.
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
  const extraPrompt = sanitizeExtraPrompt(body?.extraPrompt as string | undefined);

  if (!photoId || !style || !roomType || !(style in STYLES) || !(roomType in ROOM_TYPES)) {
    return NextResponse.json({ error: "photoId, style and roomType are required." }, { status: 400 });
  }

  const photo = getPhoto(photoId);
  if (!photo) return NextResponse.json({ error: "Unknown photo." }, { status: 404 });
  const job = getJob(photo.job_id)!;
  if (job.user_id && job.user_id !== user.id) {
    return NextResponse.json({ error: "This listing belongs to another account." }, { status: 403 });
  }

  // Reserve up front so concurrent renders can't oversell a balance. A credit
  // render is clean and downloadable; a free preview is watermarked. Refunded
  // below if the render fails.
  let reservedCredit = false;
  const credited = db
    .prepare("UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0")
    .run(user.id);
  if (credited.changes > 0) {
    reservedCredit = true;
  } else {
    const freed = db
      .prepare("UPDATE users SET free_used = free_used + 1 WHERE id = ? AND free_used < ?")
      .run(user.id, FREE_PREVIEWS);
    if (freed.changes === 0) {
      return NextResponse.json(
        { error: "You're out of images. Buy a pack to keep rendering.", code: "paywall" },
        { status: 402 }
      );
    }
  }

  const renderId = nanoid(12);
  const paid = reservedCredit ? 1 : 0;
  db.prepare(
    "INSERT INTO renders (id, job_id, photo_id, style, room_type, status, paid, created_at) VALUES (?, ?, ?, ?, ?, 'processing', ?, ?)"
  ).run(renderId, job.id, photoId, style, roomType, paid, Date.now());

  // Fire-and-forget: the render keeps running on the server after we respond.
  // (Staged is designed to run on a persistent box, not a serverless function.)
  void runRender({
    renderId,
    userId: user.id,
    reservedCredit,
    inputPath: photo.original_path,
    prompt: buildPrompt(style, roomType, extraPrompt),
    style,
  });

  return NextResponse.json({
    id: renderId,
    jobId: job.id,
    photoId,
    style,
    roomType,
    status: "processing",
    paid: reservedCredit,
  });
}

async function runRender(args: {
  renderId: string;
  userId: string;
  reservedCredit: boolean;
  inputPath: string;
  prompt: string;
  style: StyleKey;
}) {
  const { renderId, userId, reservedCredit, inputPath, prompt, style } = args;
  try {
    const output = await stagePhoto(inputPath, prompt, style);
    const outputPath = path.join(OUTPUTS_DIR, `${renderId}.jpg`);
    fs.writeFileSync(outputPath, output);
    db.prepare("UPDATE renders SET status = 'done', output_path = ? WHERE id = ?").run(
      outputPath,
      renderId
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    // Refund the reservation — the agent never produced an image.
    if (reservedCredit) {
      db.prepare("UPDATE users SET credits = credits + 1 WHERE id = ?").run(userId);
    } else {
      db.prepare("UPDATE users SET free_used = free_used - 1 WHERE id = ? AND free_used > 0").run(userId);
    }
    db.prepare("UPDATE renders SET status = 'failed', error = ? WHERE id = ?").run(message, renderId);
  }
}
