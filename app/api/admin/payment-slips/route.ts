import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const paymentSlips = await prisma.paymentSlip.findMany({
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { agentCode: true, fullName: true } } },
  });

  return NextResponse.json({ paymentSlips });
}
