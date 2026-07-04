import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_STATUSES = ["pending", "confirmed", "issue_requested", "issued", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const booking = await prisma.agentBooking.update({ where: { id }, data: { status } }).catch(() => null);
  if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ booking });
}
