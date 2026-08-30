"use client";
import { useEffect, useState } from "react";

type Status = "scheduled" | "active" | "landed" | "cancelled" | "incident" | "diverted" | "unknown";

const STATUS_COLOR: Record<Status, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "#eff6ff", text: "#1d4ed8", label: "Scheduled" },
  active:    { bg: "#f0fdf4", text: "#15803d", label: "In Air ✈" },
  landed:    { bg: "#f9fafb", text: "#374151", label: "Landed" },
  cancelled: { bg: "#fef2f2", text: "#dc2626", label: "Cancelled" },
  incident:  { bg: "#fff7ed", text: "#c2410c", label: "Incident" },
  diverted:  { bg: "#fefce8", text: "#a16207", label: "Diverted" },
  unknown:   { bg: "#f9fafb", text: "#9ca3af", label: "Status N/A" },
};

export default function FlightStatusBadge({ flightIata }: { flightIata: string }) {
  const [data, setData] = useState<{ status: Status; departure?: { iata: string; scheduled: string }; arrival?: { iata: string; scheduled: string } } | null>(null);

  useEffect(() => {
    if (!flightIata) return;
    fetch(`/api/flight-status?flight=${encodeURIComponent(flightIata)}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ status: "unknown" }));
  }, [flightIata]);

  if (!data) return <span style={{ fontSize: 11, color: "#9ca3af" }}>Loading status…</span>;

  const s = STATUS_COLOR[data.status as Status] ?? STATUS_COLOR.unknown;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.text, fontSize: 12, fontWeight: 700, border: `1px solid ${s.text}22` }}>
      {flightIata} · {s.label}
      {data.departure?.scheduled && (
        <span style={{ fontWeight: 400, fontSize: 11 }}>
          {" "}· Dep {new Date(data.departure.scheduled).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </span>
  );
}
