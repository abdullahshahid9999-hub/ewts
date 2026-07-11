import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET /api/agent/transactions — this agent's credit/debit ledger
export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const transactions = await prisma.agentTransaction.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ transactions });
}
