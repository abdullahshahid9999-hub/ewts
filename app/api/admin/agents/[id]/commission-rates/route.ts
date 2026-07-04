import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_SERVICE_TYPES = ["umrah", "group_ticket", "insurance"];
const VALID_RATE_TYPES = ["fixed", "percentage"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id: agentId } = await params;
  const body = await req.json().catch(() => null);
  const serviceType = body?.serviceType;
  const rateType = body?.rateType;
  const value = Number(body?.value);

  if (!VALID_SERVICE_TYPES.includes(serviceType)) {
    return NextResponse.json({ error: "Invalid serviceType." }, { status: 400 });
  }
  if (!VALID_RATE_TYPES.includes(rateType)) {
    return NextResponse.json({ error: "rateType must be 'fixed' or 'percentage'." }, { status: 400 });
  }
  if (!Number.isFinite(value) || value < 0) {
    return NextResponse.json({ error: "value must be a non-negative number." }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found." }, { status: 404 });

  // Upsert — this always reflects the CURRENT rate. Past AgentBooking rows
  // already have their commission snapshotted at creation time and are
  // never touched by this change (see lib/commission.ts).
  const rate = await prisma.agentCommissionRate.upsert({
    where: { agentId_serviceType: { agentId, serviceType } },
    create: { agentId, serviceType, rateType, value },
    update: { rateType, value },
  });

  return NextResponse.json({ rate }, { status: 201 });
}
