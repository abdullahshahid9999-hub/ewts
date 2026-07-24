import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_STATUSES = ["pending", "confirmed", "issue_requested", "issued", "cancelled", "expired"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  const ticketNumber = typeof body?.ticketNumber === "string" ? body.ticketNumber.trim() : undefined;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await prisma.agentBooking.findUnique({
    where: { id },
    include: { package: { include: { roomTypes: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isBeingIssued = status === "issued" && existing.status !== "issued";
  if (isBeingIssued && existing.serviceType === "group_ticket" && !ticketNumber) {
    return NextResponse.json(
      { error: "A ticket number is required to issue a group-ticket booking." },
      { status: 400 }
    );
  }

  // Seats/slots were already held (decremented) at booking creation time —
  // see /api/agent/bookings POST. Issuing just confirms the hold; nothing
  // to touch here for inventory. Cancelling a still-held (not yet expired)
  // booking releases it back.
  const releasesInventory = status === "cancelled" && existing.status !== "cancelled" && existing.status !== "expired";
  const roomType = existing.package?.roomTypes.find((r) => r.roomType === existing.roomTypeLabel);
  const slotsHeld = (existing.adults ?? 1) + (existing.children ?? 0) + (existing.infants ?? 0);

  const booking = await prisma
    .$transaction(async (tx) => {
      if (releasesInventory && existing.serviceType === "group_ticket" && existing.groupFlightId) {
        await tx.groupFlight.update({ where: { id: existing.groupFlightId }, data: { seats: { increment: 1 } } });
      }
      if (releasesInventory && roomType && roomType.availableSlots !== null) {
        await tx.packageRoomType.update({ where: { id: roomType.id }, data: { availableSlots: { increment: slotsHeld } } });
      }

      if (isBeingIssued) {
        // Agent payable ledger: the moment a booking is issued, the agent
        // owes the office sellPrice minus their (already-snapshotted)
        // commission. Agent.balance sign convention: negative = agent
        // owes the office (see /api/admin/finance's totalReceivable,
        // sum of balance < 0) — so this is a decrement.
        const netOwed = existing.sellPrice - existing.commission;
        await tx.agent.update({ where: { id: existing.agentId }, data: { balance: { decrement: netOwed } } });
        await tx.agentTransaction.create({
          data: { agentId: existing.agentId, amount: -netOwed, type: "debit", note: `Booking issued: ${existing.bookingRef}` },
        });
      }

      return tx.agentBooking.update({
        where: { id },
        data: { status, ticketNumber: ticketNumber || undefined, issuedAt: isBeingIssued ? new Date() : undefined },
      });
    });

  return NextResponse.json({ booking });
}
