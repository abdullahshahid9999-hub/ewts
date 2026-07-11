import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// Route Handlers are cached by Next.js by default — force fresh so the
// dashboard doesn't show stale counts right after an admin action.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalAgents,
    pendingAgentBookings,
    activePackages,
    activeGroupFlights,
    activeVisaServices,
    revenueThisMonthAgg,
    payableAgg,
  ] = await Promise.all([
    prisma.agent.count(),
    prisma.agentBooking.count({ where: { status: { in: ["pending", "issue_requested"] } } }),
    prisma.package.count({ where: { status: "active" } }),
    prisma.groupFlight.count({ where: { status: "active" } }),
    prisma.visaService.count({ where: { status: "active" } }),
    // Revenue this month = sum of sellPrice for bookings ISSUED this
    // month. Uses updatedAt as the issue-time marker since AgentBooking
    // has no dedicated issuedAt column — status flips to "issued" via the
    // PATCH route and updatedAt is bumped by Prisma automatically at the
    // same moment.
    prisma.agentBooking.aggregate({
      where: { status: "issued", updatedAt: { gte: monthStart } },
      _sum: { sellPrice: true },
    }),
    // Total payable owed BY agents TO the office = sum of the negative
    // portion of Agent.balance (negative = agent owes, per the sign
    // convention already established in /api/admin/finance). Summed as
    // absolute value so this reads as a plain PKR amount owed.
    prisma.agent.aggregate({
      where: { balance: { lt: 0 } },
      _sum: { balance: true },
    }),
  ]);

  return NextResponse.json({
    totalAgents,
    pendingAgentBookings,
    totalActiveListings: activePackages + activeGroupFlights + activeVisaServices,
    listingsBreakdown: {
      packages: activePackages,
      groupFlights: activeGroupFlights,
      visaServices: activeVisaServices,
    },
    revenueThisMonth: revenueThisMonthAgg._sum.sellPrice ?? 0,
    totalPayable: Math.abs(payableAgg._sum.balance ?? 0),
  });
}
