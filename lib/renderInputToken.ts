import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Same location as lib/db.ts DATA_DIR (not imported so this module stays
// dependency-free and usable from the experiments harnesses).
const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Signed, expiring URLs for /api/render-input/:photoId.
 *
 * Why this exists: images attached to a Cursor agent via the API are visible
 * to the model as context but are NOT materialized as files on the agent's
 * VM, so the agent cannot pass the photo to its image tool as a reference
 * file. Production transcripts show agents wasting minutes searching the
 * filesystem and then generating the room from a text description — the
 * fabrication/drift failure mode. The fix: the render prompt includes a
 * short-lived signed URL the agent curls to put the exact preprocessed photo
 * on disk before generating.
 */

let cachedSecret: Buffer | null = null;

function secret(): Buffer {
  if (cachedSecret) return cachedSecret;
  const env = (process.env.RENDER_INPUT_SECRET || "").trim();
  if (env) {
    cachedSecret = Buffer.from(env);
    return cachedSecret;
  }
  // Zero-config default: a persistent random secret under data/ (gitignored,
  // survives restarts on the always-on box this app is designed for).
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, "render-input.secret");
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
  }
  cachedSecret = Buffer.from(fs.readFileSync(file, "utf8").trim());
  return cachedSecret;
}

export function signRenderInput(photoId: string, expiresAtMs: number): string {
  return crypto.createHmac("sha256", secret()).update(`${photoId}.${expiresAtMs}`).digest("hex");
}

export function verifyRenderInput(photoId: string, expiresAtMs: number, sig: string): boolean {
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return false;
  const expected = Buffer.from(signRenderInput(photoId, expiresAtMs));
  const given = Buffer.from(sig);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** Long enough to cover the slowest agent plus retries; still short-lived. */
const URL_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Public download URL for a render input, or null when the site isn't
 * publicly reachable (local dev on localhost — the agent VM could never
 * fetch it, so the pipeline falls back to attachment-only behavior).
 */
export function renderInputUrl(photoId: string): string | null {
  const site = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  if (!/^https:\/\//i.test(site)) return null;
  const exp = Date.now() + URL_TTL_MS;
  return `${site}/api/render-input/${photoId}?exp=${exp}&sig=${signRenderInput(photoId, exp)}`;
}
