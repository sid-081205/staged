import { NextRequest, NextResponse } from "next/server";
import { createLoginCode, isValidEmail } from "@/lib/auth";
import { sendLoginCode } from "@/lib/email";

export const runtime = "nodejs";

/** POST /api/auth/login { email } → emails a 6-digit sign-in code */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const code = createLoginCode(email);
  try {
    const { devCode } = await sendLoginCode(email, code);
    return NextResponse.json({ sent: true, ...(devCode ? { devCode } : {}) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not send email." },
      { status: 502 }
    );
  }
}
