"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type AgentBooking = {
  id: string;
  bookingRef: string;
  serviceType: string;
  status: string;
  sellPrice: number;
  commission: number;
  agent: { agentCode: string; fullName: string };
};

const CATEGORIES = [
  { value: "", label: "All Services" },
  { value: "umrah", label: "Umrah" },
  { value: "group_ticket", label: "Group Tickets" },
  { value: "insurance", label: "Insurance" },
];
const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "issue_requested", label: "Issue Requested" },
  { value: "issued", label: "Issued" },
  { value: "cancelled", label: "Cancelled" },
];

function AgentBookingsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    const res = await adminFetch(`/api/admin/agent-bookings?${params.toString()}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setBookings(data.agentBookings ?? []);
    setLoading(false);
  }, [category, status, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    await adminFetch(`/api/admin/agent-bookings/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Agent <em>Bookings</em></h2><p>Review and issue bookings placed by agents</p></div></div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="adp-ss">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="adp-ss">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : bookings.length === 0 ? (
            <p className="etd">No bookings match these filters.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr>
                  <th>Ref</th><th>Agent</th><th>Service</th><th>Sell Price</th><th>Commission</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bookingRef}</strong></td>
                    <td>{b.agent.agentCode} — {b.agent.fullName}</td>
                    <td className="capitalize">{b.serviceType.replace("_", " ")}</td>
                    <td>PKR {b.sellPrice.toLocaleString()}</td>
                    <td>PKR {b.commission.toLocaleString()}</td>
                    <td><span className={`adp-pill adp-p-${b.status}`}>{b.status.replace("_", " ")}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      {b.status === "issue_requested" && (
                        <button onClick={() => updateStatus(b.id, "issued")} className="adp-btn adp-btn-s" style={{ color: "var(--a-green)" }}>Mark Issued</button>
                      )}
                      {b.status !== "cancelled" && b.status !== "issued" && (
                        <button onClick={() => updateStatus(b.id, "cancelled")} className="adp-btn adp-btn-r">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminAgentBookingsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AgentBookingsInner />
      </AdminShell>
    </AdminGuard>
  );
}
