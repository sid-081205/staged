import { NextRequest, NextResponse } from "next/server";
import { getStripe, siteUrl } from "@/lib/stripe";
import { PACK_CREDITS, PACK_PRICE_CENTS } from "@/lib/config";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";

/** POST /api/checkout { returnTo? } → Stripe Checkout URL for one credit pack */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to buy images.", code: "auth" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Set STRIPE_SECRET_KEY in .env." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const returnTo = typeof body?.returnTo === "string" && body.returnTo.startsWith("/") ? body.returnTo : "/stage";

  const base = siteUrl();
  const joiner = returnTo.includes("?") ? "&" : "?";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PACK_PRICE_CENTS,
          product_data: {
            name: `Staged: ${PACK_CREDITS} images`,
            description: "Full resolution renders, no watermark, any edit. Credits never expire.",
          },
        },
      },
    ],
    metadata: { userId: user.id, credits: String(PACK_CREDITS) },
    success_url: `${base}${returnTo}${joiner}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}${returnTo}`,
  });

  return NextResponse.json({ url: session.url });
}
