import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db, getJob, jobPhotos, jobState, UPLOADS_DIR } from "@/lib/db";
import { MAX_PHOTOS, MAX_UPLOAD_BYTES } from "@/lib/config";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/jobs
 * multipart form: photos[] (image files), optional jobId to append to an
 * existing listing. Creates the job if needed, stores originals.
 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload photos.", code: "auth" }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No photos uploaded." }, { status: 400 });
  }

  let jobId = (form.get("jobId") as string | null) ?? null;
  if (jobId) {
    const job = getJob(jobId);
    if (!job) return NextResponse.json({ error: "Unknown job." }, { status: 404 });
    if (job.user_id && job.user_id !== user.id) {
      return NextResponse.json({ error: "This listing belongs to another account." }, { status: 403 });
    }
    // Claim ownerless (pre-accounts) jobs for the signed-in user.
    if (!job.user_id) {
      db.prepare("UPDATE jobs SET user_id = ? WHERE id = ?").run(user.id, jobId);
    }
  } else {
    jobId = nanoid(12);
    db.prepare("INSERT INTO jobs (id, created_at, paid, user_id) VALUES (?, ?, 0, ?)").run(
      jobId,
      Date.now(),
      user.id
    );
  }

  const existing = jobPhotos(jobId).length;
  if (existing + files.length > MAX_PHOTOS) {
    return NextResponse.json(
      { error: `A listing is limited to ${MAX_PHOTOS} photos.` },
      { status: 400 }
    );
  }

  const insert = db.prepare(
    "INSERT INTO photos (id, job_id, original_path, created_at) VALUES (?, ?, ?, ?)"
  );

  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `${file.name} is over 20 MB.` }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    try {
      // Normalizes orientation and validates that the file is a real image.
      const normalized = await sharp(bytes).rotate().jpeg({ quality: 95 }).toBuffer();
      const photoId = nanoid(12);
      const filePath = path.join(UPLOADS_DIR, `${photoId}.jpg`);
      fs.writeFileSync(filePath, normalized);
      insert.run(photoId, jobId, filePath, Date.now());
    } catch {
      return NextResponse.json({ error: `${file.name} is not a readable image.` }, { status: 400 });
    }
  }

  return NextResponse.json(jobState(jobId));
}
