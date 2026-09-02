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
      // V2 fields — all copied
      cardVersion: src.cardVersion,
      flightType: src.flightType,
      luggage: src.luggage,
      transportType: src.transportType,
      totalSeats: src.totalSeats,
      makkahHotel: src.makkahHotel,
      makkahHotelDistance: src.makkahHotelDistance,
      makkahHotelNights: src.makkahHotelNights,
      makkahHotelImg: src.makkahHotelImg,
      madinahHotel: src.madinahHotel,
      madinahHotelDistance: src.madinahHotelDistance,
      madinahHotelNights: src.madinahHotelNights,
      madinahHotelImg: src.madinahHotelImg,
      roomTypes: {
        create: src.roomTypes.map(({ id: _rid, packageId: _pid, ...rt }) => {
          void _rid; void _pid;
          return rt;
        }),
      },
    },
  });

  return NextResponse.json({ package: copy }, { status: 201 });
}
