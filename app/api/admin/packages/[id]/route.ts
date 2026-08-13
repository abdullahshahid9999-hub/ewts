import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.package.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const form = await req.formData();
  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

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

  // Gallery images: gallery_0, gallery_1, ... — appended to existing gallery
  const newGalleryUrls: string[] = [];
  for (let i = 0; i < 10; i++) {
    const gf = form.get(`gallery_${i}`);
    if (!(gf instanceof File)) break;
    try {
      const buf = Buffer.from(await gf.arrayBuffer());
      const url = await uploadToR2({ buffer: buf, contentType: gf.type, folder: "packages/gallery" });
      newGalleryUrls.push(url);
    } catch (e) {
      console.error(`Gallery image ${i} upload failed:`, e);
    }
  }
  // removeGalleryUrls: JSON array of URLs to remove
  let removeGallerySet = new Set<string>();
  const removeRaw = form.get("removeGalleryUrls");
  if (typeof removeRaw === "string" && removeRaw.length > 0) {
    try { removeGallerySet = new Set(JSON.parse(removeRaw)); } catch { /* ignore */ }
  }
  const existingGallery: string[] = Array.isArray(existing.galleryUrls) ? (existing.galleryUrls as string[]) : [];
  const mergedGallery = [...existingGallery.filter((u) => !removeGallerySet.has(u)), ...newGalleryUrls];

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

  const requestedSlug = str("slug");
  if (requestedSlug && requestedSlug !== existing.slug) {
    const clash = await prisma.package.findUnique({ where: { slug: requestedSlug } });
    if (clash) return NextResponse.json({ error: "A package with this slug already exists." }, { status: 409 });
  }

  const pkg = await prisma.package.update({
    where: { id },
    data: {
      category: str("category"),
      name: str("name"),
      slug: requestedSlug,
      duration: str("duration"),
      price: str("price"),
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
      itinerary: itineraryRaw !== null ? (itinerary as never) : undefined,
      flightSectors: sectorsRaw !== null ? (flightSectors as never) : undefined,
      imageUrl,
      galleryUrls: mergedGallery as never,
      copyEnabled: form.has("copyEnabled") ? form.get("copyEnabled") === "true" : undefined,
      groupTicketEnabled: form.has("groupTicketEnabled") ? form.get("groupTicketEnabled") === "true" : undefined,
      visaEnabled: form.has("visaEnabled") ? form.get("visaEnabled") === "true" : undefined,
      featured: form.has("featured") ? form.get("featured") === "true" : undefined,
      status: str("status"),
    },
  });

  return NextResponse.json({ package: pkg });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.package.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
