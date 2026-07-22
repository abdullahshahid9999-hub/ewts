import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  try {
    const flight = await prisma.groupFlight.findUnique({ where: { id } });
    if (!flight) return NextResponse.json({ error: "Flight not found." }, { status: 404 });

    const [directBookings, agentBookings] = await Promise.all([
      prisma.booking.findMany({ where: { groupFlightId: id }, orderBy: { createdAt: "desc" } }),
      prisma.agentBooking.findMany({
        where: { groupFlightId: id, serviceType: "group_ticket" },
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { agentCode: true, fullName: true } } },
      }),
    ]);

    return NextResponse.json({ flight, directBookings, agentBookings });
  } catch (e) {
    console.error("Group flight bookings list failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to load bookings." }, { status: 500 });
  }
}
