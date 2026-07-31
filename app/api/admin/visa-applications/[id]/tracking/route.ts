import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null) ?? {};
  const { trackingCountry, trackingLink, trackingNumber } = body;

  const app = await prisma.visaApplication.update({
    where: { id },
    data: {
      trackingCountry: trackingCountry ?? undefined,
      trackingLink: trackingLink ?? undefined,
      trackingNumber: trackingNumber ?? undefined,
    },
  });

  return NextResponse.json({ app });
}
