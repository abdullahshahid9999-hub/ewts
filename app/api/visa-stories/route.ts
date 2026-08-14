import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 120;

export async function GET() {
  try {
    const stories = await prisma.visaStory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 12,
    });
    return NextResponse.json({ stories });
  } catch {
    return NextResponse.json({ stories: [] });
  }
}
