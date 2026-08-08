import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { getBrandInitials, getCityCode, generateAgentCode } from "@/lib/agentId";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agencyName = searchParams.get("agencyName") ?? "";
  const agencyCity = searchParams.get("agencyCity") ?? "";
  const tier       = searchParams.get("tier") ?? "bronze";
  const isOwner    = searchParams.get("isOwner") !== "false";

  if (!agencyName || !agencyCity)
    return NextResponse.json({ agentCode: "—" });

  const prefix   = getBrandInitials(agencyName);
  const cityCode = getCityCode(agencyCity);
  const base     = `${prefix}-${cityCode}-`;

  const existing = await prisma.agent.findMany({
    where: { agentCode: { startsWith: base } },
    select: { agentCode: true },
  });

  const agentCode = generateAgentCode(agencyName, agencyCity, tier, existing.map(a => a.agentCode), isOwner);
  return NextResponse.json({ agentCode });
}
