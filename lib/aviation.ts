// AviationStack wrapper with multi-key rotation + OpenFlights name override
import airportsRaw from "@/lib/airports-data.json";

const AIRPORTS_MAP = new Map(
  (airportsRaw as { iata: string; name: string; city: string; country: string }[])
    .map(a => [a.iata, a])
);

function getKeys(): string[] {
  const keys: string[] = [];
  const k1 = process.env.AVIATIONSTACK_API_KEY;
  if (k1) keys.push(k1);
  let i = 2;
  while (true) {
    const k = process.env[`AVIATIONSTACK_API_KEY_${i}`];
    if (!k) break;
    keys.push(k);
    i++;
  }
  return keys;
}

// AviationStack returns scheduled times as local time strings (not UTC),
// but labels them inconsistently. We just parse as-is and return the time
// portion — admin sees it and can correct if wrong.
function parseLocalTime(scheduled: string): { date: string; time: string } {
  if (!scheduled) return { date: "", time: "" };
  // Format: "2026-09-01T12:15:00+00:00" or "2026-09-01T12:15:00"
  // Strip timezone suffix and parse as local
  const clean = scheduled.replace(/([+-]\d{2}:\d{2}|Z)$/, "");
  const d = new Date(clean);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const date = clean.slice(0, 10);
  const time = clean.slice(11, 16);
  return { date, time };
}

// Use our accurate OpenFlights airport name if available
function resolveAirport(iata: string, apiName: string): string {
  if (!iata) return apiName;
  const known = AIRPORTS_MAP.get(iata);
  if (known) return `${known.name}, ${known.city}`;
  return apiName;
}

export type FlightLookupResult = {
  flightIata: string;
  airline: { name: string; iata: string };
  departure: { airport: string; iata: string; date: string; time: string };
  arrival: { airport: string; iata: string; date: string; time: string };
  status: string;
};

export async function lookupFlight(flightIata: string): Promise<FlightLookupResult | null> {
  const keys = getKeys();
  if (keys.length === 0) throw new Error("No AviationStack API key configured.");

  for (const key of keys) {
    try {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${encodeURIComponent(flightIata.toUpperCase())}&limit=1`;
      const res = await fetch(url, { cache: "no-store" }); // no cache — always fresh
      if (res.status === 429 || res.status === 401) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const flight = data?.data?.[0];
      if (!flight) return null;

      const depIata: string = flight.departure?.iata ?? "";
      const arrIata: string = flight.arrival?.iata ?? "";
      const dep = parseLocalTime(flight.departure?.scheduled ?? "");
      const arr = parseLocalTime(flight.arrival?.scheduled ?? "");

      return {
        flightIata: flight.flight?.iata ?? flightIata,
        airline: { name: flight.airline?.name ?? "", iata: flight.airline?.iata ?? "" },
        departure: {
          airport: resolveAirport(depIata, flight.departure?.airport ?? ""),
          iata: depIata,
          date: dep.date,
          time: dep.time,
        },
        arrival: {
          airport: resolveAirport(arrIata, flight.arrival?.airport ?? ""),
          iata: arrIata,
          date: arr.date,
          time: arr.time,
        },
        status: flight.flight_status ?? "unknown",
      };
    } catch { continue; }
  }
  return null;
}
