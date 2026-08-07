import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("agent_refresh_token")?.value;
  if (!refreshToken) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const payload = verifyRefreshToken(refreshToken);
  if (!payload || (payload.role !== "agent" && payload.role !== "agent_user"))
    return NextResponse.json({ error: "Session expired." }, { status: 401 });

  if (payload.role === "agent") {
    const agent = await prisma.agent.findUnique({ where: { id: payload.sub } });
    if (!agent || agent.status !== "active")
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    return NextResponse.json({
      accessToken: signAccessToken({ sub: agent.id, role: "agent" }),
      agent: { id: agent.id, agentCode: agent.agentCode, fullName: agent.fullName, email: agent.email, tier: agent.tier, balance: agent.balance, creditLimit: agent.creditLimit },
      subUser: null,
    });
  }

  // agent_user
  const subUser = await prisma.agentUser.findUnique({ where: { id: payload.sub }, include: { agent: true } });
  if (!subUser || subUser.status !== "active" || subUser.agent.status !== "active")
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  return NextResponse.json({
    accessToken: signAccessToken({ sub: subUser.id, role: "agent_user" }),
    agent: { id: subUser.agent.id, agentCode: subUser.agent.agentCode, fullName: subUser.agent.fullName, email: subUser.agent.email, tier: subUser.agent.tier, balance: subUser.agent.balance, creditLimit: subUser.agent.creditLimit },
    subUser: { id: subUser.id, fullName: subUser.fullName, email: subUser.email, designation: subUser.designation ?? null, permissions: (subUser.permissions ?? {}) as Record<string, boolean> },
  });
}
