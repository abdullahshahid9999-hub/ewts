import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const src = await prisma.package.findUnique({ where: { id }, include: { roomTypes: { orderBy: { sortOrder: "asc" } } } });
  if (!src) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const copy = await prisma.package.create({
    data: {
      category: src.category,
      name: `${src.name} (Copy)`,
      slug: src.slug ? `${src.slug}-copy-${Date.now().toString(36)}` : null,
      duration: src.duration,
      depDate: src.depDate,
      retDate: src.retDate,
      airline: src.airline,
      route: src.route,
      hotels: src.hotels,
      price: src.price,
      destination: src.destination,
      departureCity: src.departureCity,
      tier: src.tier,
      includes: src.includes,
      excludes: src.excludes,
      itinerary: src.itinerary as never,
      flightSectors: src.flightSectors as never,
      imageUrl: src.imageUrl,
      galleryUrls: src.galleryUrls as never,
      featured: false,
      status: "inactive",
      copyEnabled: src.copyEnabled,
      groupTicketEnabled: src.groupTicketEnabled,
      visaEnabled: src.visaEnabled,
      roomTypes: {
        create: src.roomTypes.map(({ id: _rid, packageId: _pid, createdAt: _rc, updatedAt: _ru, ...rt }) => {
          void _rid; void _pid; void _rc; void _ru;
          return rt;
        }),
      },
    },
  });

  return NextResponse.json({ package: copy }, { status: 201 });
}
