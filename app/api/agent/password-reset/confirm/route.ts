import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`pwreset-confirm:ip:${ip}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const agentCode = typeof body?.agentCode === "string" ? body.agentCode.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  const genericError = () =>
    NextResponse.json({ error: "Invalid details or code." }, { status: 400 });

  if (!agentCode || !email || !phone || !/^\d{6}$/.test(code)) return genericError();
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { agentCode, email, phone, status: "active" },
  });
  if (!agent) return genericError();

  const otp = await prisma.agentOtp.findFirst({
    where: {
      agentId: agent.id,
      purpose: "password_reset",
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return genericError();

  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Request a new code." },
      { status: 429 }
    );
  }

  if (otp.otpCode !== code) {
    await prisma.agentOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return genericError();
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.agentOtp.update({ where: { id: otp.id }, data: { used: true } }),
    prisma.agent.update({ where: { id: agent.id }, data: { passwordHash } }),
  ]);

  return NextResponse.json({ ok: true });
}
