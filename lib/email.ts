import { PACK_CREDITS, PACK_LABEL } from "@/lib/config";

function siteUrl(): string {
  return (process.env.SITE_URL || "https://stagely.org").replace(/\/$/, "");
}

async function sendResendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Stagely <onboarding@resend.dev>",
      to: [args.to],
      subject: args.subject,
      text: args.text,
      html: args.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

/**
 * Sends the 6-digit sign-in code. Uses Resend if RESEND_API_KEY is set;
 * otherwise logs the code to the server console (dev fallback).
 */
export async function sendLoginCode(email: string, code: string): Promise<{ devCode?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[staged] sign-in code for ${email}: ${code}`);
    // Surfacing the code in the API response would let anyone sign in as any
    // email, so we only do it when explicitly running without email in dev.
    return process.env.NODE_ENV !== "production" ? { devCode: code } : {};
  }

  await sendResendEmail({
    to: email,
    subject: `${code} is your Stagely sign-in code`,
    text: `Your Stagely sign-in code is:\n\n${code}\n\nIt expires in 10 minutes. If you didn't request it, ignore this email.`,
    html: [
      `<div style="font-family:Georgia,serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#1c1917">`,
      `<p style="font-size:22px;margin:0 0 16px">Stagely</p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:14px;color:#6e675c;margin:0 0 20px">Enter this code to sign in. It expires in 10 minutes.</p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:34px;letter-spacing:8px;font-weight:600;margin:0 0 24px">${code}</p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:12px;color:#6e675c;margin:0">If you didn't request this, you can ignore this email.</p>`,
      `</div>`,
    ].join(""),
  });
  return {};
}

/**
 * Sent once when a new user's first free preview render finishes successfully.
 * Failures are left to the caller to log — they must not undo the render.
 */
export async function sendFirstPreviewReadyEmail(email: string): Promise<void> {
  const viewUrl = `${siteUrl()}/signin?next=${encodeURIComponent("/dashboard")}`;
  const subject = "Your First Staging is Ready!";
  const text = [
    "Thanks for trying Stagely — your first preview image is ready.",
    "",
    `Sign in with ${email} to view it:`,
    viewUrl,
    "",
    `Like what you see? Buy ${PACK_CREDITS} more images for ${PACK_LABEL} — a deal no other staging company can beat.`,
    "",
    "Questions about the product? Email stagelyhelp@gmail.com and a real human will reply in less than a day.",
    "",
    "— The Stagely team",
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[staged] first-preview email for ${email} (no RESEND_API_KEY):\n${text}`);
    return;
  }

  await sendResendEmail({
    to: email,
    subject,
    text,
    html: [
      `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1c1917">`,
      `<p style="font-size:22px;margin:0 0 20px">Stagely</p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;margin:0 0 16px">Thanks for trying Stagely — your first preview image is ready.</p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;margin:0 0 24px">Sign in with <strong>${email}</strong> to check it out on your dashboard.</p>`,
      `<p style="margin:0 0 28px"><a href="${viewUrl}" style="font-family:system-ui,sans-serif;display:inline-block;background:#1c1917;color:#faf8f5;text-decoration:none;padding:12px 20px;font-size:14px;font-weight:600">View your staging</a></p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;margin:0 0 16px">Like the preview? Buy <strong>${PACK_CREDITS} more images for ${PACK_LABEL}</strong> — a deal no other staging company can beat.</p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.55;color:#6e675c;margin:0 0 8px">Questions about the product? Email <a href="mailto:stagelyhelp@gmail.com" style="color:#1c1917">stagelyhelp@gmail.com</a> and a real human will reply in less than a day.</p>`,
      `<p style="font-family:system-ui,sans-serif;font-size:13px;color:#6e675c;margin:24px 0 0">— The Stagely team</p>`,
      `</div>`,
    ].join(""),
  });
}
