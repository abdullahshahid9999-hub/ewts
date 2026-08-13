import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: { roomTypes: { orderBy: { sortOrder: "asc" } } },
    });
    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ pkg });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
