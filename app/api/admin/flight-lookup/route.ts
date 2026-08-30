import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { lookupFlight } from "@/lib/aviation";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const flightIata = req.nextUrl.searchParams.get("flight");
  if (!flightIata) return NextResponse.json({ error: "flight param required" }, { status: 400 });

  try {
    const result = await lookupFlight(flightIata);
    if (!result) return NextResponse.json({ error: "Flight not found." }, { status: 404 });
    return NextResponse.json({ flight: result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lookup failed." }, { status: 500 });
  }
}
