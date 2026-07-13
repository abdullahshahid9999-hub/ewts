"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  tripType: string | null;
  price: string;
  seats: number;
};

type Traveller = { fullName: string; passportNo: string; cnic: string };

// GroupFlight.price is a free-text field admin types in (e.g. "PKR
// 45,000") since fares vary by route/season and aren't modeled as a
// structured number anywhere else in this codebase either. Pull the
// digits out to get a usable starting per-adult rate for the bill
// preview — the agent can still override the final total, this is just
// a sensible default so they don't have to do the math by hand.
function parseBaseFare(price: string): number {
  const digits = price.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function BillPanel({
  agent,
  flight,
  adults,
  children,
  infants,
  adultRate,
  childRate,
  infantRate,
  setAdultRate,
  setChildRate,
  setInfantRate,
  total,
}: {
  agent: { fullName: string; agentCode: string; tier: string } | null;
  flight: Flight;
  adults: number;
  children: number;
  infants: number;
  adultRate: number;
  childRate: number;
  infantRate: number;
  setAdultRate: (n: number) => void;
  setChildRate: (n: number) => void;
  setInfantRate: (n: number) => void;
  total: number;
}) {
  return (
    <div className="ap-card" style={{ padding: "18px", position: "sticky", top: "16px" }}>
      <h3 style={{ marginBottom: "12px" }}>Booking Summary</h3>

      <div style={{ fontSize: "12px", opacity: 0.75, marginBottom: "10px" }}>
        <div><strong>Agent:</strong> {agent?.fullName ?? "—"} ({agent?.agentCode ?? "—"})</div>
        <div><strong>Tier:</strong> {agent?.tier ?? "—"}</div>
      </div>

      <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: "10px", marginBottom: "10px", fontSize: "13px" }}>
        <div><strong>{flight.airline}</strong> {flight.flightNo ?? ""}</div>
        <div style={{ opacity: 0.8 }}>{flight.route}</div>
        <div style={{ opacity: 0.8 }}>{flight.depDate ?? "—"} {flight.depTime ?? ""}</div>
      </div>

      <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ padding: "4px 0" }}>Adults × {adults}</td>
            <td style={{ textAlign: "right" }}>
              <input type="number" min={0} value={adultRate} onChange={(e) => setAdultRate(Number(e.target.value))}
                style={{ width: "80px", textAlign: "right", border: "1px solid var(--bdr)", borderRadius: "6px", padding: "2px 6px" }} />
            </td>
          </tr>
          <tr>
            <td style={{ padding: "4px 0" }}>Children × {children}</td>
            <td style={{ textAlign: "right" }}>
              <input type="number" min={0} value={childRate} onChange={(e) => setChildRate(Number(e.target.value))}
                style={{ width: "80px", textAlign: "right", border: "1px solid var(--bdr)", borderRadius: "6px", padding: "2px 6px" }} />
            </td>
          </tr>
          <tr>
            <td style={{ padding: "4px 0" }}>Infants × {infants}</td>
            <td style={{ textAlign: "right" }}>
              <input type="number" min={0} value={infantRate} onChange={(e) => setInfantRate(Number(e.target.value))}
                style={{ width: "80px", textAlign: "right", border: "1px solid var(--bdr)", borderRadius: "6px", padding: "2px 6px" }} />
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: "1px solid var(--bdr)", marginTop: "10px", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "15px" }}>
        <span>Total</span>
        <span>PKR {total.toLocaleString()}</span>
      </div>
      <p style={{ fontSize: "11px", opacity: 0.6, marginTop: "6px" }}>
        Rates are pre-filled from the listed fare — adjust per passenger type if needed. This is the amount that will be collected from the customer.
      </p>
    </div>
  );
}

