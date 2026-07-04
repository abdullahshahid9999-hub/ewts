import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const submittedCode = typeof body?.code === "string" ? body.code.trim() : "";
  const purpose = body?.purpose === "password_reset" ? "password_reset" : "issue_request";

  if (!/^\d{6}$/.test(submittedCode)) {
    return NextResponse.json({ error: "Invalid code format." }, { status: 400 });
  }

  // Most recent unused, unexpired OTP for this agent + purpose.
  const otp = await prisma.agentOtp.findFirst({
    where: {
      agentId: agent.id,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "Code expired or not found. Request a new one." }, { status: 400 });
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
  }

  if (otp.otpCode !== submittedCode) {
    await prisma.agentOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  await prisma.agentOtp.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return NextResponse.json({ ok: true });
}
