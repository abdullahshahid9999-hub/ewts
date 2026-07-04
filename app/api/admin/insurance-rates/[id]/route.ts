import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const pricePkr = body?.pricePkr !== undefined ? Number(body.pricePkr) : undefined;
  if (pricePkr !== undefined && (!Number.isFinite(pricePkr) || pricePkr <= 0)) {
    return NextResponse.json({ error: "pricePkr must be a positive number." }, { status: 400 });
  }

  const insuranceRate = await prisma.insuranceRate.update({
    where: { id },
    data: {
      pricePkr,
      coverageDetails: typeof body?.coverageDetails === "string" ? body.coverageDetails : undefined,
    },
  }).catch(() => null);

  if (!insuranceRate) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ insuranceRate });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.insuranceRate.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
