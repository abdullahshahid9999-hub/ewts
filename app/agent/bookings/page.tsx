"use client";

import { useEffect, useState, useCallback } from "react";
import AgentGuard from "@/components/AgentGuard";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

const CATEGORIES = [
  { value: "all", label: "All services" },
  { value: "umrah", label: "Umrah" },
  { value: "group_ticket", label: "Group Tickets" },
  { value: "insurance", label: "Insurance" },
];

const STATUSES = [
  { value: "all", label: "All statuses" },
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
  expiresAt: string | null;
};

function BookingsInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Single combined query string — both filters are applied together by
    // the API's one where-clause, not two independent calls that could
    // silently clobber each other.
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (status !== "all") params.set("status", status);

    try {
      const res = await agentFetch(`/api/agent/bookings?${params.toString()}`, accessToken, refresh);
      if (!res.ok) {
        setError("Could not load bookings.");
        return;
      }
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [category, status, accessToken, refresh]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">My Bookings</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-700">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No bookings match these filters.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3 font-medium">{b.bookingRef}</td>
                  <td className="px-4 py-3 capitalize">{b.serviceType.replace("_", " ")}</td>
                  <td className="px-4 py-3 capitalize">{b.status.replace("_", " ")}</td>
                  <td className="px-4 py-3">PKR {b.commission.toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AgentBookingsPage() {
  return (
    <AgentGuard>
      <BookingsInner />
    </AgentGuard>
  );
}
