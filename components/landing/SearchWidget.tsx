"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ServiceKey = "umrah" | "group-tickets" | "tours" | "visa" | "insurance";

const SERVICES: { key: ServiceKey; label: string; path: string; placeholder: string; icon: string }[] = [
  { key: "umrah", label: "Umrah", path: "/umrah", placeholder: "Search by package or destination…", icon: "🕋" },
  { key: "group-tickets", label: "Flights", path: "/group-tickets", placeholder: "Search by airline or route (e.g. Lahore → Dubai)…", icon: "✈️" },
  { key: "tours", label: "Tours", path: "/tours", placeholder: "Search by destination (e.g. Bali, Thailand)…", icon: "🌍" },
  { key: "visa", label: "Visa", path: "/visa", placeholder: "Search by country (e.g. UAE, UK)…", icon: "📄" },
  { key: "insurance", label: "Insurance", path: "/insurance", placeholder: "Search by plan or provider…", icon: "🛡️" },
];

export default function SearchWidget() {
  const router = useRouter();
  const [active, setActive] = useState<ServiceKey>("umrah");
  const [query, setQuery] = useState("");
  const service = SERVICES.find((s) => s.key === active)!;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`${service.path}${params}`);
  }

  return (
    <div className="lp-ticket lp-rise lp-rise-2 w-full max-w-2xl mx-auto p-3 sm:p-4">
      {/* Service tabs — horizontally scrollable on mobile so all 5 stay reachable without wrapping/crowding */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {SERVICES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={`lp-tab flex items-center gap-1.5 ${active === s.key ? "active" : ""}`}
          >
            <span aria-hidden>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 pr-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={service.placeholder}
          className="flex-1 rounded-xl px-4 py-3.5 text-sm outline-none"
          style={{ background: "var(--lp-sand)", border: "1.5px solid var(--lp-border)", color: "var(--lp-text)" }}
        />
        <button type="submit" className="lp-search-btn px-7 py-3.5 text-sm">
          Search {service.label} →
        </button>
      </form>
    </div>
  );
}
