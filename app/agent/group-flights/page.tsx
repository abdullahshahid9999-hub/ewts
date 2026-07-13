"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

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
};

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
      ) : flights.length === 0 ? (
        <div className="ap-card"><p className="etd">No group flights are currently available.</p></div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {flights.map((f) => (
            <div key={f.id} className="ap-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {f.airlineLogoUrl && (
                    <Image src={f.airlineLogoUrl} alt={f.airline} width={40} height={40} style={{ objectFit: "contain" }} />
                  )}
                  <div>
                    <strong style={{ fontSize: "15px" }}>{f.airline}</strong>
                    {f.flightNo && <span style={{ marginLeft: "8px", fontSize: "12px", opacity: 0.7 }}>{f.flightNo}</span>}
                    <div style={{ fontSize: "13px", opacity: 0.85 }}>{f.route}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "18px", fontSize: "13px", flexWrap: "wrap" }}>
                  <div><strong>Departure:</strong> {f.depDate ?? "—"} {f.depTime ?? ""}</div>
                  <div><strong>Arrival:</strong> {f.arrDate ?? "—"} {f.arrTime ?? ""}</div>
                  {f.baggage && <div><strong>Baggage:</strong> {f.baggage}</div>}
                  {f.meal && <div><strong>Meal:</strong> {f.meal}</div>}
                  <div><strong>Trip:</strong> {f.tripType === "return" ? "Return" : "One-way"}</div>
                  <div><strong>Seats Left:</strong> {f.seats}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{f.price}</div>
                  <Link
                    href={`/agent/group-flights/book/${f.id}`}
                    className="ap-btn ap-btn-gold"
                    style={{ marginTop: "6px", display: "inline-block" }}
                  >
                    Book Now
                  </Link>
                </div>
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
