// AviationStack wrapper with multi-key rotation
// Add keys as AVIATIONSTACK_API_KEY, AVIATIONSTACK_API_KEY_2, etc.

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

export type FlightLookupResult = {
  flightIata: string;
  airline: { name: string; iata: string };
  departure: { airport: string; iata: string; scheduled: string; timezone: string };
  arrival: { airport: string; iata: string; scheduled: string; timezone: string };
  status: string;
  live: { latitude: number | null; longitude: number | null; altitude: number | null; speed: number | null } | null;
};

export async function lookupFlight(flightIata: string): Promise<FlightLookupResult | null> {
  const keys = getKeys();
  if (keys.length === 0) throw new Error("No AviationStack API key configured.");

  // Try each key in order (rotate on rate limit / auth error)
  for (const key of keys) {
    try {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${encodeURIComponent(flightIata.toUpperCase())}&limit=1`;
      const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
      if (res.status === 429 || res.status === 401) continue; // try next key
      if (!res.ok) continue;
      const data = await res.json();
      const flight = data?.data?.[0];
      if (!flight) return null;
      return {
        flightIata: flight.flight?.iata ?? flightIata,
        airline: { name: flight.airline?.name ?? "", iata: flight.airline?.iata ?? "" },
        departure: {
          airport: flight.departure?.airport ?? "",
          iata: flight.departure?.iata ?? "",
          scheduled: flight.departure?.scheduled ?? "",
          timezone: flight.departure?.timezone ?? "",
        },
        arrival: {
          airport: flight.arrival?.airport ?? "",
          iata: flight.arrival?.iata ?? "",
          scheduled: flight.arrival?.scheduled ?? "",
          timezone: flight.arrival?.timezone ?? "",
        },
        status: flight.flight_status ?? "unknown",
        live: flight.live ? {
          latitude: flight.live.latitude ?? null,
          longitude: flight.live.longitude ?? null,
          altitude: flight.live.altitude ?? null,
          speed: flight.live.speed_horizontal ?? null,
        } : null,
      };
    } catch { continue; }
  }
  return null;
}
