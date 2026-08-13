"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

const POPULAR_COUNTRIES = [
  "UAE", "Saudi Arabia", "Thailand", "Malaysia", "UK", "Schengen", "Turkey",
  "China", "Canada", "Australia", "USA", "Qatar", "Kuwait", "Bahrain", "Oman",
];

export default function VisaSearchBar({ defaultCountry = "", defaultOccupation = "", defaultAdults = 1, defaultChildren = 0, defaultInfants = 0 }: {
  defaultCountry?: string;
  defaultOccupation?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  defaultInfants?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [country, setCountry] = useState(defaultCountry);
  const [occupation, setOccupation] = useState(defaultOccupation);
  const [adults, setAdults] = useState(defaultAdults);
  const [children, setChildren] = useState(defaultChildren);
  const [infants, setInfants] = useState(defaultInfants);
  const [showPax, setShowPax] = useState(false);

  const totalPax = adults + children + infants;

  function handleSearch() {
    const params = new URLSearchParams();
    if (country.trim()) params.set("q", country.trim());
    if (occupation) params.set("occupation", occupation);
    if (adults !== 1) params.set("adults", String(adults));
    if (children > 0) params.set("children", String(children));
    if (infants > 0) params.set("infants", String(infants));
    startTransition(() => {
      router.push(`/visa?${params.toString()}`);
    });
    setShowPax(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Main bar */}
      <div className="flex items-stretch bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">

        {/* Country */}
        <div className="flex-1 min-w-0 border-r border-border">
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Destination</p>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Select country…"
              list="visa-countries"
              className="w-full text-sm font-semibold text-[var(--lp-ink)] outline-none bg-transparent placeholder-muted"
            />
            <datalist id="visa-countries">
              {POPULAR_COUNTRIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        {/* Occupation */}
        <div className="flex-1 min-w-0 border-r border-border">
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Occupation</p>
            <select
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
              className="w-full text-sm font-semibold text-[var(--lp-ink)] outline-none bg-transparent appearance-none cursor-pointer"
            >
              <option value="">Any occupation</option>
              {APPLICANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Travellers trigger */}
        <div className="flex-shrink-0 border-r border-border relative">
          <button
            type="button"
            onClick={() => setShowPax(p => !p)}
            className="px-4 py-3 h-full text-left hover:bg-surface transition-colors"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Travellers</p>
            <p className="text-sm font-semibold text-[var(--lp-ink)] whitespace-nowrap">
              {totalPax} {totalPax === 1 ? "Person" : "Persons"}
            </p>
          </button>

          {/* PAX dropdown */}
          {showPax && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-border rounded-2xl shadow-xl p-5 z-50 w-72">
              <PaxRow label="Adults" sub="12+ years" value={adults} min={1} onChange={setAdults} />
              <PaxRow label="Children" sub="2–11 years" value={children} min={0} onChange={setChildren} />
              <PaxRow label="Infants" sub="Under 2" value={infants} min={0} onChange={setInfants} />
              <button onClick={() => setShowPax(false)}
                className="mt-3 w-full bg-[var(--lp-ink)] text-white font-semibold py-2 rounded-xl text-sm hover:bg-[var(--lp-ink-light)] transition">
                Done
              </button>
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={isPending}
          className="bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold px-6 flex items-center gap-2 text-sm transition-colors disabled:opacity-60 flex-shrink-0"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <span className="text-lg">🔍</span>
          )}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Popular chips */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {["UAE", "Thailand", "Malaysia", "Turkey", "UK"].map(c => (
          <button
            key={c}
            type="button"
            onClick={() => { setCountry(c); }}
            className="text-xs px-3 py-1 rounded-full bg-white/20 text-white/90 hover:bg-white/30 border border-white/20 transition-colors font-medium"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaxRow({ label, sub, value, min, onChange }: { label: string; sub: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm font-bold hover:border-[var(--lp-brass)] transition disabled:opacity-30"
          disabled={value <= min}>−</button>
        <span className="w-6 text-center font-bold text-sm">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm font-bold hover:border-[var(--lp-brass)] transition">+</button>
      </div>
    </div>
  );
}
