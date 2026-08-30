// Public endpoint — B2C/B2B live status badge
// GET /api/flight-status?flight=PK741
import { NextRequest, NextResponse } from "next/server";
import { lookupFlight } from "@/lib/aviation";

export async function GET(req: NextRequest) {
  const flightIata = req.nextUrl.searchParams.get("flight");
  if (!flightIata) return NextResponse.json({ error: "flight param required" }, { status: 400 });
  try {
    const result = await lookupFlight(flightIata);
    if (!result) return NextResponse.json({ status: "unknown" });
    return NextResponse.json({
      status: result.status,
      departure: { iata: result.departure.iata, scheduled: result.departure.scheduled },
      arrival: { iata: result.arrival.iata, scheduled: result.arrival.scheduled },
      live: result.live,
    });
  } catch {
    return NextResponse.json({ status: "unknown" });
  }
}
