import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const OUTPUTS_DIR = path.join(DATA_DIR, "outputs");

for (const dir of [DATA_DIR, UPLOADS_DIR, OUTPUTS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

declare global {
  var __stagedDb: Database.Database | undefined;
}

function open(): Database.Database {
  const db = new Database(path.join(DATA_DIR, "staged.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      paid INTEGER NOT NULL DEFAULT 0,
      stripe_session_id TEXT,
      user_id TEXT,
      name TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      credits INTEGER NOT NULL DEFAULT 0,
      free_used INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS login_codes (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS purchases (
      stripe_session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      credits INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      original_path TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS renders (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      photo_id TEXT NOT NULL REFERENCES photos(id),
      style TEXT NOT NULL,
      room_type TEXT NOT NULL,
      status TEXT NOT NULL,
      output_path TEXT,
      error TEXT,
      paid INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_photos_job ON photos(job_id);
    CREATE INDEX IF NOT EXISTS idx_renders_job ON renders(job_id);
    CREATE INDEX IF NOT EXISTS idx_renders_photo ON renders(photo_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
  // Migrations for databases created before credits existed.
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.some((c) => c.name === "credits")) {
    db.exec("ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 0");
  }
  if (!userCols.some((c) => c.name === "free_used")) {
    db.exec("ALTER TABLE users ADD COLUMN free_used INTEGER NOT NULL DEFAULT 0");
  }
  const renderCols = db.prepare("PRAGMA table_info(renders)").all() as { name: string }[];
  if (!renderCols.some((c) => c.name === "paid")) {
    db.exec("ALTER TABLE renders ADD COLUMN paid INTEGER NOT NULL DEFAULT 0");
    // Renders that belonged to unlocked listings under the old model stay clean.
    db.exec("UPDATE renders SET paid = 1 WHERE job_id IN (SELECT id FROM jobs WHERE paid = 1)");
  }
  const jobCols = db.prepare("PRAGMA table_info(jobs)").all() as { name: string }[];
  if (!jobCols.some((c) => c.name === "name")) {
    db.exec("ALTER TABLE jobs ADD COLUMN name TEXT");
  }
  return db;
}

// Reuse the handle across Next.js dev hot reloads.
export const db: Database.Database = globalThis.__stagedDb ?? (globalThis.__stagedDb = open());

export interface Job {
  id: string;
  created_at: number;
  paid: number;
  stripe_session_id: string | null;
  user_id: string | null;
  name: string | null;
}

export interface User {
  id: string;
  email: string;
  created_at: number;
  credits: number;
  free_used: number;
}

export interface Photo {
  id: string;
  job_id: string;
  original_path: string;
  created_at: number;
}

export interface Render {
  id: string;
  job_id: string;
  photo_id: string;
  style: string;
  room_type: string;
  status: "processing" | "done" | "failed";
  output_path: string | null;
  error: string | null;
  paid: number;
  created_at: number;
}

export function getJob(id: string): Job | undefined {
  return db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Job | undefined;
}

export function getUser(id: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function getPhoto(id: string): Photo | undefined {
  return db.prepare("SELECT * FROM photos WHERE id = ?").get(id) as Photo | undefined;
}

export function getRender(id: string): Render | undefined {
  return db.prepare("SELECT * FROM renders WHERE id = ?").get(id) as Render | undefined;
}

export function jobPhotos(jobId: string): Photo[] {
  return db.prepare("SELECT * FROM photos WHERE job_id = ? ORDER BY created_at").all(jobId) as Photo[];
}

export function jobRenders(jobId: string): Render[] {
  return db.prepare("SELECT * FROM renders WHERE job_id = ? ORDER BY created_at").all(jobId) as Render[];
}

export function countSuccessfulRenders(jobId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM renders WHERE job_id = ? AND status = 'done'")
    .get(jobId) as { n: number };
  return row.n;
}

export function jobsForUser(userId: string): Job[] {
  return db
    .prepare("SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Job[];
}

/** Adds pack credits exactly once per Stripe checkout session. */
export function grantCredits(stripeSessionId: string, userId: string, credits: number, amountCents: number): boolean {
  const inserted = db
    .prepare(
      "INSERT OR IGNORE INTO purchases (stripe_session_id, user_id, credits, amount_cents, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(stripeSessionId, userId, credits, amountCents, Date.now());
  if (inserted.changes === 0) return false; // already granted
  db.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(credits, userId);
  return true;
}

export function jobState(jobId: string) {
  const job = getJob(jobId);
  if (!job) return null;
  return {
    id: job.id,
    name: job.name,
    userId: job.user_id,
    photos: jobPhotos(jobId).map((p) => ({ id: p.id })),
    renders: jobRenders(jobId).map((r) => ({
      id: r.id,
      photoId: r.photo_id,
      style: r.style,
      roomType: r.room_type,
      status: r.status,
      error: r.error,
      paid: r.paid === 1,
    })),
  };
}

/** Renames a listing. Pass an empty/blank name to clear it (falls back to date label). */
export function renameJob(jobId: string, name: string): void {
  const clean = name.trim().slice(0, 80);
  db.prepare("UPDATE jobs SET name = ? WHERE id = ?").run(clean.length > 0 ? clean : null, jobId);
}

/** Deletes a listing and every photo + render it owns, including the files on disk. */
export function deleteJob(jobId: string): void {
  const renders = db.prepare("SELECT output_path FROM renders WHERE job_id = ?").all(jobId) as {
    output_path: string | null;
  }[];
  const photos = db.prepare("SELECT original_path FROM photos WHERE job_id = ?").all(jobId) as {
    original_path: string | null;
  }[];
  for (const r of renders) if (r.output_path) fs.rmSync(r.output_path, { force: true });
  for (const p of photos) if (p.original_path) fs.rmSync(p.original_path, { force: true });

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM renders WHERE job_id = ?").run(jobId);
    db.prepare("DELETE FROM photos WHERE job_id = ?").run(jobId);
    db.prepare("DELETE FROM jobs WHERE id = ?").run(jobId);
  });
  tx();
}

/**
 * Deletes one uploaded photo and every render generated from it (DB rows + files).
 * Refunds credits / free previews for any still-processing renders.
 * Returns the deleted render ids so callers can clear UI trackers.
 */
export function deletePhoto(photoId: string): { jobId: string; renderIds: string[] } | null {
  const photo = getPhoto(photoId);
  if (!photo) return null;
  const job = getJob(photo.job_id);

  const renders = db
    .prepare("SELECT id, output_path, status, paid FROM renders WHERE photo_id = ?")
    .all(photoId) as {
    id: string;
    output_path: string | null;
    status: string;
    paid: number;
  }[];

  for (const r of renders) if (r.output_path) fs.rmSync(r.output_path, { force: true });
  if (photo.original_path) fs.rmSync(photo.original_path, { force: true });

  const tx = db.transaction(() => {
    if (job?.user_id) {
      for (const r of renders) {
        if (r.status !== "processing") continue;
        if (r.paid === 1) {
          db.prepare("UPDATE users SET credits = credits + 1 WHERE id = ?").run(job.user_id);
        } else {
          db.prepare(
            "UPDATE users SET free_used = free_used - 1 WHERE id = ? AND free_used > 0"
          ).run(job.user_id);
        }
      }
    }
    db.prepare("DELETE FROM renders WHERE photo_id = ?").run(photoId);
    db.prepare("DELETE FROM photos WHERE id = ?").run(photoId);
  });
  tx();

  return { jobId: photo.job_id, renderIds: renders.map((r) => r.id) };
}

/**
 * Looks up renders by id but only returns the ones owned by `userId`. Powers
 * the background-progress widget's status polling.
 */
export function rendersForUser(ids: string[], userId: string): Render[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT r.* FROM renders r JOIN jobs j ON j.id = r.job_id
       WHERE r.id IN (${placeholders}) AND j.user_id = ?`
    )
    .all(...ids, userId) as Render[];
}

/** All renders still processing for a user (used to resume progress after a reload). */
export function activeRendersForUser(userId: string): Render[] {
  return db
    .prepare(
      `SELECT r.* FROM renders r JOIN jobs j ON j.id = r.job_id
       WHERE j.user_id = ? AND r.status = 'processing' ORDER BY r.created_at`
    )
    .all(userId) as Render[];
}
