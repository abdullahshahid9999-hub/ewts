import { prisma } from "@/lib/prisma";

/**
 * Group-flight seats are held for 2 hours pending confirmation — for BOTH
 * direct (B2C, public Booking) and agent (AgentBooking) bookings. This
 * releases any that expired unconfirmed, so seat counts stay accurate
 * without a scheduled job — call it right before any seat-availability
 * check (new booking attempt, or listing flights).
 */
export async function releaseExpiredSeatHolds(groupFlightId?: string) {
  const staleDirect = await prisma.booking.findMany({
    where: {
      service: "group_ticket",
      status: "pending",
      expiresAt: { lt: new Date() },
      ...(groupFlightId ? { groupFlightId } : {}),
    },
  });

  for (const b of staleDirect) {
    if (!b.groupFlightId) continue;
    await prisma.$transaction([
      prisma.booking.update({ where: { id: b.id }, data: { status: "expired" } }),
      prisma.groupFlight.update({
        where: { id: b.groupFlightId },
        data: { seats: { increment: b.seatsRequested ?? 1 } },
      }),
    ]);
  }

  const staleAgent = await prisma.agentBooking.findMany({
    where: {
      serviceType: "group_ticket",
      status: "pending",
      expiresAt: { lt: new Date() },
      ...(groupFlightId ? { groupFlightId } : {}),
    },
  });

  for (const b of staleAgent) {
    if (!b.groupFlightId) continue;
    await prisma.$transaction([
      prisma.agentBooking.update({ where: { id: b.id }, data: { status: "expired" } }),
      prisma.groupFlight.update({
        where: { id: b.groupFlightId },
        data: { seats: { increment: 1 } }, // agent group-ticket bookings are always 1 seat per row
      }),
    ]);
  }
}
