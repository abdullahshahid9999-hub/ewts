import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: visaId } = await params;
  const docs = await prisma.visaRequiredDocument.findMany({
    where: { visaId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ docs });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id: visaId } = await params;
  const visa = await prisma.visaService.findUnique({ where: { id: visaId } });
  if (!visa) return NextResponse.json({ error: "Visa not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });

  const doc = await prisma.visaRequiredDocument.create({
    data: {
      visaId,
      name,
      description: typeof body?.description === "string" && body.description.trim() ? body.description.trim() : null,
      isRequired: body?.isRequired !== false, // default true
      sortOrder: Number(body?.sortOrder) || 0,
    },
  });

  return NextResponse.json({ doc }, { status: 201 });
}
