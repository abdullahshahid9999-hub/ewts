import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";
import { computeDisplayPrice } from "@/lib/packagePrice";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

// GET is intentionally open (packages are public content, matching the
// public site's read-only queries) — only writes require admin auth.
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: "desc" },
      include: { roomTypes: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ packages });
  } catch (e) {
    // Without this, any DB error (e.g. a table the admin query joins
    // against — like package_room_types — missing because a migration
    // wasn't run) causes a bare 500, and the frontend's `data.packages ?? []`
    // fallback silently shows an empty list with zero indication anything
    // is wrong. Surface it instead.
    console.error("GET /api/admin/packages failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? `Could not load packages: ${e.message}` : "Could not load packages." },
      { status: 500 }
    );
  }
}

/**
 * Accepts multipart/form-data so a single request can carry both the
 * package fields and an optional image file. The client is expected to
 * have already compressed the image to ~1280px/JPEG q0.8 before upload
 * (see admin panel brief) — this route re-validates content type but does
 * not re-compress server-side.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData();

  const category = form.get("category");
  const name = form.get("name");
  if (typeof category !== "string" || typeof name !== "string" || !category || !name) {
    return NextResponse.json({ error: "category and name are required." }, { status: 400 });
  }
  if (category !== "umrah" && category !== "tours") {
    return NextResponse.json({ error: "category must be 'umrah' or 'tours'." }, { status: 400 });
  }

  let imageUrl: string | undefined;
  const file = form.get("image");
  if (file instanceof File) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await uploadToR2({ buffer, contentType: file.type, folder: "packages" });
    } catch (e) {
      console.error("Package image upload failed:", e);
      return NextResponse.json(
        { error: e instanceof Error ? `Image upload failed: ${e.message}` : "Image upload failed." },
        { status: 500 }
      );
    }
  }

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  let itinerary: unknown;
  const itineraryRaw = form.get("itinerary");
  if (typeof itineraryRaw === "string" && itineraryRaw.length > 0) {
    try {
      itinerary = JSON.parse(itineraryRaw);
    } catch {
      return NextResponse.json({ error: "Itinerary is not valid JSON." }, { status: 400 });
    }
  }

  let flightSectors: unknown;
  const sectorsRaw = form.get("flightSectors");
  if (typeof sectorsRaw === "string" && sectorsRaw.length > 0) {
    try {
      flightSectors = JSON.parse(sectorsRaw);
    } catch {
      return NextResponse.json({ error: "Flight sectors is not valid JSON." }, { status: 400 });
    }
  }

  // Room basis division (Quad/Triple/Double/... per-person pricing) can
  // now be submitted together with the package itself, instead of only
  // being addable after the package already exists. Each entry mirrors
  // the shape POST /api/admin/packages/[id]/room-types accepts.
  type RoomTypeInput = {
    roomType: string;
    pricePerPersonPkr: number;
    pricePerInfantPkr?: number;
    pricePerChildPkr?: number;
    maxAdults: number;
    maxInfants?: number;
    minAdultsRequired?: number | null;
    sortOrder?: number;
  };
  let roomTypesInput: RoomTypeInput[] = [];
  const roomTypesRaw = form.get("roomTypes");
  if (typeof roomTypesRaw === "string" && roomTypesRaw.length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(roomTypesRaw);
    } catch {
      return NextResponse.json({ error: "Room types is not valid JSON." }, { status: 400 });
    }
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ error: "Room types must be an array." }, { status: 400 });
    }
    for (const rt of parsed) {
      const roomType = typeof rt?.roomType === "string" ? rt.roomType.trim() : "";
      const pricePerPersonPkr = Number(rt?.pricePerPersonPkr);
      const maxAdults = Number(rt?.maxAdults);
      if (!roomType || !Number.isFinite(pricePerPersonPkr) || pricePerPersonPkr <= 0 || !Number.isFinite(maxAdults) || maxAdults < 1) {
        return NextResponse.json(
          { error: "Each room type needs a name, a positive price/person, and maxAdults >= 1." },
          { status: 400 }
        );
      }
      roomTypesInput.push({
        roomType,
        pricePerPersonPkr,
        pricePerInfantPkr: Number.isFinite(Number(rt?.pricePerInfantPkr)) ? Number(rt.pricePerInfantPkr) : 0,
        pricePerChildPkr: Number.isFinite(Number(rt?.pricePerChildPkr)) ? Number(rt.pricePerChildPkr) : 0,
        maxAdults,
        maxInfants: Number.isFinite(Number(rt?.maxInfants)) ? Number(rt.maxInfants) : 0,
        minAdultsRequired:
          rt?.minAdultsRequired !== undefined && rt?.minAdultsRequired !== null && rt?.minAdultsRequired !== ""
            ? Number(rt.minAdultsRequired)
            : null,
        sortOrder: Number.isFinite(Number(rt?.sortOrder)) ? Number(rt.sortOrder) : 0,
      });
    }
  }

  // The listing-card display price is derived from room types, not typed
  // by hand — see lib/packagePrice.ts. If room types were submitted here,
  // that always wins over whatever (if anything) was sent in the legacy
  // "price" field. If no room types were given yet (e.g. admin plans to
  // add them right after via the Room Types & Pricing section), fall back
  // to the submitted price so nothing breaks for that in-between state.
  const derivedPrice = computeDisplayPrice(roomTypesInput);

  const requestedSlug = str("slug");
  if (requestedSlug) {
    const clash = await prisma.package.findUnique({ where: { slug: requestedSlug } });
    if (clash) return NextResponse.json({ error: "A package with this slug already exists." }, { status: 409 });
  }

  const pkg = await prisma.$transaction(async (tx) => {
    const created = await tx.package.create({
      data: {
        category,
        name,
        slug: requestedSlug,
        duration: str("duration"),
        price: derivedPrice ?? str("price"),
        priceNote: str("priceNote"),
        destination: str("destination"),
        departureCity: str("departureCity"),
        tier: str("tier"),
        depDate: str("depDate"),
        retDate: str("retDate"),
        airline: str("airline"),
        route: str("route"),
        hotels: str("hotels"),
        includes: str("includes"),
        excludes: str("excludes"),
        itinerary: itinerary as never,
        flightSectors: flightSectors as never,
        imageUrl,
        featured: form.get("featured") === "true",
        status: str("status") ?? "active",
      },
    });

    if (roomTypesInput.length > 0) {
      await tx.packageRoomType.createMany({
        data: roomTypesInput.map((rt) => ({ ...rt, packageId: created.id })),
      });
    }

    return tx.package.findUniqueOrThrow({
      where: { id: created.id },
      include: { roomTypes: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return NextResponse.json({ package: pkg }, { status: 201 });
}
