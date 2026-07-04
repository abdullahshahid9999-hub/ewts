import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendOtpEmail } from "@/lib/email";

const OTP_TTL_MS = 10 * 60 * 1000;

// Pre-login password reset. Requires agentCode + email + phone to all match
// the same agent row — this three-way match is the identity check since
// there's no session yet. Always returns the same generic message whether
// or not a match was found, so this endpoint can't be used to enumerate
// which agent codes/emails/phones exist in the system.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`pwreset-request:ip:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const agentCode = typeof body?.agentCode === "string" ? body.agentCode.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  const generic = NextResponse.json({
    ok: true,
    message:
      "If those details match an account, a verification code has been sent to the registered email.",
  });

  if (!agentCode || !email || !phone) return generic;

  // Also rate-limit by the submitted agent code so repeated guesses against
  // one specific account are throttled even from rotating IPs.
  if (!checkRateLimit(`pwreset-request:code:${agentCode}`, 5, 10 * 60 * 1000)) {
    return generic;
  }

  const agent = await prisma.agent.findFirst({
    where: { agentCode, email, phone, status: "active" },
  });

  if (!agent) return generic;

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.agentOtp.create({
    data: { agentId: agent.id, otpCode: code, purpose: "password_reset", expiresAt },
  });

  await sendOtpEmail(agent.email, code);

  return generic;
}
