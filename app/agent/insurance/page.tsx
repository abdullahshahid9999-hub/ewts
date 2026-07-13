"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

const DESTINATIONS = [
  { group: "Middle East", items: ["Gulf States (UAE, Kuwait, Bahrain, Oman)", "Saudi Arabia — Umrah / Hajj", "Qatar"] },
  { group: "Asia", items: ["Asia (Thailand, Malaysia, Indonesia)", "Turkey"] },
  { group: "Europe / West", items: ["Schengen States (26 countries)", "United Kingdom", "USA / Canada / Australia", "Worldwide (All countries)"] },
];

const DURATIONS = [
  { label: "7 Days", days: 7 }, { label: "10 Days", days: 10 }, { label: "14 Days", days: 14 },
  { label: "21 Days", days: 21 }, { label: "30 Days", days: 30 }, { label: "45 Days", days: 45 },
  { label: "60 Days", days: 60 }, { label: "90 Days", days: 90 }, { label: "6 Months", days: 180 },
  { label: "1 Year (Multi-trip)", days: 365 },
];

type QuoteRate = {
  id: string;
  pricePkr: number;
  coverageDetails: string | null;
  plan: { name: string; company: { name: string } };
};

function InsuranceInner() {
  const { accessToken, refresh } = useAgentAuth();
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [travellers, setTravellers] = useState("1");
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<QuoteRate[] | null>(null);

  const [selectedRate, setSelectedRate] = useState<QuoteRate | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSelectedRate(null);
    const durationDays = DURATIONS.find((d) => d.label === duration)?.days ?? 0;
    const params = new URLSearchParams({ destination, durationDays: String(durationDays) });
    const res = await fetch(`/api/insurance/quote?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setRates(data.rates ?? []);
    setLoading(false);
  }

  function selectRate(r: QuoteRate) {
    setSelectedRate(r);
    setSellPrice(String((Number(travellers) || 1) * r.pricePkr));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRate) return;
    setError(null);
    const price = Number(sellPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter the price you're charging the customer.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Customer name and phone are required.");
      return;
    }

    setSubmitting(true);
    const res = await agentFetch("/api/agent/bookings", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: "insurance",
        sellPrice: price,
        insurancePlanLabel: `${selectedRate.plan.company.name} — ${selectedRate.plan.name}`,
        adults: Number(travellers) || 1,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create booking.");
      return;
    }
    router.push("/agent/bookings");
  }

  return (
    <>
      <div className="ap-ph">
        <div><h2>Insurance <span>Plans</span></h2><p>Search plans the same way your customer would</p></div>
      </div>

      <div className="ap-card">
        <div style={{ padding: "16px 18px" }}>
          <form onSubmit={handleSearch} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, alignItems: "end" }}>
            <div className="ap-field">
              <label>Destination</label>
              <select required value={destination} onChange={(e) => setDestination(e.target.value)}>
                <option value="">— Choose —</option>
                {DESTINATIONS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map((i) => <option key={i} value={i}>{i}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="ap-field">
              <label>Duration</label>
              <select required value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="">— Select —</option>
                {DURATIONS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
              </select>
            </div>
            <div className="ap-field">
              <label>Travellers</label>
              <input type="number" min={1} value={travellers} onChange={(e) => setTravellers(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="ap-btn ap-btn-gold" style={{ height: 38 }}>
              {loading ? "Searching…" : "Search Plans"}
            </button>
          </form>
        </div>
      </div>

      {rates && (
        <div className="ap-card">
          <div className="ap-ch"><h3>Matching Plans</h3></div>
          <div style={{ padding: "16px 18px" }}>
            {rates.length === 0 ? (
              <p className="etd">No plans matched — try a different destination/duration.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rates.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRate(r)}
                    className="ap-card"
                    style={{
                      textAlign: "left", padding: "10px 14px", margin: 0, cursor: "pointer",
                      border: selectedRate?.id === r.id ? "2px solid var(--gold)" : "1px solid var(--bdr)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span>
                      <strong style={{ fontSize: 13 }}>{r.plan.company.name} — {r.plan.name}</strong>
                      {r.coverageDetails && <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>{r.coverageDetails}</span>}
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--gold)" }}>Rs. {r.pricePkr.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRate && (
        <div className="ap-card">
          <div className="ap-ch"><h3>Book: {selectedRate.plan.company.name} — {selectedRate.plan.name}</h3></div>
          <form onSubmit={handleSubmit} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="ap-field" style={{ maxWidth: 260 }}>
              <label>Price to Charge Customer (PKR)</label>
              <input type="number" min={1} required value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
            </div>
            <div className="ap-field">
              <label>Customer Full Name</label>
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="ap-field">
                <label>Phone</label>
                <input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
              <div className="ap-field">
                <label>Email (optional)</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
              </div>
            </div>
            {error && <p style={{ color: "var(--red)", fontSize: 12 }}>{error}</p>}
            <button type="submit" disabled={submitting} className="ap-btn ap-btn-gold" style={{ alignSelf: "flex-start" }}>
              {submitting ? "Creating…" : "Create Booking"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default function AgentInsurancePage() {
  return (
    <AgentGuard>
      <AgentShell>
        <InsuranceInner />
      </AgentShell>
    </AgentGuard>
  );
}
