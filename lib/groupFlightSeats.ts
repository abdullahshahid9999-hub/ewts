import { prisma } from "@/lib/prisma";

/**
 * Direct (B2C) group-flight bookings hold their seats for 2 hours pending
 * admin confirmation. This releases any that expired unconfirmed, so seat
 * counts stay accurate without a scheduled job — call it right before any
 * seat-availability check (new booking attempt, or listing flights).
 */
export async function releaseExpiredSeatHolds(groupFlightId?: string) {
  const stale = await prisma.booking.findMany({
    where: {
      service: "group_ticket",
      status: "pending",
      expiresAt: { lt: new Date() },
      ...(groupFlightId ? { groupFlightId } : {}),
    },
  });

  for (const b of stale) {
    if (!b.groupFlightId) continue;
    await prisma.$transaction([
      prisma.booking.update({ where: { id: b.id }, data: { status: "expired" } }),
      prisma.groupFlight.update({
        where: { id: b.groupFlightId },
        data: { seats: { increment: b.seatsRequested ?? 1 } },
      }),
    ]);
  }
}
