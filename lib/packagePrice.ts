import { prisma } from "@/lib/prisma";

export function formatPkr(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

// The package's legacy `price` field (shown on listing cards on the public
// site) is derived, not hand-typed by the admin: it's always the lowest
// per-person room price currently on the package. In practice that's
// almost always the Quad room, since more people sharing a room is
// normally the cheapest per-head option — but this picks whichever room
// type is actually lowest rather than hardcoding "Quad", in case an admin
// sets up a package without one or prices it unusually.
export function computeDisplayPrice(roomTypes: { pricePerPersonPkr: number }[]): string | null {
  if (roomTypes.length === 0) return null;
  const lowest = Math.min(...roomTypes.map((rt) => rt.pricePerPersonPkr));
  return formatPkr(lowest);
}

// Recomputes and persists Package.price from whatever room types exist on
// it right now. Called after every room-type create/update/delete so the
// listing-card price can never drift out of sync with the real bookable
// per-person prices.
export async function syncPackageDisplayPrice(packageId: string) {
  const roomTypes = await prisma.packageRoomType.findMany({
    where: { packageId },
    select: { pricePerPersonPkr: true },
  });
  const price = computeDisplayPrice(roomTypes);
  await prisma.package.update({ where: { id: packageId }, data: { price } });
  return price;
}
