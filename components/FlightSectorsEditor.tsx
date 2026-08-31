"use client";
import { useState, useRef } from "react";
import AirportAutocomplete from "./AirportAutocomplete";
import { airlineFromFlightNo, airlineLogoUrl } from "@/lib/airlinesData";

export type Sector = {
  type: "Departure" | "Arrival" | "Via";
  flightNo: string; airlineIata: string; airlineName: string;
  fromIata: string; fromName: string; toIata: string; toName: string;
  date: string; time: string;
};

export const defaultSectors = (): Sector[] => [
  { type: "Departure", flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "" },
  { type: "Arrival",   flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "" },
];

const TYPE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  Departure: { color: "#15803d", bg: "#dcfce7", label: "🛫 Departure" },
  Arrival:   { color: "#dc2626", bg: "#fee2e2", label: "🛬 Arrival" },
  Via:       { color: "#7c3aed", bg: "#ede9fe", label: "🔄 Via / Connecting" },
};

export default function FlightSectorsEditor({ sectors, onChange, accessToken }: {
  sectors: Sector[]; onChange: (s: Sector[]) => void; accessToken?: string | null;
}) {
  const [lookingUp, setLookingUp] = useState<Record<number, boolean>>({});
  const [lookupError, setLookupError] = useState<Record<number, string>>({});
  // Keep a ref to latest accessToken to avoid stale closure
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  function update(i: number, patch: Partial<Sector>) {
    onChange(sectors.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  function handleFlightNoChange(i: number, val: string) {
    const airline = val.trim().length >= 2 ? airlineFromFlightNo(val) : null;
    update(i, {
      flightNo: val,
      // Clear airline if val empty, set if matched, keep existing if no match
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
      const token = tokenRef.current;
      const res = await fetch(`/api/admin/flight-lookup?flight=${encodeURIComponent(flightNo)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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
      };
      if (sectors[i].type === "Departure" && sectors[i + 1]?.type === "Arrival" && f.arrival.date) {
        updated[i + 1] = { ...updated[i + 1],
          fromIata: f.arrival.iata || updated[i + 1].fromIata,
          fromName: f.arrival.airport || updated[i + 1].fromName,
          date: f.arrival.date,
          time: f.arrival.time || updated[i + 1].time,
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
    const via: Sector = { type: "Via", flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "" };
    const next = [...sectors];
    next.splice(arrIdx < 0 ? next.length : arrIdx, 0, via);
    onChange(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sectors.map((sec, i) => {
        const ts = TYPE_STYLE[sec.type] ?? TYPE_STYLE.Via;
        const hasAirline = !!sec.airlineIata;
        return (
          <div key={i} style={{ borderRadius: 12, border: `1.5px solid ${ts.color}33`, overflow: "hidden", background: "#fff" }}>
            {/* Header bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: ts.bg }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: ts.color }}>{ts.label}</span>
              {hasAirline && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={airlineLogoUrl(sec.airlineIata)} alt={sec.airlineName}
                    style={{ height: 20, objectFit: "contain", background: "#fff", borderRadius: 4, padding: "1px 4px" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: ts.color }}>{sec.airlineName || sec.airlineIata}</span>
                  {sec.flightNo && <span style={{ fontSize: 11, color: ts.color, opacity: 0.7 }}>· {sec.flightNo.toUpperCase()}</span>}
                </>
              )}
              {sec.type === "Via" && (
                <button type="button" onClick={() => onChange(sectors.filter((_, idx) => idx !== i))}
                  style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 5, border: `1px solid ${ts.color}`, color: ts.color, background: "transparent", cursor: "pointer" }}>
                  Remove
                </button>
              )}
            </div>

            {/* Fields */}
            <div style={{ padding: "12px 14px", display: "grid", gap: 10 }}>
              {/* Row 1: Flight no + lookup */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 160 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4 }}>Flight No</label>
                  <input value={sec.flightNo} onChange={e => handleFlightNoChange(i, e.target.value)}
                    placeholder="e.g. PK741" style={{ width: "100%", textTransform: "uppercase", fontFamily: "monospace" }} />
                </div>
                <button type="button" onClick={() => lookupFlight(i)}
                  disabled={lookingUp[i] || !sec.flightNo.trim()}
                  style={{
                    padding: "8px 16px", borderRadius: 7, border: "none", fontWeight: 700, fontSize: 12,
                    background: sec.flightNo.trim() ? ts.color : "#e2e8f0",
                    color: sec.flightNo.trim() ? "#fff" : "#94a3b8",
                    cursor: sec.flightNo.trim() ? "pointer" : "not-allowed",
                    whiteSpace: "nowrap", transition: "all 0.15s",
                  }}>
                  {lookingUp[i] ? "Looking up…" : "🔍 Auto-fill from live data"}
                </button>
                {lookupError[i] && <span style={{ fontSize: 11, color: "#dc2626" }}>{lookupError[i]}</span>}
              </div>

              {/* Row 2: From → To, Date, Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 130px 100px", gap: 8, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4 }}>From Airport</label>
                  <AirportAutocomplete value={sec.fromName || sec.fromIata}
                    onChange={(val, a) => update(i, { fromName: a ? `${a.iata} — ${a.name}, ${a.city}` : val, fromIata: a?.iata ?? sec.fromIata })}
                    placeholder="Search city or IATA…" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4 }}>To Airport</label>
                  <AirportAutocomplete value={sec.toName || sec.toIata}
                    onChange={(val, a) => update(i, { toName: a ? `${a.iata} — ${a.name}, ${a.city}` : val, toIata: a?.iata ?? sec.toIata })}
                    placeholder="Search city or IATA…" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4 }}>Date</label>
                  <input type="date" value={sec.date} onChange={e => update(i, { date: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4 }}>Time</label>
                  <input type="time" value={sec.time} onChange={e => update(i, { time: e.target.value })} style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" onClick={addVia}
        style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 8, border: "2px dashed #7c3aed", color: "#7c3aed", background: "transparent", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
        + Add Via / Connecting Flight
      </button>
    </div>
  );
}
