import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_STATUSES = ["pending", "confirmed", "issue_requested", "issued", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await prisma.agentBooking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Cancelling a previously-non-cancelled group ticket releases its seat
  // back to inventory. Guarded so re-cancelling an already-cancelled
  // booking (or any other status transition) never double-restores.
  const releasesSeat =
    status === "cancelled" && existing.status !== "cancelled" &&
    existing.serviceType === "group_ticket" && existing.groupFlightId;

  const booking = await prisma
    .$transaction(async (tx) => {
      if (releasesSeat) {
        await tx.groupFlight.update({
          where: { id: existing.groupFlightId! },
          data: { seats: { increment: 1 } },
        });
      }
      return tx.agentBooking.update({ where: { id }, data: { status } });
    })
    .catch(() => null);
  if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ booking });
}
