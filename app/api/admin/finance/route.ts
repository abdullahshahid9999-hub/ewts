import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

// Read-only reporting endpoint. Two things the owner specifically asked
// for (nothing more was specified, so nothing more is built here):
//   1. Agent-wise balance / outstanding list
//   2. Service-wise revenue breakdown (sum of sellPrice per serviceType)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      agentCode: true,
      fullName: true,
      balance: true,
      creditLimit: true,
      tier: true,
      status: true,
    },
    orderBy: { fullName: "asc" },
  });

  // "Outstanding" = how much of their credit limit is currently used, i.e.
  // negative balance owed back to East & West. balance is stored as a
  // signed PKR figure (see Agent model) — outstanding is just -balance
  // when balance is negative, 0 otherwise.
  const agentBalances = agents.map((a) => ({
    ...a,
    outstanding: a.balance < 0 ? -a.balance : 0,
  }));

  const serviceBreakdown = await prisma.agentBooking.groupBy({
    by: ["serviceType"],
    where: { status: { in: ["confirmed", "issue_requested", "issued"] } },
    _sum: { sellPrice: true, commission: true },
    _count: { _all: true },
  });

  const totalRevenue = serviceBreakdown.reduce((sum, s) => sum + (s._sum.sellPrice ?? 0), 0);
  const totalCommission = serviceBreakdown.reduce((sum, s) => sum + (s._sum.commission ?? 0), 0);

  return NextResponse.json({
    agentBalances,
    serviceBreakdown: serviceBreakdown.map((s) => ({
      serviceType: s.serviceType,
      totalSellPrice: s._sum.sellPrice ?? 0,
      totalCommission: s._sum.commission ?? 0,
      bookingCount: s._count._all,
    })),
    totals: { totalRevenue, totalCommission },
  });
}