function BookFlightInner() {
  const { agent, accessToken, refresh } = useAgentAuth();
  const params = useParams();
  const router = useRouter();
  const flightId = params.flightId as string;

  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [adults, setAdults] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [infants, setInfants] = useState(0);
  const [adultRate, setAdultRate] = useState(0);
  const [childRate, setChildRate] = useState(0);
  const [infantRate, setInfantRate] = useState(0);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [travellers, setTravellers] = useState<Traveller[]>([{ fullName: "", passportNo: "", cnic: "" }]);

  useEffect(() => {
    agentFetch("/api/agent/group-flights", accessToken, refresh).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const found: Flight | undefined = (data.flights ?? []).find((f: Flight) => f.id === flightId);
        if (found) {
          setFlight(found);
          const base = parseBaseFare(found.price);
          setAdultRate(base);
          setChildRate(base);
          setInfantRate(0);
        } else {
          setError("This flight is no longer available.");
        }
      }
      setLoading(false);
    });
  }, [flightId, accessToken, refresh]);

  // Keep the traveller name-list length in sync with adults so every
  // adult passenger gets a name field — matches the existing Umrah rule
  // that adults must be named individually (see /api/agent/bookings).
  useEffect(() => {
    setTravellers((t) => {
      const next = [...t];
      while (next.length < adults) next.push({ fullName: "", passportNo: "", cnic: "" });
      while (next.length > adults && next.length > 1) next.pop();
      return next;
    });
  }, [adults]);

  const total = adults * adultRate + childCount * childRate + infants * infantRate;

  function updateTraveller(i: number, patch: Partial<Traveller>) {
    setTravellers((t) => t.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flight) return;
    setSubmitting(true);
    setError(null);

    const res = await agentFetch("/api/agent/bookings", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "group_ticket",
        groupFlightId: flight.id,
        sellPrice: total,
        customerName,
        customerPhone,
        customerEmail,
        travellers,
        adults,
        children: childCount,
        infants,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create booking.");
      return;
    }
    router.push(`/agent/bookings/${data.booking.id}`);
  }

  if (loading) return <p className="etd">Loading flight…</p>;
  if (error && !flight) return <p className="etd" style={{ color: "var(--red)" }}>{error}</p>;
  if (!flight) return null;

  return (
    <>
      <div className="ap-ph">
        <div>
          <h2>Book <span>{flight.airline} — {flight.route}</span></h2>
          <p>{flight.depDate ?? "—"} {flight.depTime ?? ""} · {flight.seats} seats left</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", alignItems: "start" }}>
        <form onSubmit={handleSubmit}>
          <div className="ap-card" style={{ padding: "18px", marginBottom: "14px" }}>
            <h3 style={{ marginBottom: "10px" }}>Passenger Count</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
              <label className="text-xs">Adults
                <input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))} className="ap-field" style={{ width: "100%" }} />
              </label>
              <label className="text-xs">Children
                <input type="number" min={0} value={childCount} onChange={(e) => setChildCount(Math.max(0, Number(e.target.value)))} className="ap-field" style={{ width: "100%" }} />
              </label>
              <label className="text-xs">Infants
                <input type="number" min={0} value={infants} onChange={(e) => setInfants(Math.max(0, Number(e.target.value)))} className="ap-field" style={{ width: "100%" }} />
              </label>
            </div>
          </div>

          <div className="ap-card" style={{ padding: "18px", marginBottom: "14px" }}>
            <h3 style={{ marginBottom: "10px" }}>Customer Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <input required placeholder="Customer Name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="ap-field" />
              <input required placeholder="Phone *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="ap-field" />
              <input type="email" placeholder="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="ap-field" style={{ gridColumn: "1 / -1" }} />
            </div>
          </div>

          <div className="ap-card" style={{ padding: "18px", marginBottom: "14px" }}>
            <h3 style={{ marginBottom: "10px" }}>Passenger Details (Adults)</h3>
            {travellers.map((t, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                <input required placeholder={`Passenger ${i + 1} Full Name *`} value={t.fullName} onChange={(e) => updateTraveller(i, { fullName: e.target.value })} className="ap-field" />
                <input placeholder="Passport No" value={t.passportNo} onChange={(e) => updateTraveller(i, { passportNo: e.target.value })} className="ap-field" />
                <input placeholder="CNIC" value={t.cnic} onChange={(e) => updateTraveller(i, { cnic: e.target.value })} className="ap-field" />
              </div>
            ))}
          </div>

          {error && <p style={{ color: "var(--red)", fontSize: "13px", marginBottom: "10px" }}>{error}</p>}

          <button type="submit" disabled={submitting} className="ap-btn ap-btn-gold" style={{ width: "100%" }}>
            {submitting ? "Creating Booking…" : "Confirm Booking"}
          </button>
        </form>

        <BillPanel
          agent={agent}
          flight={flight}
          adults={adults}
          children={childCount}
          infants={infants}
          adultRate={adultRate}
          childRate={childRate}
          infantRate={infantRate}
          setAdultRate={setAdultRate}
          setChildRate={setChildRate}
          setInfantRate={setInfantRate}
          total={total}
        />
      </div>
    </>
  );
}

export default function AgentBookGroupFlightPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <BookFlightInner />
      </AgentShell>
    </AgentGuard>
  );
}
