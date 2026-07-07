import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { FREE_PREVIEWS } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          email: user.email,
          credits: user.credits,
          freeLeft: Math.max(0, FREE_PREVIEWS - user.free_used),
        }
      : null,
  });
}
