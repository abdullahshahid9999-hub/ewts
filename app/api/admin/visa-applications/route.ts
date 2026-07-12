import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const visaId = searchParams.get("visaId") ?? "";

  const applications = await prisma.visaApplication.findMany({
    where: {
      ...(status && { status }),
      ...(visaId && { visaId }),
    },
    include: {
      visa: { select: { title: true, country: true, type: true } },
      documents: {
        include: { document: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}
