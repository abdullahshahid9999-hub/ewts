"use client";
import { useState, useRef } from "react";
import AirportAutocomplete from "./AirportAutocomplete";
import { airlineFromFlightNo, airlineLogoUrl } from "@/lib/airlinesData";

export type Sector = {
  type: "Departure" | "Arrival" | "Via";
  flightNo: string; airlineIata: string; airlineName: string;
  fromIata: string; fromName: string; toIata: string; toName: string;
  date: string; time: string;       // departure date/time
  arrDate: string; arrTime: string; // arrival date/time at destination
};

export const defaultSectors = (): Sector[] => [
  { type: "Departure", flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "", arrDate: "", arrTime: "" },
  { type: "Arrival",   flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "", arrDate: "", arrTime: "" },
];

const TS: Record<string, { color: string; bg: string; label: string }> = {
  Departure: { color: "#15803d", bg: "#dcfce7", label: "🛫 Departure" },
  Arrival:   { color: "#dc2626", bg: "#fee2e2", label: "🛬 Arrival" },
  Via:       { color: "#7c3aed", bg: "#ede9fe", label: "🔄 Via / Connecting" },
};

export default function FlightSectorsEditor({ sectors, onChange, accessToken }: {
  sectors: Sector[]; onChange: (s: Sector[]) => void; accessToken?: string | null;
}) {
  const [lookingUp, setLookingUp] = useState<Record<number, boolean>>({});
  const [lookupError, setLookupError] = useState<Record<number, string>>({});
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  function update(i: number, patch: Partial<Sector>) {
    onChange(sectors.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  function handleFlightNoChange(i: number, val: string) {
    const airline = val.trim().length >= 2 ? airlineFromFlightNo(val) : null;
    update(i, {
      flightNo: val,
      airlineIata: airline ? airline.iata : val.trim() ? sectors[i].airlineIata : "",
      airlineName: airline ? airline.name : val.trim() ? sectors[i].airlineName : "",
    });
  }

  async function lookupFlight(i: number) {
    const flightNo = sectors[i].flightNo.trim();
    if (!flightNo) return;
    setLookingUp(l => ({ ...l, [i]: true }));
    setLookupError(e => ({ ...e, [i]: "" }));
    try {
      const res = await fetch(`/api/admin/flight-lookup?flight=${encodeURIComponent(flightNo)}`,
        { headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {} });
      const data = await res.json();
      if (!res.ok || !data.flight) {
        setLookupError(e => ({ ...e, [i]: data.error ?? "Flight not found." }));
        return;
      }
      const f = data.flight;
      const updated = [...sectors];
      updated[i] = { ...updated[i],
        airlineIata: f.airline.iata || updated[i].airlineIata,
        airlineName: f.airline.name || updated[i].airlineName,
        fromIata: f.departure.iata || updated[i].fromIata,
        fromName: f.departure.airport || updated[i].fromName,
        toIata: f.arrival.iata || updated[i].toIata,
        toName: f.arrival.airport || updated[i].toName,
        date: f.departure.date || updated[i].date,
        time: f.departure.time || updated[i].time,
        arrDate: f.arrival.date || updated[i].arrDate,
        arrTime: f.arrival.time || updated[i].arrTime,
      };
      // Pre-fill next Arrival row's From Airport only
      if (sectors[i].type === "Departure" && sectors[i + 1]?.type === "Arrival") {
        updated[i + 1] = { ...updated[i + 1],
          fromIata: updated[i + 1].fromIata || f.arrival.iata,
          fromName: updated[i + 1].fromName || f.arrival.airport,
        };
      }
      onChange(updated);
    } catch {
      setLookupError(e => ({ ...e, [i]: "Lookup failed. Check flight number." }));
    } finally {
      setLookingUp(l => ({ ...l, [i]: false }));
    }
  }

  function addVia() {
    const arrIdx = sectors.findIndex(s => s.type === "Arrival");
    const via: Sector = { type: "Via", flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "", arrDate: "", arrTime: "" };
    const next = [...sectors];
    next.splice(arrIdx < 0 ? next.length : arrIdx, 0, via);
    onChange(next);
  }

  function fmt12(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    if (isNaN(h)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sectors.map((sec, i) => {
        const ts = TS[sec.type] ?? TS.Via;
        const hasAirline = !!sec.airlineIata;
        const hasFrom = sec.fromIata || sec.fromName;
        const hasTo = sec.toIata || sec.toName;
        return (
          <div key={i} style={{ borderRadius: 12, border: `1.5px solid ${ts.color}44`, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: ts.bg, borderBottom: `1px solid ${ts.color}22` }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: ts.color }}>{ts.label}</span>
              {hasAirline && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={airlineLogoUrl(sec.airlineIata)} alt={sec.airlineName}
                    style={{ height: 22, objectFit: "contain", background: "#fff", borderRadius: 4, padding: "1px 5px" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: ts.color }}>{sec.airlineName || sec.airlineIata}</span>
                  {sec.flightNo && <span style={{ fontSize: 11, color: ts.color, opacity: 0.7, fontFamily: "monospace" }}>· {sec.flightNo.toUpperCase()}</span>}
                </>
              )}
              {/* Flight summary pill */}
              {hasFrom && hasTo && (
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: ts.color, background: "#fff", padding: "2px 10px", borderRadius: 20, border: `1px solid ${ts.color}44` }}>
                  {sec.fromIata || sec.fromName.split(",")[0]} → {sec.toIata || sec.toName.split(",")[0]}
                  {sec.date && ` · ${sec.date}`}
                </span>
              )}
              {sec.type === "Via" && (
                <button type="button" onClick={() => onChange(sectors.filter((_, idx) => idx !== i))}
                  style={{ marginLeft: hasFrom && hasTo ? 8 : "auto", fontSize: 11, padding: "2px 8px", borderRadius: 5, border: `1px solid ${ts.color}`, color: ts.color, background: "#fff", cursor: "pointer" }}>
                  Remove
                </button>
              )}
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "14px 16px", display: "grid", gap: 12 }}>

              {/* Flight No + Lookup */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ minWidth: 140 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--a-muted)" }}>FLIGHT NO</label>
                  <input value={sec.flightNo} onChange={e => handleFlightNoChange(i, e.target.value)}
                    placeholder="e.g. PK741" style={{ width: "100%", textTransform: "uppercase", fontFamily: "monospace", letterSpacing: 1 }} />
                </div>
                <button type="button" onClick={() => lookupFlight(i)}
                  disabled={lookingUp[i] || !sec.flightNo.trim()}
                  style={{
                    padding: "9px 20px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12,
                    background: sec.flightNo.trim() ? ts.color : "#e2e8f0",
                    color: sec.flightNo.trim() ? "#fff" : "#94a3b8",
                    cursor: sec.flightNo.trim() ? "pointer" : "not-allowed",
                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                  }}>
                  {lookingUp[i] ? "⟳ Looking up…" : "🔍 Auto-fill from live data"}
                </button>
                {lookupError[i] && <span style={{ fontSize: 11, color: "#dc2626", alignSelf: "center" }}>{lookupError[i]}</span>}
              </div>

              {/* From → To */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--a-muted)" }}>FROM AIRPORT</label>
                  <AirportAutocomplete value={sec.fromName || sec.fromIata}
                    onChange={(val, a) => update(i, { fromName: a ? `${a.iata} — ${a.name}, ${a.city}` : val, fromIata: a?.iata ?? sec.fromIata })}
                    placeholder="Search city or IATA code…" />
                </div>
                <div style={{ fontSize: 20, color: ts.color, paddingBottom: 6, textAlign: "center", minWidth: 28 }}>→</div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--a-muted)" }}>TO AIRPORT</label>
                  <AirportAutocomplete value={sec.toName || sec.toIata}
                    onChange={(val, a) => update(i, { toName: a ? `${a.iata} — ${a.name}, ${a.city}` : val, toIata: a?.iata ?? sec.toIata })}
                    placeholder="Search city or IATA code…" />
                </div>
              </div>

              {/* Departure Date/Time → Arrival Date/Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto 1fr 1fr", gap: 8, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--a-muted)" }}>DEP DATE</label>
                  <input type="date" value={sec.date} onChange={e => update(i, { date: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--a-muted)" }}>DEP TIME</label>
                  <input type="time" value={sec.time} onChange={e => update(i, { time: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div style={{ fontSize: 18, color: "#94a3b8", paddingBottom: 6, textAlign: "center" }}>✈</div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--a-muted)" }}>ARR DATE</label>
                  <input type="date" value={sec.arrDate} onChange={e => update(i, { arrDate: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4, color: "var(--a-muted)" }}>ARR TIME</label>
                  <input type="time" value={sec.arrTime} onChange={e => update(i, { arrTime: e.target.value })} style={{ width: "100%" }} />
                </div>
              </div>

              {/* Summary row */}
              {(sec.time || sec.arrTime) && (
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: ts.color, fontWeight: 600, padding: "6px 10px", background: ts.bg, borderRadius: 7 }}>
                  {sec.time && <span>🛫 Dep: {fmt12(sec.time)}{sec.date ? ` · ${sec.date}` : ""}</span>}
                  {sec.arrTime && <span>🛬 Arr: {fmt12(sec.arrTime)}{sec.arrDate && sec.arrDate !== sec.date ? ` · ${sec.arrDate}` : ""}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button type="button" onClick={addVia}
        style={{ alignSelf: "flex-start", padding: "9px 20px", borderRadius: 8, border: "2px dashed #7c3aed", color: "#7c3aed", background: "#faf5ff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
        + Add Via / Connecting Flight
      </button>
    </div>
  );
}
