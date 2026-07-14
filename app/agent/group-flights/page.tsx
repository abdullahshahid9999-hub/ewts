"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import { legsFromFlight, groupKey, type FlightLeg } from "@/lib/groupFlightLegs";

type Flight = {
  id: string;
  flightNo: string | null;
  airline: string;
  airlineLogoUrl: string | null;
  route: string;
  depDate: string | null;
  depTime: string | null;
  arrTime: string | null;
  arrDate: string | null;
  baggage: string | null;
  meal: string | null;
  region: string | null;
  tripType: string | null;
  price: string;
  seats: number;
  legs: unknown;
};

type FlightGroup = { airline: string; airlineLogoUrl: string | null; route: string; options: Flight[] };

// Groups flights sharing the same airline + route under one header — the
// header shows the route once, the table below lists each priced,
// bookable "option" (a GroupFlight row), with its leg breakdown stacked
// inside that option's row when it has connections.
function groupFlights(flights: Flight[]): FlightGroup[] {
  const map = new Map<string, FlightGroup>();
  for (const f of flights) {
    const key = groupKey(f);
    const existing = map.get(key);
    if (existing) {
      existing.options.push(f);
      if (!existing.airlineLogoUrl && f.airlineLogoUrl) existing.airlineLogoUrl = f.airlineLogoUrl;
    } else {
      map.set(key, { airline: f.airline, airlineLogoUrl: f.airlineLogoUrl, route: f.route, options: [f] });
    }
  }
  return Array.from(map.values());
}

function LegLine({ leg }: { leg: FlightLeg }) {
  return (
    <div style={{ fontSize: "12.5px", lineHeight: 1.6 }}>
      <strong>{leg.flightNo || "—"}</strong>
      {(leg.from || leg.to) && <span style={{ opacity: 0.85 }}> {leg.from}→{leg.to}</span>}
      {(leg.depTime || leg.arrTime) && <span style={{ opacity: 0.7 }}> {leg.depTime}→{leg.arrTime}</span>}
    </div>
  );
}

function GroupFlightsInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentFetch("/api/agent/group-flights", accessToken, refresh).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setFlights(data.flights ?? []);
      }
      setLoading(false);
    });
  }, [accessToken, refresh]);

  const groups = groupFlights(flights);

  return (
    <>
      <div className="ap-ph">
        <div>
          <h2>Group <span>Flights</span></h2>
          <p>Browse available group flights and book seats for your clients</p>
        </div>
      </div>

      {loading ? (
        <p className="etd">Loading flights…</p>
      ) : groups.length === 0 ? (
        <div className="ap-card"><p className="etd">No group flights are currently available.</p></div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {groups.map((g) => (
            <div key={`${g.airline}__${g.route}`} className="ap-card">
              {/* GROUP HEADER — one per airline + route, gold-accented like
                  the rest of the agent portal's card headers. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 18px",
                  borderBottom: "1.5px solid var(--gold-bd)",
                  background: "var(--gold-bg)",
                }}
              >
                {g.airlineLogoUrl && (
                  <Image src={g.airlineLogoUrl} alt={g.airline} width={36} height={36} style={{ objectFit: "contain" }} />
                )}
                <strong style={{ fontSize: "15px" }}>{g.airline}</strong>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold)" }}>{g.route}</span>
              </div>

              <div className="ap-tw">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>Option</th>
                      <th>Date</th>
                      <th>Meal</th>
                      <th>Baggage</th>
                      <th>Seats</th>
                      <th>Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.options.map((f, i) => {
                      const flightLegs = legsFromFlight(f);
                      return (
                        <tr key={f.id}>
                          <td>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--gold)", marginBottom: "2px" }}>
                              Option {i + 1}
                            </div>
                            {flightLegs.map((leg, li) => <LegLine key={li} leg={leg} />)}
                          </td>
                          <td>{f.depDate ?? "—"}</td>
                          <td>{f.meal ?? "—"}</td>
                          <td>{f.baggage ?? "—"}</td>
                          <td>{f.seats}</td>
                          <td style={{ fontWeight: 700 }}>{f.price}</td>
                          <td>
                            <Link href={`/agent/group-flights/book/${f.id}`} className="ap-btn ap-btn-gold" style={{ whiteSpace: "nowrap" }}>
                              Book Now
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AgentGroupFlightsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <GroupFlightsInner />
      </AgentShell>
    </AgentGuard>
  );
}
