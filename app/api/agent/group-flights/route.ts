import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const flights = await prisma.groupFlight.findMany({
    where: { status: "active", seats: { gt: 0 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ flights });
}
