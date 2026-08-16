"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

export default function VisaSearchBar({
  defaultCountry = "", defaultCategory = "", defaultOccupation = "",
  defaultAdults = 1, defaultChildren = 0, defaultInfants = 0,
  dbCountries = [], countryTypeMap = {},
}: {
  defaultCountry?: string; defaultCategory?: string; defaultOccupation?: string;
  defaultAdults?: number; defaultChildren?: number; defaultInfants?: number;
  dbCountries?: string[]; countryTypeMap?: Record<string, string[]>;
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
  const availableTypes: string[] = country && countryTypeMap[country]
    ? countryTypeMap[country]
    : Object.values(countryTypeMap).flat().filter((v, i, a) => a.indexOf(v) === i);

  useEffect(() => {
    function h(e: MouseEvent) { if (paxRef.current && !paxRef.current.contains(e.target as Node)) setPaxOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleSearch() {
    const p = new URLSearchParams();
    if (country.trim()) p.set("q", country.trim());
    if (category) p.set("type", category);
    if (occupation) p.set("occupation", occupation);
    if (adults !== 1) p.set("adults", String(adults));
    if (children > 0) p.set("children", String(children));
    if (infants > 0) p.set("infants", String(infants));
    startTransition(() => router.push(`/visa?${p.toString()}`));
    setPaxOpen(false);
  }

  const Seg = ({ label, children: ch }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col justify-center px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      {ch}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-0">
      {/* Desktop: horizontal pill | Mobile: stacked card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <Seg label="Country / State">
            <select value={country} onChange={e => { setCountry(e.target.value); setCategory(""); }}
              className="text-sm sm:text-base font-bold text-gray-800 outline-none bg-transparent appearance-none w-full cursor-pointer truncate">
              <option value="">Where are you going?</option>
              {dbCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Seg>
          <Seg label="Visa Category">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="text-sm sm:text-base font-bold text-gray-800 outline-none bg-transparent appearance-none w-full cursor-pointer">
              <option value="">All Types</option>
              {availableTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </Seg>
          <Seg label="Occupation">
            <select value={occupation} onChange={e => setOccupation(e.target.value)}
              className="text-sm sm:text-base font-bold text-gray-800 outline-none bg-transparent appearance-none w-full cursor-pointer">
              <option value="">Any</option>
              {APPLICANT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Seg>
          {/* Traveller */}
          <div className="flex flex-col justify-center px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative" ref={paxRef}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Traveller</p>
            <button type="button" onClick={() => setPaxOpen(v => !v)}
              className="text-sm sm:text-base font-bold text-gray-800 text-left flex items-center gap-1 whitespace-nowrap">
              👤 {totalPax} Person{totalPax !== 1 ? "s" : ""}
            </button>
            {paxOpen && (
              <div className="absolute top-full left-0 sm:left-auto mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 z-50">
                <PaxRow label="Adults" sub="12+ years" value={adults} min={1} onChange={setAdults} />
                <PaxRow label="Children" sub="2–11 years" value={children} min={0} onChange={setChildren} />
                <PaxRow label="Infants" sub="Under 2" value={infants} min={0} onChange={setInfants} />
                <button onClick={() => setPaxOpen(false)} className="mt-4 w-full py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: "var(--lp-ink)" }}>Done</button>
              </div>
            )}
          </div>
          {/* Search btn */}
          <button type="button" onClick={handleSearch} disabled={isPending}
            className="flex items-center justify-center gap-2 px-6 py-4 sm:rounded-r-2xl font-bold text-base text-black transition-all disabled:opacity-60 rounded-b-2xl sm:rounded-b-none"
            style={{ background: "var(--lp-brass)", minWidth: 120 }}>
            {isPending
              ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}
            Search
          </button>
        </div>
      </div>

      {/* Country chips */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {["UAE", "Thailand", "Malaysia", "Turkey", "UK", "Saudi Arabia"].filter(c => !dbCountries.length || dbCountries.includes(c)).concat(
          dbCountries.length ? dbCountries.filter(c => !["UAE","Thailand","Malaysia","Turkey","UK","Saudi Arabia"].includes(c)).slice(0, 3) : []
        ).slice(0, 8).map(c => (
          <button key={c} type="button" onClick={() => { setCountry(c); setCategory(""); }}
            className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all border"
            style={{ background: country === c ? "#b45309" : "#fff", borderColor: country === c ? "#b45309" : "#d1d5db", color: country === c ? "#fff" : "#374151" }}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaxRow({ label, sub, value, min, onChange }: { label: string; sub: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div><p className="font-bold text-sm">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-gray-400 transition disabled:opacity-30">−</button>
        <span className="w-5 text-center font-bold">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-gray-400 transition">+</button>
      </div>
    </div>
  );
}
