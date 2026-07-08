import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("agent_refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload || payload.role !== "agent") {
    return NextResponse.json({ error: "Session expired, please log in again." }, { status: 401 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: payload.sub } });
  if (!agent || agent.status !== "active") {
    return NextResponse.json({ error: "Session expired, please log in again." }, { status: 401 });
  }

  const accessToken = signAccessToken({ sub: agent.id, role: "agent" });
  return NextResponse.json({
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
}
