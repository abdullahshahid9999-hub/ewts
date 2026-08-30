"use client";
import { useState, useRef, useEffect } from "react";
import airportsRaw from "@/lib/airports-data.json";

type Airport = { iata: string; name: string; city: string; country: string; icao: string };
const AIRPORTS = airportsRaw as Airport[];

export default function AirportAutocomplete({
  value, onChange, placeholder = "Search airport or IATA code…", style,
}: {
  value: string;
  onChange: (val: string, airport?: Airport) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function search(q: string) {
    setQuery(q);
    onChange(q);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const ql = q.toLowerCase();
    const r = AIRPORTS.filter(a =>
      a.iata.toLowerCase().startsWith(ql) ||
      a.icao.toLowerCase().startsWith(ql) ||
      a.city.toLowerCase().includes(ql) ||
      a.name.toLowerCase().includes(ql)
    ).slice(0, 8);
    setResults(r);
    setOpen(r.length > 0);
  }

  function select(a: Airport) {
    const label = `${a.iata} — ${a.name}, ${a.city}, ${a.country}`;
    setQuery(label);
    onChange(label, a);
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder={placeholder}
        onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
        style={{ width: "100%" }}
        autoComplete="off"
      />
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
          background: "var(--a-surface, #fff)", border: "1.5px solid var(--a-border)",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 2,
        }}>
          {results.map((a) => (
            <div key={a.iata} onMouseDown={() => select(a)}
              style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--a-border)", display: "flex", gap: 10, alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--a-hover, #f0f4ff)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}>
              <span style={{ fontWeight: 800, fontSize: 13, minWidth: 36, color: "var(--a-blue, #2563eb)" }}>{a.iata}</span>
              <span style={{ fontSize: 12 }}>
                <strong>{a.name}</strong>
                <span style={{ color: "var(--a-muted)", fontSize: 11 }}> · {a.city}, {a.country}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
