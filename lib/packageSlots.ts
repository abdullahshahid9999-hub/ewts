import { prisma } from "@/lib/prisma";

/**
 * PackageRoomType.availableSlots (when set — null means unlimited/
 * untracked) is held for 2 hours pending confirmation, same pattern as
 * group-flight seats. Releases any expired unconfirmed holds so slot
 * counts stay accurate without a scheduled job.
 */
export async function releaseExpiredSlotHolds(roomTypeId?: string) {
  const staleDirect = await prisma.booking.findMany({
    where: {
      service: { in: ["umrah", "tours"] },
      status: "pending",
      expiresAt: { lt: new Date() },
      ...(roomTypeId ? { roomTypeLabel: { not: null } } : {}), // roomTypeId not stored directly; filtered below
    },
    include: { package: { include: { roomTypes: true } } },
  });

  for (const b of staleDirect) {
    const rt = b.package?.roomTypes.find((r) => r.roomType === b.roomTypeLabel);
    if (!rt || rt.availableSlots === null) continue;
    if (roomTypeId && rt.id !== roomTypeId) continue;
    const slots = (b.adults ?? 1) + (b.children ?? 0) + (b.infants ?? 0);
    await prisma.$transaction([
      prisma.booking.update({ where: { id: b.id }, data: { status: "expired" } }),
      prisma.packageRoomType.update({ where: { id: rt.id }, data: { availableSlots: { increment: slots } } }),
    ]);
  }

  const staleAgent = await prisma.agentBooking.findMany({
    where: {
      serviceType: { in: ["umrah", "tours"] },
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    include: { package: { include: { roomTypes: true } } },
  });

  for (const b of staleAgent) {
    const rt = b.package?.roomTypes.find((r) => r.roomType === b.roomTypeLabel);
    if (!rt || rt.availableSlots === null) continue;
    if (roomTypeId && rt.id !== roomTypeId) continue;
    const slots = (b.adults ?? 1) + (b.children ?? 0) + (b.infants ?? 0);
    await prisma.$transaction([
      prisma.agentBooking.update({ where: { id: b.id }, data: { status: "expired" } }),
      prisma.packageRoomType.update({ where: { id: rt.id }, data: { availableSlots: { increment: slots } } }),
    ]);
  }
}
