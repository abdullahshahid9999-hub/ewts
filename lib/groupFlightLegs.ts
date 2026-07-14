// Shared helpers for GroupFlight.legs — kept in one place so the admin
// form and the agent portal display always agree on what a "leg" looks
// like and how flights are grouped (airline + route).

export type FlightLeg = {
  flightNo: string;
  from: string;
  to: string;
  depTime: string;
  arrTime: string;
};

export type GroupFlightLike = {
  id: string;
  flightNo: string | null;
  airline: string;
  airlineLogoUrl?: string | null;
  route: string;
  depDate: string | null;
  arrDate?: string | null;
  depTime: string | null;
  arrTime: string | null;
  baggage: string | null;
  meal: string | null;
  region?: string | null;
  tripType?: string | null;
  price: string;
  seats: number;
  legs?: unknown;
};

// Normalizes a GroupFlight row into its leg breakdown. If `legs` was never
// set (older rows, created before this feature), falls back to treating
// the row's own flightNo/depTime/arrTime as a single leg — this is what
// keeps existing data displaying/working exactly as before.
export function legsFromFlight(f: GroupFlightLike): FlightLeg[] {
  if (Array.isArray(f.legs) && f.legs.length > 0) {
    return (f.legs as Partial<FlightLeg>[]).map((l) => ({
      flightNo: l.flightNo ?? "",
      from: l.from ?? "",
      to: l.to ?? "",
      depTime: l.depTime ?? "",
      arrTime: l.arrTime ?? "",
    }));
  }
  return [
    {
      flightNo: f.flightNo ?? "",
      from: "",
      to: "",
      depTime: f.depTime ?? "",
      arrTime: f.arrTime ?? "",
    },
  ];
}

// Grouping key for the agent portal's "one header per airline+route" view.
export function groupKey(f: GroupFlightLike): string {
  return `${f.airline}__${f.route}`;
}
