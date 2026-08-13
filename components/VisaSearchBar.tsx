"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

export default function VisaSearchBar({
  defaultCountry = "",
  defaultCategory = "",
  defaultOccupation = "",
  defaultAdults = 1,
  defaultChildren = 0,
  defaultInfants = 0,
  dbCountries = [],
  countryTypeMap = {},
}: {
  defaultCountry?: string;
  defaultCategory?: string;
  defaultOccupation?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  defaultInfants?: number;
  dbCountries?: string[];
  countryTypeMap?: Record<string, string[]>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [country, setCountry] = useState(defaultCountry);
  const [category, setCategory] = useState(defaultCategory);
  const [occupation, setOccupation] = useState(defaultOccupation);
  const [adults, setAdults] = useState(defaultAdults);
  const [children, setChildren] = useState(defaultChildren);
  const [infants, setInfants] = useState(defaultInfants);
  const [paxOpen, setPaxOpen] = useState(false);
  const paxRef = useRef<HTMLDivElement>(null);

  const totalPax = adults + children + infants;
  // Types available for the currently selected country (or all if no country selected)
  const availableTypes: string[] = country && countryTypeMap[country]
    ? countryTypeMap[country]
    : Object.values(countryTypeMap).flat().filter((v, i, a) => a.indexOf(v) === i);

  // Close pax dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (paxRef.current && !paxRef.current.contains(e.target as Node)) {
        setPaxOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (country.trim()) params.set("q", country.trim());
    if (category) params.set("type", category);
    if (occupation) params.set("occupation", occupation);
    if (adults !== 1) params.set("adults", String(adults));
    if (children > 0) params.set("children", String(children));
    if (infants > 0) params.set("infants", String(infants));
    startTransition(() => {
      router.push(`/visa?${params.toString()}`);
    });
    setPaxOpen(false);
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Main search bar — Mosafir style: segments separated by faint dividers */}
      <div className="flex items-stretch bg-white rounded-2xl shadow-2xl overflow-visible relative" style={{ minHeight: 72 }}>

        {/* Country/State */}
        <div className="flex-[2] min-w-0 flex flex-col justify-center px-5 py-3 border-r border-gray-200">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">
            Select Country / State
          </p>
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setCategory(""); }}
            className="text-base font-bold text-gray-800 outline-none bg-transparent appearance-none w-full cursor-pointer"
          >
            <option value="">Where are you going?</option>
            {dbCountries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Visa Category — filtered by selected country */}
        <div className="flex-[1.5] min-w-0 flex flex-col justify-center px-5 py-3 border-r border-gray-200">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">
            Visa Category
          </p>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="text-base font-bold text-gray-800 outline-none bg-transparent appearance-none w-full cursor-pointer"
          >
            <option value="">All Types</option>
            {availableTypes.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Occupation */}
        <div className="flex-[1.5] min-w-0 flex flex-col justify-center px-5 py-3 border-r border-gray-200">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">
            Occupation
          </p>
          <select
            value={occupation}
            onChange={e => setOccupation(e.target.value)}
            className="text-base font-bold text-gray-800 outline-none bg-transparent appearance-none w-full cursor-pointer"
          >
            <option value="">Any</option>
            {APPLICANT_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Travellers */}
        <div className="flex-1 min-w-0 relative" ref={paxRef}>
          <button
            type="button"
            onClick={() => setPaxOpen(v => !v)}
            className="w-full h-full flex flex-col justify-center px-5 py-3 text-left hover:bg-gray-50 transition-colors border-r border-gray-200"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-1">
              Traveller
            </p>
            <p className="text-base font-bold text-gray-800">
              {totalPax} Traveller{totalPax !== 1 ? "s" : ""}
            </p>
          </button>

          {/* Pax dropdown */}
          {paxOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 z-50">
              <PaxRow label="Adults" sub="12+ years" value={adults} min={1} onChange={setAdults} />
              <PaxRow label="Children" sub="2–11 years" value={children} min={0} onChange={setChildren} />
              <PaxRow label="Infants" sub="Under 2" value={infants} min={0} onChange={setInfants} />
              <button
                onClick={() => setPaxOpen(false)}
                className="mt-4 w-full py-2.5 rounded-xl font-bold text-sm text-white transition-colors"
                style={{ background: "var(--lp-ink)" }}
              >
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
          className="flex items-center gap-2.5 px-8 font-bold text-base text-white transition-all disabled:opacity-60 rounded-r-2xl flex-shrink-0"
          style={{ background: "var(--lp-brass)", minWidth: 130 }}
        >
          {isPending ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          )}
          Search
        </button>
      </div>

      {/* Quick country chips */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {["UAE", "Thailand", "Malaysia", "Turkey", "UK", "Saudi Arabia"].map(c => (
          <button
            key={c}
            type="button"
            onClick={() => { setCountry(c); setCategory(""); }}
            className="text-xs px-4 py-1.5 rounded-full font-semibold transition-all border"
            style={{
              background: country === c ? "var(--lp-brass)" : "rgba(255,255,255,0.15)",
              borderColor: country === c ? "var(--lp-brass)" : "rgba(255,255,255,0.3)",
              color: country === c ? "#000" : "rgba(255,255,255,0.9)",
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaxRow({ label, sub, value, min, onChange }: {
  label: string; sub: string; value: number; min: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-bold text-sm text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-gray-400 transition disabled:opacity-30"
        >−</button>
        <span className="w-6 text-center font-bold text-base text-gray-800">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-gray-400 transition"
        >+</button>
      </div>
    </div>
  );
}
