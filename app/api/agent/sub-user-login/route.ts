import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Email and password required." }, { status: 400 });

  const genericErr = () => NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const subUser = await prisma.agentUser.findUnique({ where: { email }, include: { agent: true } });
  if (!subUser) return genericErr();
  if (subUser.status !== "active") return NextResponse.json({ error: "Account suspended. Contact your agency." }, { status: 403 });
  if (subUser.agent.status !== "active") return NextResponse.json({ error: "Agency account suspended." }, { status: 403 });

  if (subUser.lockedUntil && subUser.lockedUntil > new Date()) {
    const mins = Math.ceil((subUser.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json({ error: `Account locked. Try again in ${mins} min.` }, { status: 429 });
  }

  const valid = await verifyPassword(password, subUser.passwordHash);
  if (!valid) {
    const attempts = subUser.loginAttempts + 1;
    await prisma.agentUser.update({ where: { id: subUser.id }, data: { loginAttempts: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60000) : null } });
    return genericErr();
  }

  await prisma.agentUser.update({ where: { id: subUser.id }, data: { loginAttempts: 0, lockedUntil: null } });

  const accessToken = signAccessToken({ sub: subUser.id, role: "agent_user" });
  const refreshToken = signRefreshToken({ sub: subUser.id, role: "agent_user" });
  const a = subUser.agent;

  const res = NextResponse.json({
    accessToken,
    agent: { id: a.id, agentCode: a.agentCode, fullName: a.fullName, email: a.email, tier: a.tier, balance: a.balance, creditLimit: a.creditLimit },
    subUser: { id: subUser.id, fullName: subUser.fullName, email: subUser.email, designation: subUser.designation ?? null, permissions: (subUser.permissions ?? {}) as Record<string, boolean> },
    mustChangePassword: subUser.mustChangePassword,
  });
  res.cookies.set("agent_refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", path: "/api/agent/refresh", maxAge: 30 * 24 * 60 * 60 });
  return res;
}
