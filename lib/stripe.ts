import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function siteUrl(): string {
  return (process.env.SITE_URL || "https://stagely.org").replace(/\/$/, "");
}
