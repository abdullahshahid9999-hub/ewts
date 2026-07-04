import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Rate-limit brute-force attempts per IP + per email, not just per IP,
  // so an attacker can't spread guesses across many emails from one IP
  // undetected, nor hammer one email from rotating IPs undetected.
  if (!checkRateLimit(`agent-login:ip:${ip}`, 20, 10 * 60 * 1000) ||
      !checkRateLimit(`agent-login:email:${email}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const agent = await prisma.agent.findUnique({ where: { email } });

  // Same generic error whether the email doesn't exist or the password is
  // wrong — never reveal which one it was (account enumeration).
  const genericError = () =>
    NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (!agent) return genericError();
  if (agent.status !== "active") {
    return NextResponse.json({ error: "This account is suspended. Contact the office." }, { status: 403 });
  }

  const valid = await verifyPassword(password, agent.passwordHash);
  if (!valid) return genericError();

  const accessToken = signAccessToken({ sub: agent.id, role: "agent" });
  const refreshToken = signRefreshToken({ sub: agent.id, role: "agent" });

  const res = NextResponse.json({
    accessToken,
    agent: {
      id: agent.id,
      agentCode: agent.agentCode,
      fullName: agent.fullName,
      email: agent.email,
      tier: agent.tier,
    },
  });

  res.cookies.set("agent_refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/agent/refresh",
    maxAge: 30 * 24 * 60 * 60,
  });

  return res;
}
