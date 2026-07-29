import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { createHash, randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  // Always return success to prevent email enumeration
  const agent = await prisma.agent.findUnique({ where: { email } });
  if (!agent) return NextResponse.json({ ok: true });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate existing tokens for this email
  await prisma.passwordResetToken.deleteMany({ where: { email, type: "agent" } });

  await prisma.passwordResetToken.create({
    data: { tokenHash, email, type: "agent", expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://eastwestpk.com"}/agent/reset-password?token=${rawToken}`;

  await sendEmail({
    to: email,
    subject: "Reset your East & West Travel password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#071120">Password Reset Request</h2>
        <p>Hi ${agent.fullName},</p>
        <p>Click the button below to reset your agent portal password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#D4A843;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
        <p style="color:#666;font-size:12px">If you didn't request this, ignore this email — your password won't change.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
