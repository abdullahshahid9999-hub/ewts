import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);

  // This is the ONLY route in the system that may write balance,
  // creditLimit, or tier — agent-authenticated routes strip these fields
  // via stripAgentWriteOnlyFields before they ever reach Prisma.
  const data: Record<string, unknown> = {};
  if (typeof body?.fullName === "string") data.fullName = body.fullName;
  if (typeof body?.phone === "string") data.phone = body.phone;
  if (typeof body?.status === "string") data.status = body.status;
  if (typeof body?.tier === "string") data.tier = body.tier;
  if (body?.balance !== undefined) {
    const n = Number(body.balance);
    if (!Number.isFinite(n)) return NextResponse.json({ error: "balance must be a number." }, { status: 400 });
    data.balance = n;
  }
  if (body?.creditLimit !== undefined) {
    const n = Number(body.creditLimit);
    if (!Number.isFinite(n)) return NextResponse.json({ error: "creditLimit must be a number." }, { status: 400 });
    data.creditLimit = n;
  }

  const agent = await prisma.agent.update({ where: { id }, data }).catch(() => null);
  if (!agent) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { passwordHash: _hash, ...safeAgent } = agent;
  return NextResponse.json({ agent: safeAgent });
}
