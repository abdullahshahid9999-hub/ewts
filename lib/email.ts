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
  return sendEmail({
    to: toEmail,
    subject: "Your East & West Travel verification code",
    html: `<p>Your verification code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

/**
 * Generic transactional email sender — used for OTP emails and for
 * notifying the business when the public contact form is submitted.
 * Same fallback behavior as sendOtpEmail: logs instead of throwing outside
 * production so local dev isn't blocked without a Resend account.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured — cannot send email in production.");
    }
    console.log(`[dev] Email to ${to}: ${subject}\n${html}`);
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
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to send email: ${res.status} ${text}`);
  }
}
