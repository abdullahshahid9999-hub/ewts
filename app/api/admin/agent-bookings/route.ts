import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  // Single combined where-clause — same AND-logic guard as the agent-side
  // bookings list, so these two filters can't silently overwrite each
  // other the way the legacy admin panel did.
  const where: Record<string, unknown> = {};
  if (category) where.serviceType = category;
  if (status) where.status = status;

  const agentBookings = await prisma.agentBooking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { agentCode: true, fullName: true } }, groupFlight: true },
  });

  return NextResponse.json({ agentBookings });
}
