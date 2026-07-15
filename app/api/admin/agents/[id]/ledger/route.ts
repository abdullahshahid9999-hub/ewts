import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET /api/admin/agents/[id]/ledger
// Returns full agent financial detail:
// - agent profile (balance, creditLimit, tier)
// - all transactions (debits from bookings + credits from topups)
// - all issued bookings with sellPrice, commission, net breakdown
// - all payment slips
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  const [agent, transactions, bookings, paymentSlips] = await Promise.all([
    prisma.agent.findUnique({
      where: { id },
      select: { id: true, agentCode: true, fullName: true, email: true, phone: true, balance: true, creditLimit: true, tier: true, status: true },
    }),
    prisma.agentTransaction.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentBooking.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
      include: { groupFlight: { select: { airline: true, route: true, flightNo: true } } },
    }),
    prisma.paymentSlip.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!agent) return NextResponse.json({ error: "Agent not found." }, { status: 404 });

  // Summary stats
  const issuedBookings = bookings.filter(b => b.status === "issued");
  const totalSell = issuedBookings.reduce((s, b) => s + b.sellPrice, 0);
  const totalCommission = issuedBookings.reduce((s, b) => s + b.commission, 0);
  const totalNetPayable = totalSell - totalCommission;

  const totalCredited = transactions.filter(t => t.type === "credit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalDebited = transactions.filter(t => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);

  return NextResponse.json({
    agent,
    summary: {
      totalSell,
      totalCommission,
      totalNetPayable,
      totalCredited,
      totalDebited,
      balance: agent.balance,
      outstanding: agent.balance < 0 ? -agent.balance : 0,
    },
    transactions,
    bookings,
    paymentSlips,
  });
}
