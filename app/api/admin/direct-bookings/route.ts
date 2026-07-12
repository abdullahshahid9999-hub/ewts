import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// Route Handlers are cached by Next.js by default — force fresh so a
// status change is visible immediately on the next list load.
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["umrah", "tours"] as const;
const VALID_STATUSES = ["pending", "confirmed", "cancelled"] as const;

// Direct/walk-in customer bookings (the public /api/bookings flow —
// customer picks a package + room type, no login, no agent involved).
// Separate from AgentBooking, which is the agent-network ledgered flow.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category"); // package category: umrah | tours | all/null
  const status = searchParams.get("status"); // all/null or one of VALID_STATUSES

  const where: Record<string, unknown> = {};
  if (status && status !== "all" && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    where.status = status;
  }
  if (category && category !== "all" && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    where.package = { category };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { package: { select: { name: true, category: true, slug: true } }, travellers: true },
  });

  return NextResponse.json({ bookings });
}
