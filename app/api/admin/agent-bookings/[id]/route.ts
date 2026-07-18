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
  const ticketNumber = typeof body?.ticketNumber === "string" ? body.ticketNumber.trim() : undefined;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await prisma.agentBooking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isBeingIssued = status === "issued" && existing.status !== "issued";

  if (isBeingIssued && existing.serviceType === "group_ticket" && !ticketNumber) {
    return NextResponse.json(
      { error: "A ticket number is required to issue a group-ticket booking." },
      { status: 400 }
    );
  }
  const decrementsSeat =
    isBeingIssued && existing.serviceType === "group_ticket" && existing.groupFlightId;

  const booking = await prisma
    .$transaction(async (tx) => {
      if (decrementsSeat) {
        // Conditional `seats: { gt: 0 }` guard means this affects zero
        // rows if the flight sold out between booking-creation and now —
        // we detect that via count and bail, instead of going negative
        // (the real oversell protection, since creation-time no longer
        // reserves a seat).
        const seatUpdate = await tx.groupFlight.updateMany({
          where: { id: existing.groupFlightId!, seats: { gt: 0 } },
          data: { seats: { decrement: 1 } },
        });
        if (seatUpdate.count === 0) {
          throw new Error("SOLD_OUT");
        }
      }

      if (isBeingIssued) {
        // Agent payable ledger: the moment a booking is issued, the agent
        // owes the office sellPrice minus their (already-snapshotted)
        // commission. Agent.balance sign convention: negative = agent
        // owes the office (see /api/admin/finance's totalReceivable,
        // sum of balance < 0) — so this is a decrement.
        const netOwed = existing.sellPrice - existing.commission;
        await tx.agent.update({
          where: { id: existing.agentId },
          data: { balance: { decrement: netOwed } },
        });
        await tx.agentTransaction.create({
          data: {
            agentId: existing.agentId,
            amount: -netOwed,
            type: "debit",
            note: `Booking issued: ${existing.bookingRef}`,
          },
        });
      }

      return tx.agentBooking.update({
        where: { id },
        data: { status, ticketNumber: ticketNumber || undefined },
      });
    })
    .catch((e) => {
      if (e instanceof Error && e.message === "SOLD_OUT") return null;
      throw e;
    });

  if (!booking) {
    return NextResponse.json({ error: "This flight is sold out — no seats remaining, cannot issue." }, { status: 409 });
  }

  return NextResponse.json({ booking });
}
