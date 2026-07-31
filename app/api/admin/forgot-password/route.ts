import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isAllowedAdminEmail } from "@/lib/auth";
import { createHash, randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`admin-forgot-pw:ip:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  if (!checkRateLimit(`admin-forgot-pw:email:${email}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: true });
  }

  if (!isAllowedAdminEmail(email)) return NextResponse.json({ ok: true }); // silent

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return NextResponse.json({ ok: true });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { email, type: "admin" } });
  await prisma.passwordResetToken.create({ data: { tokenHash, email, type: "admin", expiresAt } });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://eastwestpk.com"}/admin/reset-password?token=${rawToken}`;

  await sendEmail({
    to: email,
    subject: "Reset your East & West Admin password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#071120">Admin Password Reset</h2>
        <p>Hi ${admin.fullName ?? "Admin"},</p>
        <p>Click below to reset your admin password. Expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#D4A843;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
        <p style="color:#666;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
