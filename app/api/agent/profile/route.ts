import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { verifyPassword, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Deliberately excludes balance/creditLimit/tier from being editable —
  // this route only ever reads them, never a target of PATCH from here.
  return NextResponse.json({
    agent: {
      id: agent.id,
      agentCode: agent.agentCode,
      fullName: agent.fullName,
      email: agent.email,
      phone: agent.phone,
      tier: agent.tier,
      balance: agent.balance,
      creditLimit: agent.creditLimit,
    },
  });
}

// Password change while logged in — requires the current password, not
// just a valid session, so a hijacked/left-open session alone can't be
// used to lock the real owner out.
export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Current password and a new password (min 8 characters) are required." },
      { status: 400 }
    );
  }

  const valid = await verifyPassword(currentPassword, agent.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.agent.update({ where: { id: agent.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
