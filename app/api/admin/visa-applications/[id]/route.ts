import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_STATUSES = ["pending", "under_review", "approved", "rejected", "more_info_needed"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  const { status, adminNote } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const existing = await prisma.visaApplication.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  // Same convention as AgentBooking issuance: debit the agent's balance
  // and log an AgentTransaction the moment a decision moves an
  // agent-submitted application into "approved" — never on direct/B2C
  // applications (agentId null, commission null, nothing to charge).
  // Known edge case (documented for bookings too, applies here as well):
  // if a booking somehow goes approved → rejected → approved again this
  // would fire a second time. Not currently guarded against.
  const isBeingApproved = status === "approved" && existing.status !== "approved" && existing.agentId && existing.commission !== null;

  const application = await prisma.$transaction(async (tx) => {
    if (isBeingApproved) {
      const netOwed = existing.totalPricePkr - (existing.commission ?? 0);
      await tx.agent.update({ where: { id: existing.agentId! }, data: { balance: { decrement: netOwed } } });
      await tx.agentTransaction.create({
        data: { agentId: existing.agentId!, amount: -netOwed, type: "debit", note: `Visa application approved: ${existing.batchRef}` },
      });
    }
    return tx.visaApplication.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote: adminNote?.trim() || null }),
      },
    });
  });

  return NextResponse.json({ application });
}
