"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ServiceKey = "umrah" | "group-tickets" | "tours" | "visa" | "insurance";

export type FilterOptions = {
  umrah: { tiers: string[]; airlines: string[]; durations: string[] };
  tours: { tiers: string[]; airlines: string[]; durations: string[] };
  groupTickets: { airlines: string[] };
  visa: { types: string[]; countries: string[] };
};

const SERVICES: { key: ServiceKey; label: string; path: string; placeholder: string; icon: string }[] = [
  { key: "umrah", label: "Umrah", path: "/umrah", placeholder: "Search by package or destination…", icon: "🕋" },
  { key: "group-tickets", label: "Flights", path: "/group-tickets", placeholder: "Search by airline or route (e.g. Lahore → Dubai)…", icon: "✈️" },
  { key: "tours", label: "Tours", path: "/tours", placeholder: "Search by destination (e.g. Bali, Thailand)…", icon: "🌍" },
  { key: "visa", label: "Visa", path: "/visa", placeholder: "Search by country (e.g. UAE, UK)…", icon: "📄" },
  { key: "insurance", label: "Insurance", path: "/insurance", placeholder: "Search by plan or provider…", icon: "🛡️" },
];

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  if (options.length === 0) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl px-3.5 py-3 text-sm outline-none bg-transparent"
      style={{ border: "1.5px solid var(--lp-border)", color: value ? "var(--lp-text)" : "var(--lp-muted)", background: "var(--lp-sand)" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function PaxCounter({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm" style={{ color: "var(--lp-text)" }}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
          style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}
        >−</button>
        <span className="w-5 text-center font-semibold" style={{ color: "var(--lp-text)" }}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
          style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}
        >+</button>
      </div>
    </div>
  );
}

export default function SearchWidget({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const [active, setActive] = useState<ServiceKey>("umrah");
  const [query, setQuery] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travellers, setTravellers] = useState(1); // insurance uses one combined count, matching InsuranceCalculator's own model
  const [tier, setTier] = useState("");
  const [airline, setAirline] = useState("");
  const [duration, setDuration] = useState("");
  const [direct, setDirect] = useState(false);
  const [visaType, setVisaType] = useState("");
  const [paxOpen, setPaxOpen] = useState(false);

  const service = SERVICES.find((s) => s.key === active)!;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());

    if (active === "insurance") {
      if (travellers > 1) params.set("travellers", String(travellers));
    } else {
      if (adults !== 1) params.set("adults", String(adults));
      if (children) params.set("children", String(children));
      if (infants) params.set("infants", String(infants));
    }

    if ((active === "umrah" || active === "tours") && tier) params.set("tier", tier);
    if ((active === "umrah" || active === "tours" || active === "group-tickets") && airline) params.set("airline", airline);
    if ((active === "umrah" || active === "tours") && duration) params.set("duration", duration);
    if (active === "group-tickets" && direct) params.set("direct", "1");
    if (active === "visa" && visaType) params.set("type", visaType);

    const qs = params.toString();
    router.push(`${service.path}${qs ? `?${qs}` : ""}`);
  }

  const showTier = active === "umrah" || active === "tours";
  const showAirline = active === "umrah" || active === "tours" || active === "group-tickets";
  const showDuration = active === "umrah" || active === "tours";
  const showDirect = active === "group-tickets";
  const showVisaType = active === "visa";
  const showPax = active !== "insurance";
  const filterOpts = active === "umrah" ? options.umrah : active === "tours" ? options.tours : active === "group-tickets" ? { airlines: options.groupTickets.airlines } : null;

  return (
    <div className="lp-ticket lp-rise lp-rise-2 w-full max-w-3xl mx-auto p-4 sm:p-6">
      {/* Service tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {SERVICES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { setActive(s.key); setPaxOpen(false); }}
            className={`lp-tab flex items-center gap-1.5 text-sm sm:text-base ${active === s.key ? "active" : ""}`}
          >
            <span aria-hidden>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={service.placeholder}
            className="flex-1 rounded-xl px-4 py-3.5 sm:py-4 text-sm sm:text-base outline-none"
            style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: "var(--lp-text)" }}
          />

          {/* Pax picker — a popover so the bar stays one clean row on desktop instead of sprawling into 6+ fields */}
          {showPax && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPaxOpen((v) => !v)}
                className="w-full sm:w-auto rounded-xl px-4 py-3.5 sm:py-4 text-sm outline-none text-left whitespace-nowrap"
                style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: "var(--lp-text)" }}
              >
                👤 {adults + children + infants} Traveller{adults + children + infants !== 1 ? "s" : ""}
              </button>
              {paxOpen && (
                <div className="absolute z-20 mt-2 w-64 rounded-xl p-4 right-0 sm:right-auto" style={{ background: "var(--lp-ivory)", border: "1.5px solid var(--lp-border)", boxShadow: "0 16px 40px -12px rgba(14,42,38,0.3)" }}>
                  <PaxCounter label="Adults" value={adults} min={1} onChange={setAdults} />
                  <PaxCounter label="Children" value={children} min={0} onChange={setChildren} />
                  <PaxCounter label="Infants" value={infants} min={0} onChange={setInfants} />
                  <button type="button" onClick={() => setPaxOpen(false)} className="lp-search-btn w-full mt-3 py-2 text-sm">Done</button>
                </div>
              )}
            </div>
          )}

          {active === "insurance" && (
            <div className="rounded-xl px-4 py-3.5 sm:py-4 flex items-center gap-3" style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)" }}>
              <span className="text-sm whitespace-nowrap" style={{ color: "var(--lp-text)" }}>👤 Travellers</span>
              <button type="button" onClick={() => setTravellers((v) => Math.max(1, v - 1))} className="w-6 h-6 rounded-full font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>−</button>
              <span className="w-4 text-center font-semibold text-sm" style={{ color: "var(--lp-text)" }}>{travellers}</span>
              <button type="button" onClick={() => setTravellers((v) => v + 1)} className="w-6 h-6 rounded-full font-bold" style={{ border: "1.5px solid var(--lp-border)", color: "var(--lp-ink)" }}>+</button>
            </div>
          )}

          <button type="submit" className="lp-search-btn px-8 py-3.5 sm:py-4 text-sm sm:text-base whitespace-nowrap">
            Search {service.label} →
          </button>
        </div>

        {/* Structured filters — meaningful per service instead of one generic text box */}
        {(showTier || showAirline || showDuration || showDirect || showVisaType) && (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {showTier && <Select value={tier} onChange={setTier} options={filterOpts && "tiers" in filterOpts ? filterOpts.tiers : []} placeholder="Package Type" />}
            {showAirline && <Select value={airline} onChange={setAirline} options={filterOpts?.airlines ?? []} placeholder="Airline" />}
            {showDuration && <Select value={duration} onChange={setDuration} options={filterOpts && "durations" in filterOpts ? filterOpts.durations : []} placeholder="Duration" />}
            {showVisaType && <Select value={visaType} onChange={setVisaType} options={options.visa.types} placeholder="Visa Type" />}
            {showDirect && (
              <label className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm cursor-pointer" style={{ border: "1.5px solid var(--lp-border)", background: "var(--lp-sand)", color: "var(--lp-text)" }}>
                <input type="checkbox" checked={direct} onChange={(e) => setDirect(e.target.checked)} />
                Direct flights only
              </label>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
