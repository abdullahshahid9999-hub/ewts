import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { verifyAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword     = typeof body?.newPassword     === "string" ? body.newPassword     : "";

  if (newPassword.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });

  // Determine if this is agent or staff from token
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (payload.role === "agent_user") {
    // Staff member
    const staff = await prisma.agentUser.findUnique({ where: { id: payload.sub }, select: { id: true, passwordHash: true } });
    if (!staff) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (currentPassword && !await verifyPassword(currentPassword, staff.passwordHash))
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    await prisma.agentUser.update({ where: { id: staff.id }, data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false } });
  } else {
    // Agent owner
    const agent = await requireAgent(req);
    if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const full = await prisma.agent.findUnique({ where: { id: agent.id }, select: { passwordHash: true } });
    if (!full) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (currentPassword && !await verifyPassword(currentPassword, full.passwordHash))
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    await prisma.agent.update({ where: { id: agent.id }, data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false } });
  }

  return NextResponse.json({ ok: true });
}
