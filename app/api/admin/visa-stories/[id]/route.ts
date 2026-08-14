import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const story = await prisma.visaStory.update({ where: { id }, data: { country: body.country, countryFlag: body.countryFlag || null, headline: body.headline, body: body.body || null, customerName: body.customerName || null, isActive: body.isActive, sortOrder: Number(body.sortOrder) || 0 } });
  return NextResponse.json({ story });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.visaStory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
