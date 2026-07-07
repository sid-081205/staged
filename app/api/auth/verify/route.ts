import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, setSessionCookie, verifyLoginCode } from "@/lib/auth";

export const runtime = "nodejs";

/** POST /api/auth/verify { email, code } → opens a session */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const code = (body?.code as string | undefined)?.trim();
  if (!email || !isValidEmail(email) || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }
  const session = verifyLoginCode(email, code);
  if (!session) {
    return NextResponse.json(
      { error: "That code is wrong or expired. Request a new one." },
      { status: 401 }
    );
  }
  await setSessionCookie(session);
  return NextResponse.json({ ok: true });
}
