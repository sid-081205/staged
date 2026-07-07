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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Staged <onboarding@resend.dev>",
      to: [email],
      subject: `${code} is your Staged sign-in code`,
      text: `Your Staged sign-in code is:\n\n${code}\n\nIt expires in 10 minutes. If you didn't request it, ignore this email.`,
      html: [
        `<div style="font-family:Georgia,serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#1c1917">`,
        `<p style="font-size:22px;margin:0 0 16px">Staged.</p>`,
        `<p style="font-family:system-ui,sans-serif;font-size:14px;color:#6e675c;margin:0 0 20px">Enter this code to sign in. It expires in 10 minutes.</p>`,
        `<p style="font-family:system-ui,sans-serif;font-size:34px;letter-spacing:8px;font-weight:600;margin:0 0 24px">${code}</p>`,
        `<p style="font-family:system-ui,sans-serif;font-size:12px;color:#6e675c;margin:0">If you didn't request this, you can ignore this email.</p>`,
        `</div>`,
      ].join(""),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return {};
}
