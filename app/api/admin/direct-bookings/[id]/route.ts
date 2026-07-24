import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_STATUSES = ["pending", "confirmed", "cancelled"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { package: true, travellers: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { package: { include: { roomTypes: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Cancelling a pending/confirmed group-ticket booking releases its held
  // seats back to inventory — they were reserved at booking time now,
  // not left unmanaged the way this table used to work.
  const releasesSeat =
    status === "cancelled" &&
    existing.status !== "cancelled" &&
    existing.status !== "expired" &&
    existing.service === "group_ticket" &&
    existing.groupFlightId;

  const roomType = existing.package?.roomTypes.find((r) => r.roomType === existing.roomTypeLabel);
  const releasesSlots =
    status === "cancelled" &&
    existing.status !== "cancelled" &&
    existing.status !== "expired" &&
    roomType && roomType.availableSlots !== null;
  const slotsHeld = (existing.adults ?? 1) + (existing.children ?? 0) + (existing.infants ?? 0);

  const booking = await prisma
    .$transaction(async (tx) => {
      if (releasesSeat) {
        await tx.groupFlight.update({
          where: { id: existing.groupFlightId! },
          data: { seats: { increment: existing.seatsRequested ?? 1 } },
        });
      }
      if (releasesSlots) {
        await tx.packageRoomType.update({ where: { id: roomType!.id }, data: { availableSlots: { increment: slotsHeld } } });
      }
      return tx.booking.update({ where: { id }, data: { status } });
    })
    .catch(() => null);
  if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ booking });
}
