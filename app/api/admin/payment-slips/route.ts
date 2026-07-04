import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const paymentSlips = await prisma.paymentSlip.findMany({
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { agentCode: true, fullName: true } } },
  });

  return NextResponse.json({ paymentSlips });
}
