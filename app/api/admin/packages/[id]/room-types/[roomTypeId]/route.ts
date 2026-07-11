import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomTypeId: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id: packageId, roomTypeId } = await params;
  const existing = await prisma.packageRoomType.findUnique({ where: { id: roomTypeId } });
  if (!existing || existing.packageId !== packageId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.roomType === "string" && body.roomType.trim()) data.roomType = body.roomType.trim();
  if (body?.pricePerPersonPkr !== undefined) {
    const n = Number(body.pricePerPersonPkr);
    if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: "pricePerPersonPkr must be positive." }, { status: 400 });
    data.pricePerPersonPkr = n;
  }
  if (body?.pricePerInfantPkr !== undefined) {
    const n = Number(body.pricePerInfantPkr);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "pricePerInfantPkr must be zero or positive." }, { status: 400 });
    data.pricePerInfantPkr = n;
  }
  if (body?.pricePerChildPkr !== undefined) {
    const n = Number(body.pricePerChildPkr);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "pricePerChildPkr must be zero or positive." }, { status: 400 });
    data.pricePerChildPkr = n;
  }
  if (body?.maxAdults !== undefined) {
    const n = Number(body.maxAdults);
    if (!Number.isFinite(n) || n < 1) return NextResponse.json({ error: "maxAdults must be at least 1." }, { status: 400 });
    data.maxAdults = n;
  }
  if (body?.maxInfants !== undefined) {
    const n = Number(body.maxInfants);
    if (Number.isFinite(n)) data.maxInfants = n;
  }
  if (body?.minAdultsRequired !== undefined) {
    data.minAdultsRequired = body.minAdultsRequired === null || body.minAdultsRequired === "" ? null : Number(body.minAdultsRequired);
  }
  if (body?.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    if (Number.isFinite(n)) data.sortOrder = n;
  }

  const roomType = await prisma.packageRoomType.update({ where: { id: roomTypeId }, data });
  return NextResponse.json({ roomType });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomTypeId: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id: packageId, roomTypeId } = await params;
  const existing = await prisma.packageRoomType.findUnique({ where: { id: roomTypeId } });
  if (!existing || existing.packageId !== packageId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.packageRoomType.delete({ where: { id: roomTypeId } });
  return NextResponse.json({ ok: true });
}
