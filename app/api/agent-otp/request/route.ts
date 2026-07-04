import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendOtpEmail } from "@/lib/email";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  // This endpoint requires a valid JWT — it is only ever used for actions
  // an already-authenticated agent takes (e.g. confirming an issue
  // request), NOT for pre-login password reset. It never accepts an email
  // address in the request body; the OTP always goes to the agent's own
  // registered email on file.
  const agent = await requireAgent(req);
  if (!agent) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const purpose = body?.purpose === "password_reset" ? "password_reset" : "issue_request";

  if (!checkRateLimit(`otp-request:${agent.id}`, MAX_REQUESTS_PER_WINDOW, REQUEST_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many OTP requests. Please wait before trying again." },
      { status: 429 }
    );
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.agentOtp.create({
    data: {
      agentId: agent.id,
      otpCode: code,
      purpose,
      expiresAt,
    },
  });

  // The OTP is emailed to the agent's own registered address only — never
  // returned in this response, and never sent anywhere the client asked
  // for.
  await sendOtpEmail(agent.email, code);

  return NextResponse.json({ ok: true, expiresInSeconds: OTP_TTL_MS / 1000 });
}
