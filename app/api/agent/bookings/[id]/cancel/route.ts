import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

// An agent can cancel their OWN booking as long as it hasn't been issued
// yet — once issued, the payable ledger and (for group tickets) the seat
// decrement have already happened, so that's an admin-only reversal (see
// admin/agent-bookings/[id] PATCH), not a simple self-service cancel.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.agentBooking.findUnique({ where: { id } });
  if (!booking || booking.agentId !== agent.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.status === "issued") {
    return NextResponse.json(
      { error: "This booking has already been issued — contact the office to cancel it." },
      { status: 400 }
    );
  }
  if (booking.status === "cancelled") {
    return NextResponse.json({ booking }); // already cancelled, no-op
  }

  const updated = await prisma.agentBooking.update({
    where: { id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ booking: updated });
}
