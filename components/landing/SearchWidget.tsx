"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INSURANCE_DESTINATIONS } from "@/lib/insuranceDestinations";

type ServiceKey = "umrah" | "group-tickets" | "tours" | "visa" | "insurance";

export type SearchFacets = {
  umrah: { destinations: string[] };
  tours: { destinations: string[] };
  groupTickets: { routes: string[] };
  visa: { countries: string[] };
};

const SERVICES: { key: ServiceKey; label: string; path: string; icon: string }[] = [
  { key: "umrah", label: "Umrah", path: "/umrah", icon: "🕋" },
  { key: "group-tickets", label: "Flights", path: "/group-tickets", icon: "✈️" },
  { key: "tours", label: "Tours", path: "/tours", icon: "🌍" },
  { key: "visa", label: "Visa", path: "/visa", icon: "📄" },
  { key: "insurance", label: "Insurance", path: "/insurance", icon: "🛡️" },
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
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travellers, setTravellers] = useState(1);
  const [paxOpen, setPaxOpen] = useState(false);

  const service = SERVICES.find((s) => s.key === active)!;

  // Every dropdown is a REAL, existing value pulled from the database —
  // never free text — so a customer never has to guess what to type.
  const options: string[] =
    active === "umrah" ? facets.umrah.destinations :
    active === "tours" ? facets.tours.destinations :
    active === "group-tickets" ? facets.groupTickets.routes :
    active === "visa" ? facets.visa.countries :
    [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("q", destination);
    if (active === "insurance") {
      if (travellers > 1) params.set("travellers", String(travellers));
    } else {
      if (adults !== 1) params.set("adults", String(adults));
      if (children) params.set("children", String(children));
      if (infants) params.set("infants", String(infants));
    }
    const qs = params.toString();
    router.push(`${service.path}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="lp-ticket lp-rise lp-rise-2 w-full max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {SERVICES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { setActive(s.key); setDestination(""); setPaxOpen(false); }}
            className={`lp-tab flex items-center gap-1.5 text-sm sm:text-base ${active === s.key ? "active" : ""}`}
          >
            <span aria-hidden>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        {/* Destination — a dropdown of real values, never a blank text box a customer has to guess what to type into */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden>📍</span>
          {active === "insurance" ? (
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-xl pl-11 pr-4 py-3.5 sm:py-4 text-sm sm:text-base outline-none appearance-none"
              style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: destination ? "var(--lp-text)" : "var(--lp-muted)" }}
            >
              <option value="">Where are you travelling to?</option>
              {INSURANCE_DESTINATIONS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((i) => <option key={i} value={i}>{i}</option>)}
                </optgroup>
              ))}
            </select>
          ) : (
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-xl pl-11 pr-4 py-3.5 sm:py-4 text-sm sm:text-base outline-none appearance-none"
              style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: destination ? "var(--lp-text)" : "var(--lp-muted)" }}
              disabled={options.length === 0}
            >
              <option value="">
                {options.length === 0 ? "Coming soon…" : active === "group-tickets" ? "Where would you like to fly?" : "Where would you like to go?"}
              </option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>

        {active === "insurance" ? (
          <div className="rounded-xl px-4 py-3.5 sm:py-4 flex items-center justify-center gap-3" style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)" }}>
            <span className="text-sm whitespace-nowrap" style={{ color: "var(--lp-text)" }}>👤</span>
            <button type="button" onClick={() => setTravellers((v) => Math.max(1, v - 1))} className="w-6 h-6 rounded-full font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>−</button>
            <span className="w-4 text-center font-semibold text-sm" style={{ color: "var(--lp-text)" }}>{travellers}</span>
            <button type="button" onClick={() => setTravellers((v) => v + 1)} className="w-6 h-6 rounded-full font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>+</button>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPaxOpen((v) => !v)}
              className="w-full sm:w-auto h-full rounded-xl px-4 py-3.5 sm:py-4 text-sm outline-none text-left whitespace-nowrap"
              style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: "var(--lp-text)" }}
            >
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

        <button type="submit" className="lp-search-btn px-8 py-3.5 sm:py-4 text-sm sm:text-base whitespace-nowrap">
          Search →
        </button>
      </form>
      <p className="text-xs mt-3 text-center sm:text-left" style={{ color: "var(--lp-muted)" }}>
        More filters — package type, airline, direct flights &amp; more — on the next page.
      </p>
    </div>
  );
}
