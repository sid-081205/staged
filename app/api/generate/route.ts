import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";
import { db, getJob, getPhoto, getUser, OUTPUTS_DIR } from "@/lib/db";
import {
  buildPrompt,
  FREE_PREVIEWS,
  isService,
  isStyle,
  ROOM_TYPES,
  RoomKey,
  ServiceKey,
  StyleKey,
  sanitizeExtraPrompt,
} from "@/lib/config";
import { stagePhoto } from "@/lib/cursorAgent";
import { currentUser } from "@/lib/auth";
import { sendFirstPreviewReadyEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 600;

/**
 * POST /api/generate  { photoId, service, style?, roomType, extraPrompt? }
 *
 * `service` is one of stage | declutter | enhance; `style` is required when
 * the service is stage.
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
  const service = body?.service as ServiceKey | undefined;
  const styleRaw = body?.style as string | undefined;
  const roomType = body?.roomType as RoomKey | undefined;
  const extraPrompt = sanitizeExtraPrompt(body?.extraPrompt as string | undefined);

  if (!photoId || !service || !roomType || !isService(service) || !(roomType in ROOM_TYPES)) {
    return NextResponse.json({ error: "photoId, service and roomType are required." }, { status: 400 });
  }
  let style: StyleKey | null = null;
  if (service === "stage") {
    if (!styleRaw || !isStyle(styleRaw)) {
      return NextResponse.json({ error: "Pick a furniture style to stage this room." }, { status: 400 });
    }
    style = styleRaw;
  }

  // Renders store the furniture style for staging, or the service name for
  // declutter / enhance, in the existing `style` column.
  const styleColumn = service === "stage" ? (style as string) : service;

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
  ).run(renderId, job.id, photoId, styleColumn, roomType, paid, Date.now());

  // Fire-and-forget: the render keeps running on the server after we respond.
  // (Staged is designed to run on a persistent box, not a serverless function.)
  void runRender({
    renderId,
    userId: user.id,
    reservedCredit,
    inputPath: photo.original_path,
    prompt: buildPrompt(service, style, roomType, extraPrompt),
    tag: styleColumn,
  });

  return NextResponse.json({
    id: renderId,
    jobId: job.id,
    photoId,
    style: styleColumn,
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
  tag: string;
}) {
  const { renderId, userId, reservedCredit, inputPath, prompt, tag } = args;
  try {
    const output = await stagePhoto(inputPath, prompt, tag);
    // Photo may have been deleted while we were generating.
    const stillThere = db.prepare("SELECT id FROM renders WHERE id = ?").get(renderId);
    if (!stillThere) {
      return;
    }
    const outputPath = path.join(OUTPUTS_DIR, `${renderId}.jpg`);
    fs.writeFileSync(outputPath, output);
    db.prepare("UPDATE renders SET status = 'done', output_path = ? WHERE id = ?").run(
      outputPath,
      renderId
    );

    // One thank-you email the first time a free preview succeeds for this user.
    if (!reservedCredit) {
      await maybeSendFirstPreviewEmail(userId);
    }
  } catch (err) {
    const stillThere = db.prepare("SELECT id FROM renders WHERE id = ?").get(renderId);
    if (!stillThere) return;
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

/** Emails once when this is the user's first successful free (unpaid) preview. */
async function maybeSendFirstPreviewEmail(userId: string): Promise<void> {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM renders r
       JOIN jobs j ON j.id = r.job_id
       WHERE j.user_id = ? AND r.paid = 0 AND r.status = 'done'`
    )
    .get(userId) as { n: number };
  if (row.n !== 1) return;

  const user = getUser(userId);
  if (!user?.email) return;

  try {
    await sendFirstPreviewReadyEmail(user.email);
  } catch (err) {
    console.error(
      `[staged] first-preview email failed for ${user.email}:`,
      err instanceof Error ? err.message : err
    );
  }
}
