import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

const VALID_STATUSES = ["pending", "under_review", "approved", "rejected", "more_info_needed"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  const { status, adminNote } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const application = await prisma.visaApplication.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(adminNote !== undefined && { adminNote: adminNote?.trim() || null }),
    },
  });

  return NextResponse.json({ application });
}
