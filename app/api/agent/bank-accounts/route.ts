import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET /api/agent/bank-accounts — active bank accounts for the topup page
export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, bankName: true, accountTitle: true, accountNumber: true, iban: true, branchCode: true, logoUrl: true },
  });

  return NextResponse.json({ accounts });
}
