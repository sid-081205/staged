import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { grantCredits, getUser } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe
 * Grants pack credits on checkout.session.completed. Complements the
 * redirect-time verification so payments still land if the user closes the
 * tab before returning. Requires STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = Number(session.metadata?.credits ?? 0);
    if (userId && getUser(userId) && credits > 0 && session.payment_status === "paid") {
      grantCredits(session.id, userId, credits, session.amount_total ?? 0);
    }
  }

  return NextResponse.json({ received: true });
}
