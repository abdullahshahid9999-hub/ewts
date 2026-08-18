"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Props = {
  defaultCountry?: string;
  defaultCategory?: string;
  defaultOccupation?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  defaultInfants?: number;
  dbCountries?: string[];
  countryTypeMap?: Record<string, string[]>;
};

const OCCUPATIONS = ["Job Holder", "Business Owner", "Retired/Unemployed"];
const STEPS = ["country", "category", "occupation", "travellers"] as const;
type Step = typeof STEPS[number];

export default function VisaSearchBar({ defaultCountry = "", defaultCategory = "", defaultOccupation = "", defaultAdults = 1, defaultChildren = 0, defaultInfants = 0, dbCountries = [], countryTypeMap = {} }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<Step | null>(null);
  const [country, setCountry] = useState(defaultCountry);
  const [category, setCategory] = useState(defaultCategory);
  const [occupation, setOccupation] = useState(defaultOccupation);
  const [adults, setAdults] = useState(defaultAdults || 1);
  const [children, setChildren] = useState(defaultChildren || 0);
  const [infants, setInfants] = useState(defaultInfants || 0);
  const [countryQ, setCountryQ] = useState("");

  const allCountries = dbCountries.length > 0 ? dbCountries : ["UAE", "Saudi Arabia", "Malaysia", "Thailand", "Turkey", "UK", "Schengen", "Canada", "Bahrain"];
  const filtered = countryQ ? allCountries.filter(c => c.toLowerCase().includes(countryQ.toLowerCase())) : allCountries;
  const categories = country && countryTypeMap[country]?.length ? countryTypeMap[country] : ["Tourist", "Visit Visa", "Business", "Transit", "Umrah"];

  function pickCountry(c: string) { setCountry(c); setCountryQ(""); setCategory(""); setTimeout(() => setModal("category"), 200); }
  function pickCategory(c: string) { setCategory(c); setTimeout(() => setModal("occupation"), 200); }
  function pickOccupation(o: string) { setOccupation(o); setTimeout(() => setModal("travellers"), 200); }
  function confirmTravellers() { setModal(null); doSearch(); }
  function doSearch() {
    const p = new URLSearchParams();
    if (country) p.set("q", country);
    if (category) p.set("type", category);
    if (occupation) p.set("occupation", occupation);
    if (adults !== 1) p.set("adults", String(adults));
    if (children) p.set("children", String(children));
    if (infants) p.set("infants", String(infants));
    router.push(`/visa${p.toString() ? `?${p}` : ""}`);
  }

  const totalTravellers = adults + children + infants;

  return (
    <>
      {/* Search bar — Mosafir style horizontal */}
      <div className="flex flex-col sm:flex-row items-stretch bg-white border border-gray-200 rounded-2xl shadow-md overflow-visible">
        {/* Country */}
        <button type="button" onClick={() => setModal("country")} className="flex-1 text-left px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-gray-100 hover:bg-gray-50 transition-colors rounded-l-2xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Country / State</p>
          <p className={`text-sm font-semibold ${country ? "text-gray-900" : "text-gray-400"}`}>{country || "Where are you going?"}</p>
        </button>
        {/* Visa Category */}
        <button type="button" onClick={() => setModal("category")} className="flex-1 text-left px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-gray-100 hover:bg-gray-50 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Visa Category</p>
          <p className={`text-sm font-semibold ${category ? "text-gray-900" : "text-gray-400"}`}>{category || "All Types"}</p>
        </button>
        {/* Occupation */}
        <button type="button" onClick={() => setModal("occupation")} className="flex-1 text-left px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-gray-100 hover:bg-gray-50 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Occupation</p>
          <p className={`text-sm font-semibold ${occupation ? "text-gray-900" : "text-gray-400"}`}>{occupation || "Any"}</p>
        </button>
        {/* Traveller */}
        <button type="button" onClick={() => setModal("travellers")} className="flex-1 text-left px-5 py-3.5 border-b sm:border-b-0 sm:border-r border-gray-100 hover:bg-gray-50 transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Traveller</p>
          <p className="text-sm font-semibold text-gray-900">👤 {totalTravellers} Person{totalTravellers !== 1 ? "s" : ""}</p>
        </button>
        {/* Search btn */}
        <button type="button" onClick={doSearch} className="flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-bold px-6 py-3.5 rounded-b-2xl sm:rounded-r-2xl sm:rounded-bl-none transition-colors text-sm whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          Search
        </button>
      </div>

      {/* MODAL WIZARD */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setModal(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
              <button onClick={() => { const idx = STEPS.indexOf(modal); setModal(idx > 0 ? STEPS[idx - 1] : null); }} className="text-amber-700 hover:text-amber-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h2 className="flex-1 text-center font-bold text-gray-900 text-base">
                {modal === "country" && "Select Country"}
                {modal === "category" && "Select Visa Category"}
                {modal === "occupation" && "Select Occupation"}
                {modal === "travellers" && "Select Traveller(s)"}
              </h2>
              {modal !== "travellers" && (
                <button onClick={() => { const idx = STEPS.indexOf(modal); setModal(STEPS[idx + 1]); }} className="text-xs font-semibold text-amber-700 hover:underline">Skip</button>
              )}
              {modal === "travellers" && <div className="w-10" />}
            </div>

            {/* Country step */}
            {modal === "country" && (
              <div className="flex flex-col max-h-[60vh]">
                <div className="px-4 py-3 border-b border-gray-100">
                  <input autoFocus value={countryQ} onChange={e => setCountryQ(e.target.value)} placeholder="Search country..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500" />
                </div>
                <div className="overflow-y-auto">
                  {filtered.map(c => (
                    <button key={c} type="button" onClick={() => pickCountry(c)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 border-b border-gray-50 text-left transition-colors">
                      <Image src="https://mosafir.pk/home_assets/images/visa.svg" alt="" width={28} height={28} unoptimized className="shrink-0" />
                      <span className="text-sm font-medium text-gray-800">{c}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No results for "{countryQ}"</p>}
                </div>
              </div>
            )}

            {/* Visa Category step */}
            {modal === "category" && (
              <div className="overflow-y-auto max-h-[60vh]">
                {categories.map(c => (
                  <button key={c} type="button" onClick={() => pickCategory(c)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-gray-100 text-left transition-colors">
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${category === c ? "border-red-600" : "border-gray-300"}`}>
                      {category === c && <span className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{c}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Occupation step */}
            {modal === "occupation" && (
              <div className="overflow-y-auto max-h-[60vh]">
                {OCCUPATIONS.map(o => (
                  <button key={o} type="button" onClick={() => pickOccupation(o)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-gray-100 text-left transition-colors">
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${occupation === o ? "border-red-600" : "border-gray-300"}`}>
                      {occupation === o && <span className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{o}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Travellers step */}
            {modal === "travellers" && (
              <div className="p-5">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-4 mb-6">
                  {[
                    { label: "Adult(s)", sub: "Above 12 years", img: "https://mosafir.pk/visa/images/adult.svg", val: adults, set: setAdults, min: 1 },
                    { label: "Child", sub: "Between 2-12 years", img: "https://mosafir.pk/visa/images/child.svg", val: children, set: setChildren, min: 0 },
                    { label: "Infant", sub: "Below 2 years", img: "https://mosafir.pk/visa/images/infant.svg", val: infants, set: setInfants, min: 0 },
                  ].map(({ label, sub, img, val, set, min }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Image src={img} alt={label} width={28} height={28} unoptimized className="shrink-0 opacity-80" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => set(Math.max(min, val - 1))} className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 font-bold hover:border-amber-600 transition-colors">−</button>
                        <span className="w-6 text-center font-bold text-gray-800">{val}</span>
                        <button type="button" onClick={() => set(val + 1)} className="w-8 h-8 rounded-full border-2 border-amber-600 text-amber-700 flex items-center justify-center font-bold hover:bg-amber-50 transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={confirmTravellers} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-full text-sm tracking-wider transition-colors">CONFIRM</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
