import { NextRequest, NextResponse } from "next/server";
import { grantCredits, getUser } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * GET /api/checkout/verify?session_id=...
 * Called on return from Stripe Checkout. Verifies payment server-side and
 * credits the buyer's account. Idempotent (a session grants credits once).
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "session_id required." }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Payments not configured." }, { status: 503 });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const userId = session.metadata?.userId;
  const credits = Number(session.metadata?.credits ?? 0);
  if (!userId || !getUser(userId) || credits <= 0) {
    return NextResponse.json({ error: "Unknown purchase." }, { status: 404 });
  }

  if (session.payment_status === "paid") {
    const granted = grantCredits(sessionId, userId, credits, session.amount_total ?? 0);
    return NextResponse.json({ paid: true, credits, granted });
  }
  return NextResponse.json({ paid: false });
}
