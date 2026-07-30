import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const tiers = await prisma.visaDiscountTier.findMany({ orderBy: { minTravellers: "asc" } });
  return NextResponse.json({ tiers });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const minTravellers = Number(body?.minTravellers);
  const discountPercent = Number(body?.discountPercent);
  if (!minTravellers || minTravellers < 1 || !discountPercent || discountPercent < 1 || discountPercent > 100) {
    return NextResponse.json({ error: "Enter a valid traveller count and a discount percent between 1-100." }, { status: 400 });
  }
  const tier = await prisma.visaDiscountTier.create({ data: { minTravellers, discountPercent } });
  return NextResponse.json({ tier }, { status: 201 });
}
