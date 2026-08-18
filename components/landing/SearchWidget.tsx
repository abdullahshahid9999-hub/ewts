"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INSURANCE_DESTINATIONS } from "@/lib/insuranceDestinations";
import { APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

type ServiceKey = "umrah" | "group-tickets" | "tours" | "visa" | "insurance";

export type SearchFacets = {
  umrah: { destinations: string[]; durations: string[]; departureCities: string[] };
  tours: { destinations: string[] };
  groupTickets: { routes: string[] };
visa: { countries: string[]; countryTypeMap: Record<string, string[]> };
};

const SERVICES: { key: ServiceKey; label: string; path: string; icon: string }[] = [
  { key: "umrah", label: "Umrah", path: "/umrah", icon: "🕋" },
  { key: "group-tickets", label: "Flights", path: "/group-tickets", icon: "✈️" },
  { key: "tours", label: "Tours", path: "/tours", icon: "🌍" },
  { key: "visa", label: "Visa", path: "/visa", icon: "🛂" },
  { key: "insurance", label: "Insurance", path: "/insurance", icon: "🛡️" },
];

const VISA_CATEGORIES = [
  { value: "", label: "All Types" },
  { value: "tourist", label: "Tourist" },
  { value: "umrah", label: "Umrah" },
  { value: "business", label: "Business" },
  { value: "e-visa", label: "E-Visa" },
];

function PaxCounter({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm" style={{ color: "var(--lp-text)" }}>{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-full flex items-center justify-center font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>−</button>
        <span className="w-5 text-center font-semibold" style={{ color: "var(--lp-text)" }}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="w-7 h-7 rounded-full flex items-center justify-center font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>+</button>
      </div>
    </div>
  );
}

export default function SearchWidget({ facets }: { facets: SearchFacets }) {
  const router = useRouter();
  const [active, setActive] = useState<ServiceKey>("umrah");
  const [destination, setDestination] = useState("");
  const [umrahDuration, setUmrahDuration] = useState("");
  const [umrahDepartureCity, setUmrahDepartureCity] = useState("");
  const [visaCategory, setVisaCategory] = useState("");
  const [occupation, setOccupation] = useState("");
  const [visaModal, setVisaModal] = useState<"country"|"category"|"occupation"|"travellers"|null>(null);
  const [visaCountryQ, setVisaCountryQ] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Dynamic visa categories filtered by selected destination
  const visaTypes: string[] = destination && facets.visa.countryTypeMap?.[destination]
    ? facets.visa.countryTypeMap[destination]
    : Object.values(facets.visa.countryTypeMap ?? {}).flat().filter((v, i, a) => a.indexOf(v) === i);
  const [travellers, setTravellers] = useState(1);
  const [paxOpen, setPaxOpen] = useState(false);

  const service = SERVICES.find((s) => s.key === active)!;
  const options: string[] =
    active === "umrah" ? facets.umrah.destinations :
    active === "tours" ? facets.tours.destinations :
    active === "group-tickets" ? facets.groupTickets.routes :
    active === "visa" ? facets.visa.countries : [];

  const totalPax = adults + children + infants;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("q", destination);
    if (active === "umrah") {
      if (umrahDuration) params.set("duration", umrahDuration);
      if (umrahDepartureCity) params.set("departureCity", umrahDepartureCity);
      if (adults !== 1) params.set("adults", String(adults));
      if (children) params.set("children", String(children));
      if (infants) params.set("infants", String(infants));
    } else if (active === "visa") {
      router.push("/visa"); return;
      if (occupation) params.set("occupation", occupation);
      if (adults !== 1) params.set("adults", String(adults));
      if (children) params.set("children", String(children));
      if (infants) params.set("infants", String(infants));
    } else if (active === "insurance") {
      if (travellers > 1) params.set("travellers", String(travellers));
    } else {
      if (adults !== 1) params.set("adults", String(adults));
      if (children) params.set("children", String(children));
      if (infants) params.set("infants", String(infants));
    }
    router.push(`${service.path}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="lp-ticket lp-rise lp-rise-2 w-full max-w-2xl mx-auto p-4 sm:p-6">
      {/* Tabs */}
      <div className="lp-tabs-row flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {SERVICES.map((s) => (
          <button key={s.key} type="button"
            onClick={() => { setActive(s.key); setDestination(""); setPaxOpen(false); }}
            className={`lp-tab flex items-center gap-1.5 text-sm sm:text-base ${active === s.key ? "active" : ""}`}>
            <span aria-hidden>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        {/* Umrah tab — Duration / Travellers / Departure City */}
        {active === "umrah" ? (
          <div className="flex flex-col sm:flex-row rounded-xl overflow-visible border" style={{ borderColor: "var(--lp-border)" }}>
            {/* Duration */}
            <div className="flex-1 flex flex-col justify-center px-4 py-3 border-b sm:border-b-0 sm:border-r" style={{ borderColor: "var(--lp-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--lp-muted)" }}>Duration</p>
              <select value={umrahDuration} onChange={e => setUmrahDuration(e.target.value)} className="text-sm font-bold outline-none bg-transparent appearance-none w-full cursor-pointer" style={{ color: umrahDuration ? "var(--lp-text)" : "var(--lp-muted)" }}>
                <option value="">Any Duration</option>
                {facets.umrah.durations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* Travellers */}
            <div className="flex-1 relative flex flex-col justify-center px-4 py-3 border-b sm:border-b-0 sm:border-r" style={{ borderColor: "var(--lp-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--lp-muted)" }}>Travellers</p>
              <button type="button" onClick={() => setPaxOpen(v => !v)} className="text-sm font-bold outline-none bg-transparent text-left" style={{ color: "var(--lp-text)" }}>
                👤 {adults + children + infants} Person{adults + children + infants !== 1 ? "s" : ""} ▾
              </button>
              {paxOpen && (
                <div className="absolute z-30 top-full left-0 mt-1 w-64 rounded-xl p-4" style={{ background: "var(--lp-ivory)", border: "1.5px solid var(--lp-border)", boxShadow: "0 16px 40px -12px rgba(14,42,38,0.3)" }}>
                  <PaxCounter label="Adults" value={adults} min={1} onChange={setAdults} />
                  <PaxCounter label="Children" value={children} min={0} onChange={setChildren} />
                  <PaxCounter label="Infants" value={infants} min={0} onChange={setInfants} />
                  <button type="button" onClick={() => setPaxOpen(false)} className="lp-search-btn w-full mt-3 py-2 text-sm">Done</button>
                </div>
              )}
            </div>
            {/* Departure City */}
            <div className="flex-1 flex flex-col justify-center px-4 py-3" style={{ borderColor: "var(--lp-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--lp-muted)" }}>Departure City</p>
              {facets.umrah.departureCities.length > 0 ? (
                <select value={umrahDepartureCity} onChange={e => setUmrahDepartureCity(e.target.value)} className="text-sm font-bold outline-none bg-transparent appearance-none w-full cursor-pointer" style={{ color: umrahDepartureCity ? "var(--lp-text)" : "var(--lp-muted)" }}>
                  <option value="">Any City</option>
                  {facets.umrah.departureCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input value={umrahDepartureCity} onChange={e => setUmrahDepartureCity(e.target.value)} placeholder="e.g. Faisalabad" className="text-sm font-bold outline-none bg-transparent w-full" style={{ color: "var(--lp-text)" }} />
              )}
            </div>
          </div>
        ) : active === "visa" ? (
          <>
          <div className="flex flex-col sm:flex-row rounded-xl overflow-visible border" style={{ borderColor: "var(--lp-border)" }}>
            <button type="button" onClick={() => setVisaModal("country")} className="flex-[2] flex flex-col justify-center px-4 py-3 border-b sm:border-b-0 sm:border-r text-left hover:bg-gray-50 transition-colors rounded-l-xl" style={{ borderColor: "var(--lp-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--lp-muted)" }}>Country / State</p>
              <p className="text-sm font-bold" style={{ color: destination ? "var(--lp-text)" : "var(--lp-muted)" }}>{destination || "Where are you going?"}</p>
            </button>
            <button type="button" onClick={() => setVisaModal("category")} className="flex-[1.2] flex flex-col justify-center px-4 py-3 border-b sm:border-b-0 sm:border-r text-left hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--lp-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--lp-muted)" }}>Visa Category</p>
              <p className="text-sm font-bold" style={{ color: visaCategory ? "var(--lp-text)" : "var(--lp-muted)" }}>{visaCategory || "All Types"}</p>
            </button>
            <button type="button" onClick={() => setVisaModal("occupation")} className="flex-[1.2] flex flex-col justify-center px-4 py-3 border-b sm:border-b-0 sm:border-r text-left hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--lp-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--lp-muted)" }}>Occupation</p>
              <p className="text-sm font-bold" style={{ color: occupation ? "var(--lp-text)" : "var(--lp-muted)" }}>{occupation || "Any"}</p>
            </button>
            <button type="button" onClick={() => setVisaModal("travellers")} className="flex-1 flex flex-col justify-center px-4 py-3 text-left hover:bg-gray-50 transition-colors">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--lp-muted)" }}>Traveller</p>
              <p className="text-sm font-bold" style={{ color: "var(--lp-text)" }}>👤 {adults+children+infants} Person{adults+children+infants!==1?"s":""}</p>
            </button>
          </div>
          {visaModal && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setVisaModal(null)}>
              <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b">
                  <button onClick={() => setVisaModal(null)} className="text-amber-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
                  <h2 className="flex-1 text-center font-bold text-gray-900 text-base">
                    {visaModal==="country"&&"Select Country"}{visaModal==="category"&&"Select Visa Category"}{visaModal==="occupation"&&"Select Occupation"}{visaModal==="travellers"&&"Select Traveller(s)"}
                  </h2>
                  {visaModal!=="travellers"&&<button type="button" onClick={()=>{const s=["country","category","occupation","travellers"] as const;setVisaModal(s[s.indexOf(visaModal)+1]);}} className="text-xs font-semibold text-amber-700">Skip</button>}
                  {visaModal==="travellers"&&<div className="w-10"/>}
                </div>
                {visaModal==="country"&&(
                  <div className="flex flex-col max-h-[55vh]">
                    <div className="px-4 py-3 border-b"><input autoFocus value={visaCountryQ} onChange={e=>setVisaCountryQ(e.target.value)} placeholder="Search country..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500"/></div>
                    <div className="overflow-y-auto">
                      {(visaCountryQ?options.filter(c=>c.toLowerCase().includes(visaCountryQ.toLowerCase())):options).map(c=>(
                        <button key={c} type="button" onClick={()=>{setDestination(c);setVisaCountryQ("");setVisaModal("category");}} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 border-b border-gray-50 text-left">
                          <span className="text-sm font-medium text-gray-800">{c}</span>
                        </button>
                      ))}
                      {options.filter(c=>c.toLowerCase().includes(visaCountryQ.toLowerCase())).length===0&&<p className="text-center py-8 text-gray-400 text-sm">No results</p>}
                    </div>
                  </div>
                )}
                {visaModal==="category"&&(
                  <div className="overflow-y-auto max-h-[55vh]">
                    {["Tourist","Visit Visa","Business","Transit","Umrah"].map(c=>(
                      <button key={c} type="button" onClick={()=>{setVisaCategory(c);setVisaModal("occupation");}} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-gray-100 text-left">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${visaCategory===c?"border-amber-600":"border-gray-300"}`}>{visaCategory===c&&<span className="w-2.5 h-2.5 rounded-full bg-amber-600"/>}</span>
                        <span className="text-sm font-medium text-gray-800">{c}</span>
                      </button>
                    ))}
                  </div>
                )}
                {visaModal==="occupation"&&(
                  <div className="overflow-y-auto max-h-[55vh]">
                    {["Job Holder","Business Owner","Retired/Unemployed"].map(o=>(
                      <button key={o} type="button" onClick={()=>{setOccupation(o);setVisaModal("travellers");}} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-gray-100 text-left">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${occupation===o?"border-amber-600":"border-gray-300"}`}>{occupation===o&&<span className="w-2.5 h-2.5 rounded-full bg-amber-600"/>}</span>
                        <span className="text-sm font-medium text-gray-800">{o}</span>
                      </button>
                    ))}
                  </div>
                )}
                {visaModal==="travellers"&&(
                  <div className="p-5">
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-4 mb-5">
                      {([{label:"Adults",sub:"12+ years",val:adults,set:setAdults,min:1},{label:"Children",sub:"2-12 years",val:children,set:setChildren,min:0},{label:"Infants",sub:"Under 2",val:infants,set:setInfants,min:0}] as const).map(({label,sub,val,set,min})=>(
                        <div key={label} className="flex items-center gap-3">
                          <div className="flex-1"><p className="text-sm font-semibold text-gray-800">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={()=>set(Math.max(min,val-1))} className="w-8 h-8 rounded-full border-2 border-gray-300 font-bold hover:border-amber-600 transition-colors">−</button>
                            <span className="w-6 text-center font-bold">{val}</span>
                            <button type="button" onClick={()=>set(val+1)} className="w-8 h-8 rounded-full border-2 border-amber-600 text-amber-700 font-bold hover:bg-amber-50 transition-colors">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={()=>setVisaModal(null)} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-full text-sm transition-colors">Confirm</button>
                  </div>
                )}
              </div>
            </div>
          )}
          </>
        ) : (
          /* Default row for other tabs */
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>📍</span>
              {active === "insurance" ? (
                <select value={destination} onChange={e => setDestination(e.target.value)}
                  className="w-full rounded-xl pl-11 pr-4 py-3.5 sm:py-4 text-sm sm:text-base outline-none appearance-none"
                  style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: destination ? "var(--lp-text)" : "var(--lp-muted)" }}>
                  <option value="">Where are you travelling to?</option>
                  {INSURANCE_DESTINATIONS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map(i => <option key={i} value={i}>{i}</option>)}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <select value={destination} onChange={e => setDestination(e.target.value)}
                  className="w-full rounded-xl pl-11 pr-4 py-3.5 sm:py-4 text-sm sm:text-base outline-none appearance-none"
                  style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: destination ? "var(--lp-text)" : "var(--lp-muted)" }}
                  disabled={options.length === 0}>
                  <option value="">{options.length === 0 ? "Coming soon…" : active === "group-tickets" ? "Where would you like to fly?" : "Where would you like to go?"}</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
            </div>
            {active === "insurance" ? (
              <div className="rounded-xl px-4 py-3.5 sm:py-4 flex items-center justify-center gap-3" style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)" }}>
                <span className="text-sm" style={{ color: "var(--lp-text)" }}>👤</span>
                <button type="button" onClick={() => setTravellers(v => Math.max(1, v - 1))} className="w-6 h-6 rounded-full font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>−</button>
                <span className="w-4 text-center font-semibold text-sm" style={{ color: "var(--lp-text)" }}>{travellers}</span>
                <button type="button" onClick={() => setTravellers(v => v + 1)} className="w-6 h-6 rounded-full font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>+</button>
              </div>
            ) : (
              <div className="relative">
                <button type="button" onClick={() => setPaxOpen(v => !v)}
                  className="w-full sm:w-auto h-full rounded-xl px-4 py-3.5 sm:py-4 text-sm outline-none text-left whitespace-nowrap"
                  style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: "var(--lp-text)" }}>
                  👤 {adults + children + infants} Traveller{adults + children + infants !== 1 ? "s" : ""}
                </button>
                {paxOpen && (
                  <div className="absolute z-20 mt-2 w-64 rounded-xl p-4 right-0" style={{ background: "var(--lp-ivory)", border: "1.5px solid var(--lp-border)", boxShadow: "0 16px 40px -12px rgba(14,42,38,0.3)" }}>
                    <PaxCounter label="Adults" value={adults} min={1} onChange={setAdults} />
                    <PaxCounter label="Children" value={children} min={0} onChange={setChildren} />
                    <PaxCounter label="Infants" value={infants} min={0} onChange={setInfants} />
                    <button type="button" onClick={() => setPaxOpen(false)} className="lp-search-btn w-full mt-3 py-2 text-sm">Done</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button type="submit" className="lp-search-btn px-8 py-3.5 sm:py-4 text-sm sm:text-base whitespace-nowrap w-full">
          Search →
        </button>
      </form>
      <p className="text-xs mt-3 text-center sm:text-left" style={{ color: "var(--lp-muted)" }}>
        More filters — package type, airline, direct flights &amp; more — on the next page.
      </p>
    </div>
  );
}
