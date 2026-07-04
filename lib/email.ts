/**
 * Transactional email via Resend. Requires RESEND_API_KEY and
 * RESEND_FROM_EMAIL in the environment. If they're not set (e.g. local
 * dev without a Resend account yet), falls back to logging the OTP to the
 * server console so development isn't blocked — this fallback must never
 * run in production (guarded below).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@eastwestpk.com";

export async function sendOtpEmail(toEmail: string, code: string) {
  if (!RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured — cannot send OTP email in production.");
    }
    // Dev-only fallback so local testing isn't blocked on an email provider.
    console.log(`[dev] OTP for ${toEmail}: ${code}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: toEmail,
      subject: "Your East & West Travel verification code",
      html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to send OTP email: ${res.status} ${text}`);
  }
}
