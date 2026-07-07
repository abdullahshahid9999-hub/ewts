"use client";

import { useState } from "react";

const DESTINATIONS = [
  { group: "Middle East", items: ["Gulf States (UAE, Kuwait, Bahrain, Oman)", "Saudi Arabia — Umrah / Hajj", "Qatar"] },
  { group: "Asia", items: ["Asia (Thailand, Malaysia, Indonesia)", "Turkey"] },
  { group: "Europe / West", items: ["Schengen States (26 countries)", "United Kingdom", "USA / Canada / Australia", "Worldwide (All countries)"] },
];

const DURATIONS = ["7 Days", "10 Days", "14 Days", "21 Days", "30 Days", "45 Days", "60 Days", "90 Days", "6 Months", "1 Year (Multi-trip)"];
const AGE_BANDS = ["18 – 35 years", "36 – 60 years", "61+ years"];

export default function InsuranceCalculator({ onViewPlans }: { onViewPlans: () => void }) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [travellers, setTravellers] = useState("1");
  const [ageBand, setAgeBand] = useState(AGE_BANDS[0]);
  const [departureDate, setDepartureDate] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    onViewPlans();
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
          <p className="text-muted text-xs mb-3">
            Our current plan list isn&apos;t filtered by destination/duration yet — showing all
            active plans below. WhatsApp us your trip details above for an exact quote.
          </p>
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
              {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
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
          <button type="submit" className="w-full bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors">
            VIEW PLANS
          </button>
          <p className="text-muted text-xs text-center">Your info is secure and never shared</p>
        </form>
      )}
    </div>
  );
}
