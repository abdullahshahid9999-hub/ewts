import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { syncPackageDisplayPrice } from "@/lib/packagePrice";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id: packageId } = await params;
  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) return NextResponse.json({ error: "Package not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const roomType = typeof body?.roomType === "string" ? body.roomType.trim() : "";
  const pricePerPersonPkr = Number(body?.pricePerPersonPkr);
  const pricePerInfantPkr = body?.pricePerInfantPkr !== undefined ? Number(body.pricePerInfantPkr) : 0;
  const pricePerChildPkr = body?.pricePerChildPkr !== undefined ? Number(body.pricePerChildPkr) : 0;
  const maxAdults = Number(body?.maxAdults);
  const maxInfants = body?.maxInfants !== undefined ? Number(body.maxInfants) : 0;
  const minAdultsRequired = body?.minAdultsRequired !== undefined && body.minAdultsRequired !== null && body.minAdultsRequired !== ""
    ? Number(body.minAdultsRequired)
    : undefined;
  const sortOrder = body?.sortOrder !== undefined ? Number(body.sortOrder) : 0;

  if (!roomType || !Number.isFinite(pricePerPersonPkr) || pricePerPersonPkr <= 0 || !Number.isFinite(maxAdults) || maxAdults < 1) {
    return NextResponse.json(
      { error: "roomType, a positive pricePerPersonPkr, and maxAdults >= 1 are required." },
      { status: 400 }
    );
  }

  const created = await prisma.packageRoomType.create({
    data: {
      packageId,
      roomType,
      pricePerPersonPkr,
      pricePerInfantPkr: Number.isFinite(pricePerInfantPkr) ? pricePerInfantPkr : 0,
      pricePerChildPkr: Number.isFinite(pricePerChildPkr) ? pricePerChildPkr : 0,
      maxAdults,
      maxInfants: Number.isFinite(maxInfants) ? maxInfants : 0,
      minAdultsRequired: minAdultsRequired !== undefined && Number.isFinite(minAdultsRequired) ? minAdultsRequired : undefined,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  // Keep the listing-card price in sync with the lowest room price
  // whenever the room basis division changes — see lib/packagePrice.ts.
  await syncPackageDisplayPrice(packageId);

  return NextResponse.json({ roomType: created }, { status: 201 });
}
