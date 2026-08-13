"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  durations: string[];
  departureCities: string[];
  initialDuration?: string;
  initialTravellers?: number;
  initialDepartureCity?: string;
};

export default function UmrahSearchBar({ durations, departureCities, initialDuration = "", initialTravellers = 1, initialDepartureCity = "" }: Props) {
  const router = useRouter();
  const [duration, setDuration] = useState(initialDuration);
  const [travellers, setTravellers] = useState(initialTravellers);
  const [departureCity, setDepartureCity] = useState(initialDepartureCity);
  const [paxOpen, setPaxOpen] = useState(false);
  const [adults, setAdults] = useState(Math.max(1, initialTravellers));
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const totalTravellers = adults + children + infants;

  function applyPax() {
    setTravellers(totalTravellers);
    setPaxOpen(false);
  }

  function search() {
    const params = new URLSearchParams();
    if (duration) params.set("duration", duration);
    if (departureCity) params.set("departureCity", departureCity);
    if (adults !== 1) params.set("adults", String(adults));
    if (children > 0) params.set("children", String(children));
    if (infants > 0) params.set("infants", String(infants));
    router.push(`/umrah${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="relative max-w-3xl mx-auto mt-6">
      <div className="flex flex-wrap sm:flex-nowrap items-center bg-white rounded-2xl shadow-xl overflow-visible border border-white/20">
        {/* Duration */}
        <div className="flex-1 min-w-0 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Duration</p>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer"
          >
            <option value="">Any Duration</option>
            {durations.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Travellers */}
        <div className="flex-1 min-w-0 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-100 relative">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Travellers</p>
          <button
            type="button"
            onClick={() => setPaxOpen((o) => !o)}
            className="w-full text-left text-sm font-semibold text-gray-800 outline-none"
          >
            {totalTravellers} Traveller{totalTravellers !== 1 ? "s" : ""}
            <span className="text-xs text-gray-400 ml-1">▾</span>
          </button>
          {paxOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl p-4 z-50 w-64">
              {[
                { label: "Adults", sub: "12+ years", val: adults, set: setAdults, min: 1 },
                { label: "Children", sub: "2–11 years", val: children, set: setChildren, min: 0 },
                { label: "Infants", sub: "Under 2", val: infants, set: setInfants, min: 0 },
              ].map(({ label, sub, val, set, min }) => (
                <div key={label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => set(Math.max(min, val - 1))}
                      className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center hover:bg-gray-50">−</button>
                    <span className="w-5 text-center text-sm font-semibold">{val}</span>
                    <button type="button" onClick={() => set(val + 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center hover:bg-gray-50">+</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={applyPax}
                className="mt-3 w-full bg-[var(--lp-ink)] text-white text-sm font-bold py-2 rounded-lg">
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Departure City */}
        <div className="flex-1 min-w-0 px-4 py-3 border-b sm:border-b-0 border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Departure City</p>
          {departureCities.length > 0 ? (
            <select
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer"
            >
              <option value="">Any City</option>
              {departureCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              placeholder="e.g. Faisalabad"
              className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none placeholder:font-normal placeholder:text-gray-400"
            />
          )}
        </div>

        {/* Search button */}
        <div className="px-3 py-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={search}
            className="w-full sm:w-auto bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            🔍 Search
          </button>
        </div>
      </div>
    </div>
  );
}
