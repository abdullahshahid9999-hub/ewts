import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { getBrandInitials, formatSequence } from "@/lib/agentId";

export const dynamic = "force-dynamic";

const BRAND_NAME = "East and West Travel Services";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const prefix = getBrandInitials(BRAND_NAME);

  const agents = await prisma.agent.findMany({
    where: { agentCode: { startsWith: `${prefix}-` } },
    select: { agentCode: true },
  });

  let maxSeq = 0;
  for (const { agentCode } of agents) {
    const seq = parseInt(agentCode.split("-")[1], 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  const agentCode = `${prefix}-${formatSequence(maxSeq + 1)}`;
  return NextResponse.json({ agentCode });
}
