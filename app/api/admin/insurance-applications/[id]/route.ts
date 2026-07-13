import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID = ["pending", "confirmed", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const application = await prisma.insuranceApplication.update({ where: { id }, data: { status } }).catch(() => null);
  if (!application) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ application });
}
