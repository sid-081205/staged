import { cookies } from "next/headers";
import { randomBytes, randomInt } from "node:crypto";
import { db, User } from "./db";
import { nanoid } from "nanoid";

const SESSION_COOKIE = "staged_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days
const CODE_TTL_MS = 1000 * 60 * 10; // 10 minutes
const MAX_ATTEMPTS = 5;

/** Creates (or replaces) the sign-in code for an email. */
export function createLoginCode(email: string): string {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  db.prepare(
    `INSERT INTO login_codes (email, code, expires_at, attempts) VALUES (?, ?, ?, 0)
     ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at, attempts = 0`
  ).run(email.trim().toLowerCase(), code, Date.now() + CODE_TTL_MS);
  return code;
}

/**
 * Verifies an email + code pair. On success creates the user if new, opens a
 * session, and returns the session token. Returns null on any failure.
 */
export function verifyLoginCode(email: string, code: string): string | null {
  const normalized = email.trim().toLowerCase();
  const row = db.prepare("SELECT * FROM login_codes WHERE email = ?").get(normalized) as
    | { email: string; code: string; expires_at: number; attempts: number }
    | undefined;
  if (!row || row.expires_at < Date.now() || row.attempts >= MAX_ATTEMPTS) return null;

  if (row.code !== code.trim()) {
    db.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?").run(normalized);
    return null;
  }
  db.prepare("DELETE FROM login_codes WHERE email = ?").run(normalized);

  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalized) as User | undefined;
  if (!user) {
    db.prepare("INSERT INTO users (id, email, created_at, credits, free_used) VALUES (?, ?, ?, 0, 0)").run(
      nanoid(12),
      normalized,
      Date.now()
    );
    user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalized) as User;
  }

  const session = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    session,
    user.id,
    Date.now() + SESSION_TTL_MS,
    Date.now()
  );
  return session;
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .get(token, Date.now()) as User | undefined;
  return row ?? null;
}

export async function setSessionCookie(session: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies get dropped on plain-http localhost (Safari especially),
    // so key this off the actual site protocol rather than NODE_ENV.
    secure: (process.env.SITE_URL ?? "").startsWith("https"),
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(SESSION_COOKIE);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
