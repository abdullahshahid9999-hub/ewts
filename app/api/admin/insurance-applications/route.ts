import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const applications = await prisma.insuranceApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: { rate: { include: { plan: { include: { company: true } } } } },
    });
    return NextResponse.json({ applications });
  } catch (e) {
    console.error("Insurance applications list failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to load applications." }, { status: 500 });
  }
}
