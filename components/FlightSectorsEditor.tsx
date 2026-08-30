"use client";
import { useState } from "react";
import AirportAutocomplete from "./AirportAutocomplete";
import { airlineFromFlightNo, airlineLogoUrl } from "@/lib/airlinesData";

export type Sector = {
  type: "Departure" | "Arrival" | "Via";
  flightNo: string;
  airlineIata: string;
  airlineName: string;
  fromIata: string;
  fromName: string;
  toIata: string;
  toName: string;
  date: string;
  time: string;
};

export const defaultSectors = (): Sector[] => [
  { type: "Departure", flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "" },
  { type: "Arrival",   flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "" },
];

export default function FlightSectorsEditor({
  sectors, onChange, accessToken,
}: {
  sectors: Sector[];
  onChange: (s: Sector[]) => void;
  accessToken?: string | null;
}) {
  const [lookingUp, setLookingUp] = useState<Record<number, boolean>>({});
  const [lookupError, setLookupError] = useState<Record<number, string>>({});

  function update(i: number, patch: Partial<Sector>) {
    const next = sectors.map((s, idx) => idx === i ? { ...s, ...patch } : s);
    onChange(next);
  }

  function handleFlightNoChange(i: number, val: string) {
    const airline = airlineFromFlightNo(val);
    update(i, {
      flightNo: val,
      airlineIata: airline?.iata ?? sectors[i].airlineIata,
      airlineName: airline?.name ?? sectors[i].airlineName,
    });
  }

  async function lookupFlight(i: number) {
    const flightNo = sectors[i].flightNo.trim();
    if (!flightNo) return;
    setLookingUp(l => ({ ...l, [i]: true }));
    setLookupError(e => ({ ...e, [i]: "" }));
    try {
      const res = await fetch(`/api/admin/flight-lookup?flight=${encodeURIComponent(flightNo)}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      if (!res.ok || !data.flight) {
        setLookupError(e => ({ ...e, [i]: data.error ?? "Flight not found." }));
        return;
      }
      const f = data.flight;
      const depTime = f.departure.scheduled ? new Date(f.departure.scheduled) : null;
      const arrTime = f.arrival.scheduled ? new Date(f.arrival.scheduled) : null;
      update(i, {
        airlineIata: f.airline.iata,
        airlineName: f.airline.name,
        fromIata: f.departure.iata,
        fromName: f.departure.airport,
        toIata: f.arrival.iata,
        toName: f.arrival.airport,
        date: depTime ? depTime.toISOString().slice(0, 10) : sectors[i].date,
        time: depTime ? depTime.toTimeString().slice(0, 5) : sectors[i].time,
      });
      // If arrival row follows, fill its time too
      if (sectors[i].type === "Departure" && sectors[i + 1]?.type === "Arrival" && arrTime) {
        const next = [...sectors];
        next[i + 1] = { ...next[i + 1],
          fromIata: f.arrival.iata, fromName: f.arrival.airport,
          date: arrTime.toISOString().slice(0, 10),
          time: arrTime.toTimeString().slice(0, 5),
        };
        onChange(next);
      }
    } catch {
      setLookupError(e => ({ ...e, [i]: "Lookup failed." }));
    } finally {
      setLookingUp(l => ({ ...l, [i]: false }));
    }
  }

  function addVia() {
    const arr = sectors.findIndex(s => s.type === "Arrival");
    const via: Sector = { type: "Via", flightNo: "", airlineIata: "", airlineName: "", fromIata: "", fromName: "", toIata: "", toName: "", date: "", time: "" };
    const next = [...sectors];
    next.splice(arr, 0, via);
    onChange(next);
  }

  function removeVia(i: number) {
    onChange(sectors.filter((_, idx) => idx !== i));
  }

  const LABEL_COLOR: Record<string, string> = { Departure: "#16a34a", Arrival: "#dc2626", Via: "#7c3aed" };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {sectors.map((sec, i) => {
        const locked = sec.type !== "Via";
        const airline = sec.airlineIata ? { iata: sec.airlineIata, name: sec.airlineName, logo: airlineLogoUrl(sec.airlineIata) } : null;
        return (
          <div key={i} style={{ border: "1.5px solid var(--a-border)", borderRadius: 10, padding: "12px 14px", background: "#fff" }}>
            {/* Row header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: LABEL_COLOR[sec.type] ?? "#000", minWidth: 70 }}>{sec.type}</span>
              {airline && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={airline.logo} alt={airline.name} style={{ height: 22, objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              {airline && <span style={{ fontSize: 11, color: "var(--a-muted)" }}>{airline.name}</span>}
              {!locked && (
                <button type="button" onClick={() => removeVia(i)} style={{ marginLeft: "auto", fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid #ef4444", color: "#ef4444", background: "none", cursor: "pointer" }}>− Remove</button>
              )}
            </div>
            {/* Flight number + lookup */}
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 120px 100px", gap: 8, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 9 }}>Flight No (e.g. PK741)</label>
                <div style={{ display: "flex", gap: 4 }}>
                  <input value={sec.flightNo} onChange={e => handleFlightNoChange(i, e.target.value)}
                    placeholder="PK741" style={{ flex: 1 }} />
                  <button type="button" onClick={() => lookupFlight(i)} disabled={lookingUp[i] || !sec.flightNo.trim()}
                    style={{ fontSize: 10, padding: "4px 7px", borderRadius: 5, border: "1px solid var(--a-blue)", background: "var(--a-blue)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap", opacity: !sec.flightNo.trim() ? 0.4 : 1 }}>
                    {lookingUp[i] ? "…" : "🔍"}
                  </button>
                </div>
                {lookupError[i] && <p style={{ fontSize: 9, color: "#ef4444", marginTop: 2 }}>{lookupError[i]}</p>}
              </div>
              <div>
                <label style={{ fontSize: 9 }}>From Airport</label>
                <AirportAutocomplete value={sec.fromName || sec.fromIata}
                  onChange={(val, airport) => update(i, { fromName: airport ? `${airport.iata} — ${airport.name}, ${airport.city}` : val, fromIata: airport?.iata ?? sec.fromIata })}
                  placeholder="Search departure airport" />
              </div>
              <div>
                <label style={{ fontSize: 9 }}>To Airport</label>
                <AirportAutocomplete value={sec.toName || sec.toIata}
                  onChange={(val, airport) => update(i, { toName: airport ? `${airport.iata} — ${airport.name}, ${airport.city}` : val, toIata: airport?.iata ?? sec.toIata })}
                  placeholder="Search arrival airport" />
              </div>
              <div>
                <label style={{ fontSize: 9 }}>Date</label>
                <input type="date" value={sec.date} onChange={e => update(i, { date: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 9 }}>Time</label>
                <input type="time" value={sec.time} onChange={e => update(i, { time: e.target.value })} />
              </div>
            </div>
          </div>
        );
      })}
      <button type="button" onClick={addVia}
        style={{ fontSize: 12, padding: "7px 14px", borderRadius: 7, border: "1.5px dashed #7c3aed", color: "#7c3aed", background: "none", cursor: "pointer", width: "fit-content" }}>
        + Add Via / Connecting Flight
      </button>
    </div>
  );
}
