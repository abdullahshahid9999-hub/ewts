import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public, read-only. The quote calculator on /insurance calls this to
// actually filter rates instead of just listing everything.
//
// Matching strategy (best-effort, since `destination` on InsuranceRate is
// free text entered by admin per rate, not a fixed enum — insurance
// companies define their own region buckets, e.g. "Schengen", "Worldwide"):
//   - destination: case-insensitive substring match against the rate's
//     destination field. If a rate has no destination set, treat it as
//     "Worldwide" (matches everything) rather than excluding it — admin
//     may not have filled it in yet, better to show it than hide it.
//   - duration: return rates where durationDays >= requested duration
//     (the rate covers at least as long as the trip), picking the closest
//     (smallest sufficient) match per plan. Rates with no durationDays set
//     are treated as unlimited/flexible and always included.
export async function GET(req: NextRequest) {
  const destination = req.nextUrl.searchParams.get("destination")?.trim() || "";
  const durationDays = Number(req.nextUrl.searchParams.get("durationDays")) || 0;

  const allRates = await prisma.insuranceRate.findMany({
    include: { plan: { include: { company: true } } },
    orderBy: { pricePkr: "asc" },
  });

  const destKey = destination.toLowerCase();
  const filtered = allRates.filter((r) => {
    const destOk =
      !r.destination ||
      destKey === "" ||
      r.destination.toLowerCase().includes(destKey) ||
      destKey.includes(r.destination.toLowerCase()) ||
      r.destination.toLowerCase().includes("worldwide");
    const durationOk =
      !r.durationDays || durationDays === 0 || r.durationDays >= durationDays;
    return destOk && durationOk;
  });

  return NextResponse.json({ rates: filtered, matchedCount: filtered.length, totalCount: allRates.length });
}
