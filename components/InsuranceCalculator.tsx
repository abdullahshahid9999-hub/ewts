"use client";

import { useState } from "react";

const DESTINATIONS = [
  { group: "Middle East", items: ["Gulf States (UAE, Kuwait, Bahrain, Oman)", "Saudi Arabia — Umrah / Hajj", "Qatar"] },
  { group: "Asia", items: ["Asia (Thailand, Malaysia, Indonesia)", "Turkey"] },
  { group: "Europe / West", items: ["Schengen States (26 countries)", "United Kingdom", "USA / Canada / Australia", "Worldwide (All countries)"] },
];

const DURATIONS: { label: string; days: number }[] = [
  { label: "7 Days", days: 7 },
  { label: "10 Days", days: 10 },
  { label: "14 Days", days: 14 },
  { label: "21 Days", days: 21 },
  { label: "30 Days", days: 30 },
  { label: "45 Days", days: 45 },
  { label: "60 Days", days: 60 },
  { label: "90 Days", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year (Multi-trip)", days: 365 },
];
const AGE_BANDS = ["18 – 35 years", "36 – 60 years", "61+ years"];

type QuoteRate = {
  id: string;
  pricePkr: number;
  coverageDetails: string | null;
  destination: string | null;
  durationDays: number | null;
  plan: { name: string; company: { name: string; logoUrl: string | null } };
};

export default function InsuranceCalculator({ onViewPlans }: { onViewPlans?: () => void }) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [travellers, setTravellers] = useState("1");
  const [ageBand, setAgeBand] = useState(AGE_BANDS[0]);
  const [departureDate, setDepartureDate] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<QuoteRate[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const durationDays = DURATIONS.find((d) => d.label === duration)?.days || 0;
    try {
      const res = await fetch(
        `/api/insurance/quote?destination=${encodeURIComponent(destination)}&durationDays=${durationDays}`
      );
      const data = await res.json();
      setRates(data.rates ?? []);
    } catch {
      setRates([]);
    }
    setLoading(false);
    setSubmitted(true);
    onViewPlans?.();
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-6 max-w-lg mx-auto">
      <h2 className="font-display text-xl font-semibold mb-1">Get Your Quote</h2>
      <p className="text-muted text-sm mb-4">Fill in your trip details to compare plans</p>

      {submitted ? (
        <div>
          <p className="text-sm mb-1"><span className="font-semibold">Destination:</span> {destination || "—"}</p>
          <p className="text-sm mb-1"><span className="font-semibold">Duration:</span> {duration || "—"}</p>
          <p className="text-sm mb-1"><span className="font-semibold">Travellers:</span> {travellers}, {ageBand}</p>
          {departureDate && <p className="text-sm mb-3"><span className="font-semibold">Departure:</span> {departureDate}</p>}

          {loading ? (
            <p className="text-muted text-sm">Finding matching plans…</p>
          ) : rates && rates.length > 0 ? (
            <div className="space-y-2 mb-3">
              {rates.map((r) => (
                <div key={r.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{r.plan.company.name} — {r.plan.name}</div>
                    {r.coverageDetails && <div className="text-xs text-muted">{r.coverageDetails}</div>}
                  </div>
                  <div className="font-display text-gold font-semibold">Rs. {r.pricePkr.toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-xs mb-3">
              No exact match found for these details yet — WhatsApp us your trip
              details above for a custom quote.
            </p>
          )}

          <button onClick={() => setSubmitted(false)} className="text-sm font-semibold text-gold hover:underline">
            Edit Details
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Select Destination *</label>
            <select required value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
              <option value="">— Choose country / region —</option>
              {DESTINATIONS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((i) => <option key={i} value={i}>{i}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Travel Duration *</label>
            <select required value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
              <option value="">— Select duration —</option>
              {DURATIONS.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Travellers *</label>
            <input required type="number" min={1} value={travellers} onChange={(e) => setTravellers(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Age of Oldest Traveller *</label>
            <select required value={ageBand} onChange={(e) => setAgeBand(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
              {AGE_BANDS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Departure Date</label>
            <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email (optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors disabled:opacity-60">
            {loading ? "Searching…" : "VIEW PLANS"}
          </button>
          <p className="text-muted text-xs text-center">Your info is secure and never shared</p>
        </form>
      )}
    </div>
  );
}

