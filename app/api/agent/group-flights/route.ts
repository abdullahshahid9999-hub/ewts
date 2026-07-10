import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const flights = await prisma.groupFlight.findMany({
    where: { status: "active", seats: { gt: 0 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ flights });
}
