import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const visa = await prisma.visaService.findUnique({
      where: { id, status: "active" },
      include: {
        requiredDocuments: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!visa) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ visa });
  } catch (e) {
    console.error("Visa detail error:", e);
    return NextResponse.json({ error: "Failed to load visa." }, { status: 500 });
  }
}
