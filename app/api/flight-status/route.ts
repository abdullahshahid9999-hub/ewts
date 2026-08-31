import { NextRequest, NextResponse } from "next/server";
import { lookupFlight } from "@/lib/aviation";

export async function GET(req: NextRequest) {
  const flightIata = req.nextUrl.searchParams.get("flight");
  if (!flightIata) return NextResponse.json({ status: "unknown" });
  try {
    const result = await lookupFlight(flightIata);
    if (!result) return NextResponse.json({ status: "unknown" });
    return NextResponse.json({
      status: result.status,
      departure: { iata: result.departure.iata, date: result.departure.date, time: result.departure.time },
      arrival: { iata: result.arrival.iata, date: result.arrival.date, time: result.arrival.time },
    });
  } catch {
    return NextResponse.json({ status: "unknown" });
  }
}
