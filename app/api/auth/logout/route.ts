import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(`${siteUrl()}/`, 303);
}
