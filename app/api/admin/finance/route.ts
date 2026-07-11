import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

const OUTSTANDING_STATUSES = ["confirmed", "issue_requested", "issued"] as const;

// Read-only reporting endpoint.
//   1. Agent-wise balance / outstanding list (always current/real-time —
//      see note below on why this is NOT date-filtered)
//   2. Service-wise revenue breakdown (sum of sellPrice per serviceType),
//      scoped to AgentBooking.createdAt within the optional ?from/&to range
//   3. Per-agent booking activity within that same range (bookings placed,
//      sell price, commission, net-owed-from-those-bookings)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : null;
  // "to" is a calendar date from a date-input, so treat it as inclusive of
  // the whole day by pushing to the start of the next day.
  const to = toParam ? new Date(toParam) : null;
  const toExclusive = to ? new Date(to.getTime() + 24 * 60 * 60 * 1000) : null;

  const createdAtFilter: { gte?: Date; lt?: Date } | undefined =
    from || toExclusive
      ? {
          ...(from && !isNaN(from.getTime()) ? { gte: from } : {}),
          ...(toExclusive && !isNaN(toExclusive.getTime()) ? { lt: toExclusive } : {}),
        }
      : undefined;

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
  //
  // IMPORTANT: balance is a cumulative running total (debited by
  // performIssue(), credited by approved payment slips) — it has no date
  // axis of its own, so it CANNOT be recomputed "as of" an arbitrary past
  // date range from AgentBooking rows alone. The Total Receivable /
  // per-agent balance figures below are therefore always the current,
  // real-time numbers regardless of the from/to filter — matching the
  // brief's own framing ("total money the business is owed right now").
  // The date filter instead scopes a *separate* "activity in this range"
  // figure per agent (rangeSellPrice/rangeCommission/rangeNet below), so
  // the owner can see what was booked in a given window without that
  // being confused for a recomputed historical balance.
  const agentBalances = agents.map((a) => ({
    ...a,
    outstanding: a.balance < 0 ? -a.balance : 0,
  }));

  const totalReceivable = agentBalances.reduce((sum, a) => sum + a.outstanding, 0);

  const serviceBreakdown = await prisma.agentBooking.groupBy({
    by: ["serviceType"],
    where: { status: { in: [...OUTSTANDING_STATUSES] }, ...(createdAtFilter ? { createdAt: createdAtFilter } : {}) },
    _sum: { sellPrice: true, commission: true },
    _count: { _all: true },
  });

  const totalRevenue = serviceBreakdown.reduce((sum: number, s) => sum + (s._sum.sellPrice ?? 0), 0);
  const totalCommission = serviceBreakdown.reduce((sum: number, s) => sum + (s._sum.commission ?? 0), 0);

  // Per-agent activity within the selected range — separate from the
  // always-current balance/outstanding columns above (see note).
  const agentRangeActivity = await prisma.agentBooking.groupBy({
    by: ["agentId"],
    where: { status: { in: [...OUTSTANDING_STATUSES] }, ...(createdAtFilter ? { createdAt: createdAtFilter } : {}) },
    _sum: { sellPrice: true, commission: true },
    _count: { _all: true },
  });

  const rangeByAgentId = new Map(
    agentRangeActivity.map((r) => [
      r.agentId,
      {
        rangeBookingCount: r._count._all,
        rangeSellPrice: r._sum.sellPrice ?? 0,
        rangeCommission: r._sum.commission ?? 0,
        rangeNet: (r._sum.sellPrice ?? 0) - (r._sum.commission ?? 0),
      },
    ])
  );

  const agentBalancesWithRange = agentBalances.map((a) => ({
    ...a,
    ...(rangeByAgentId.get(a.id) ?? {
      rangeBookingCount: 0,
      rangeSellPrice: 0,
      rangeCommission: 0,
      rangeNet: 0,
    }),
  }));

  return NextResponse.json({
    agentBalances: agentBalancesWithRange,
    serviceBreakdown: serviceBreakdown.map((s) => ({
      serviceType: s.serviceType,
      totalSellPrice: s._sum.sellPrice ?? 0,
      totalCommission: s._sum.commission ?? 0,
      bookingCount: s._count._all,
    })),
    totals: { totalRevenue, totalCommission, totalReceivable },
    range: { from: fromParam, to: toParam },
  });
}
