"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import AgentIssueRequestModal from "@/components/AgentIssueRequestModal";

type Booking = {
  id: string;
  bookingRef: string;
  serviceType: string;
  status: string;
  commission: number;
  sellPrice: number;
  customerName: string | null;
  expiresAt: string | null;
  createdAt: string;
  groupFlight: { airline: string; route: string; flightNo: string | null; depDate: string | null } | null;
  package: { name: string } | null;
  roomTypeLabel?: string | null;
  insurancePlanLabel?: string | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
};

type Category = "group_ticket" | "umrah" | "world_tour" | "insurance";

const STATUS_TABS_DEFAULT = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "issue_requested", label: "Issue Requested" },
  { value: "issued", label: "Issued" },
  { value: "cancelled", label: "Cancelled" },
];

// Group Tickets get one extra tab: a lapsed seat-hold is functionally
// different from a live pending one (nothing an agent can still do with
// it), so it's split out instead of quietly sitting inside "Pending".
const STATUS_TABS_GROUP_TICKET = [
  ...STATUS_TABS_DEFAULT.slice(0, 2),
  { value: "expired", label: "Expired" },
  ...STATUS_TABS_DEFAULT.slice(2),
];

function detailColumn(b: Booking, category: Category) {
  if (category === "group_ticket") {
    return b.groupFlight ? (
      <>
        <strong>{b.groupFlight.airline}</strong> {b.groupFlight.route}
        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          {b.groupFlight.flightNo ? `${b.groupFlight.flightNo} · ` : ""}{b.groupFlight.depDate ?? ""}
        </div>
      </>
    ) : "—";
  }
  if (category === "umrah" || category === "world_tour") {
    return b.package ? (
      <>
        <strong>{b.package.name}</strong>
        {b.roomTypeLabel && <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.roomTypeLabel}</div>}
      </>
    ) : "—";
  }
  if (category === "insurance") {
    return b.insurancePlanLabel ?? "—";
  }
  return "—";
}

function paxSummary(b: Booking) {
  const parts = [];
  if (b.adults) parts.push(`${b.adults}A`);
  if (b.children) parts.push(`${b.children}C`);
  if (b.infants) parts.push(`${b.infants}I`);
  return parts.length ? parts.join(" ") : "—";
}

export default function AgentBookingsByType({
  category, title, subtitle, detailLabel,
}: {
  category: Category;
  title: React.ReactNode;
  subtitle: string;
  detailLabel: string;
}) {
  const { accessToken, refresh } = useAgentAuth();
  const statusTabs = category === "group_ticket" ? STATUS_TABS_GROUP_TICKET : STATUS_TABS_DEFAULT;
  const [status, setStatus] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ category });
    if (status !== "all") params.set("status", status);
    try {
      const res = await agentFetch(`/api/agent/bookings?${params.toString()}`, accessToken, refresh);
      if (!res.ok) { setError("Could not load bookings."); return; }
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [category, status, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="ap-ph">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <Link href="/agent/new-booking" className="ap-btn ap-btn-gold">New Booking</Link>
      </div>

      <div className="ap-tab-bar" style={{ marginBottom: 12 }}>
        {statusTabs.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)} className={`ap-tab-btn ${status === t.value ? "active" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="ap-card">
        <div className="ap-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : error ? (
            <p className="etd" style={{ color: "var(--red)" }}>{error}</p>
          ) : bookings.length === 0 ? (
            <p className="etd">No bookings match these filters.</p>
          ) : (
            <table className="ap-table">
              <thead>
                <tr><th>Ref</th><th>{detailLabel}</th><th>Pax</th><th>Status</th><th>Commission</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const isLapsed = category === "group_ticket" && b.status === "pending" && b.expiresAt && new Date(b.expiresAt) < new Date();
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.bookingRef}</strong></td>
                      <td style={{ fontSize: 12.5 }}>{detailColumn(b, category)}</td>
                      <td>{paxSummary(b)}</td>
                      <td>
                        {isLapsed ? (
                          <span className="ap-pill" style={{ background: "#FEE2E2", color: "#B91C1C" }}>Expired</span>
                        ) : (
                          <span className={`ap-pill ap-p-${b.status}`}>{b.status.replace("_", " ")}</span>
                        )}
                      </td>
                      <td>PKR {b.commission.toLocaleString()}</td>
                      <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td>
                        {!isLapsed && (b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => setIssuingId(b.id)} className="ap-btn ap-btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }}>
                            Request Issuance
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {issuingId && (
        <AgentIssueRequestModal bookingId={issuingId} onClose={() => setIssuingId(null)} onDone={() => { setIssuingId(null); load(); }} />
      )}
    </>
  );
}
