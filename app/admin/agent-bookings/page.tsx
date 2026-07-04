"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
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
  { value: "", label: "All services" },
  { value: "umrah", label: "Umrah" },
  { value: "group_ticket", label: "Group Tickets" },
  { value: "insurance", label: "Insurance" },
];
const STATUSES = [
  { value: "", label: "All statuses" },
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Agent Bookings</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No bookings match these filters.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Ref</th><th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Service</th><th className="px-4 py-3">Sell Price</th>
                <th className="px-4 py-3">Commission</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3 font-medium">{b.bookingRef}</td>
                  <td className="px-4 py-3">{b.agent.agentCode} — {b.agent.fullName}</td>
                  <td className="px-4 py-3 capitalize">{b.serviceType.replace("_", " ")}</td>
                  <td className="px-4 py-3">PKR {b.sellPrice.toLocaleString()}</td>
                  <td className="px-4 py-3">PKR {b.commission.toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{b.status.replace("_", " ")}</td>
                  <td className="px-4 py-3 space-x-2">
                    {b.status === "issue_requested" && (
                      <button onClick={() => updateStatus(b.id, "issued")} className="text-green-700 underline">Mark Issued</button>
                    )}
                    {b.status !== "cancelled" && b.status !== "issued" && (
                      <button onClick={() => updateStatus(b.id, "cancelled")} className="text-red-700 underline">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminAgentBookingsPage() {
  return (
    <AdminGuard>
      <AgentBookingsInner />
    </AdminGuard>
  );
}
