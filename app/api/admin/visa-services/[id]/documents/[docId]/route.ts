import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { docId } = await params;
  const body = await req.json().catch(() => null) ?? {};

  const doc = await prisma.visaRequiredDocument.update({
    where: { id: docId },
    data: {
      ...(typeof body.name === "string" && body.name.trim() && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.isRequired !== undefined && { isRequired: Boolean(body.isRequired) }),
      ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
    },
  });

  return NextResponse.json({ doc });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { docId } = await params;
  await prisma.visaRequiredDocument.delete({ where: { id: docId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
