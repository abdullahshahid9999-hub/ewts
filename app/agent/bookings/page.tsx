"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentIssueRequestModal from "@/components/AgentIssueRequestModal";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

const CATEGORIES = [
  { value: "all", label: "All Services" },
  { value: "umrah", label: "Umrah" },
  { value: "group_ticket", label: "Group Tickets" },
  { value: "insurance", label: "Insurance" },
  { value: "world_tour", label: "World Tour" },
];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "issue_requested", label: "Issue Requested" },
  { value: "issued", label: "Issued" },
  { value: "cancelled", label: "Cancelled" },
];

type Booking = {
  id: string;
  bookingRef: string;
  serviceType: string;
  status: string;
  commission: number;
  createdAt: string;
};

function BookingsInner() {
  const { accessToken, refresh } = useAgentAuth();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("service") ?? "all";
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Single combined query — category + status applied together in one
    // where-clause on the API side, not two calls that could clobber
    // each other.
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
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
        <div>
          <h2>My <span>Bookings</span></h2>
          <p>All your booking history</p>
        </div>
        <Link href="/agent/new-booking" className="ap-btn ap-btn-gold">New Booking</Link>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div className="ap-tab-bar" style={{ marginBottom: 0, flex: 1 }}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={`ap-tab-btn ${status === t.value ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="ap-field" style={{ padding: "7px 10px", border: "1.5px solid var(--bdr)", borderRadius: "8px", fontSize: "12px" }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
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
                <tr>
                  <th>Ref</th><th>Service</th><th>Status</th><th>Commission</th><th>Created</th><th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bookingRef}</strong></td>
                    <td className="capitalize">{b.serviceType.replace("_", " ")}</td>
                    <td><span className={`ap-pill ap-p-${b.status}`}>{b.status.replace("_", " ")}</span></td>
                    <td>PKR {b.commission.toLocaleString()}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <button onClick={() => setIssuingId(b.id)} className="ap-btn ap-btn-ghost" style={{ padding: "5px 10px", fontSize: "11px" }}>
                          Request Issuance
                        </button>
                      )}
                      {b.serviceType === "group_ticket" && (
                        <Link href={`/agent/bookings/${b.id}/print`} className="ap-btn ap-btn-ghost" style={{ padding: "5px 10px", fontSize: "11px" }}>
                          Print Ticket
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {issuingId && (
        <AgentIssueRequestModal
          bookingId={issuingId}
          onClose={() => setIssuingId(null)}
          onDone={() => { setIssuingId(null); load(); }}
        />
      )}
    </>
  );
}

export default function AgentBookingsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <Suspense fallback={<div style={{ padding: 40, color: "var(--muted)", fontSize: 13 }}>Loading…</div>}>
          <BookingsInner />
        </Suspense>
      </AgentShell>
    </AgentGuard>
  );
}
