import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

  // IP-level rate limit (fast fail before DB hit)
  if (!checkRateLimit(`agent-login:ip:${ip}`, 20, 10 * 60 * 1000))
    return NextResponse.json({ error: "Too many attempts from your network. Try again in 10 minutes." }, { status: 429 });

  const genericError = () =>
    NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const agent = await prisma.agent.findUnique({ where: { email } });
  if (!agent) return genericError();

  if (agent.status !== "active")
    return NextResponse.json({ error: "This account is suspended. Contact the office." }, { status: 403 });

  // DB-level lockout check
  if (agent.lockedUntil && agent.lockedUntil > new Date()) {
    const remaining = Math.ceil((agent.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Account locked due to too many failed attempts. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.` },
      { status: 429 }
    );
  }

  const valid = await verifyPassword(password, agent.passwordHash);

  if (!valid) {
    const newAttempts = agent.loginAttempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        loginAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    });
    if (shouldLock) {
      return NextResponse.json(
        { error: `Too many failed attempts. Account locked for 15 minutes.` },
        { status: 429 }
      );
    }
    return genericError();
  }

  // Reset attempts on successful login
  await prisma.agent.update({
    where: { id: agent.id },
    data: { loginAttempts: 0, lockedUntil: null },
  });

  // 2FA check
  if (agent.totpEnabled && agent.totpSecret) {
    const totpCode = typeof body?.totpCode === "string" ? body.totpCode.trim() : "";
    if (!totpCode) return NextResponse.json({ requires2FA: true }, { status: 200 });
    const { verifyTotp } = await import("@/lib/totp");
    if (!verifyTotp(agent.totpSecret, totpCode))
      return NextResponse.json({ error: "Invalid 2FA code. Try again." }, { status: 401 });
  }

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
      balance: agent.balance,
      creditLimit: agent.creditLimit,
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
