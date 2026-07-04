import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const insurancePlan = await prisma.insurancePlan.update({
    where: { id },
    data: {
      name: typeof body?.name === "string" ? body.name : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
    },
  }).catch(() => null);

  if (!insurancePlan) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ insurancePlan });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  await prisma.insurancePlan.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
