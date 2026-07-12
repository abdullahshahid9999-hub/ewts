"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type DirectBooking = {
  id: string;
  bookingRef: string;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  roomTypeLabel: string | null;
  travelClass: string | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
  seatsRequested: number | null;
  totalPricePkr: number | null;
  specialRequests: string | null;
  status: string;
  createdAt: string;
  package: { name: string; category: string; slug: string | null } | null;
  groupFlight: { airline: string; route: string; flightNo: string | null; depDate: string | null } | null;
};

const CATEGORIES = [
  { value: "", label: "All (Umrah + Tours + Flights)" },
  { value: "umrah", label: "Umrah" },
  { value: "tours", label: "World Tours" },
  { value: "group_ticket", label: "Group Flights" },
];
const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

function pkr(n: number | null) {
  return n == null ? "—" : `PKR ${n.toLocaleString()}`;
}

function DirectBookingsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState<DirectBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    const res = await adminFetch(`/api/admin/direct-bookings?${params.toString()}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setBookings(data.bookings ?? []);
    setLoading(false);
  }, [category, status, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, newStatus: string) {
    await adminFetch(`/api/admin/direct-bookings/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  async function exportToExcel() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    const res = await adminFetch(`/api/admin/direct-bookings/export?${params.toString()}`, accessToken, refresh);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `direct-bookings-${category || "all"}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="adp-ph">
        <div>
          <h2>Direct <em>Bookings</em></h2>
          <p>Walk-in / website customer bookings for Umrah, World Tour packages &amp; group flights — no agent involved</p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="adp-ss">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="adp-ss">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <button onClick={exportToExcel} className="adp-btn adp-btn-s">⬇ Export to Excel</button>
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : bookings.length === 0 ? (
            <p className="etd">No direct bookings match these filters.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr>
                  <th>Ref</th><th>Customer</th><th>Package</th><th>Room / Pax</th><th>Total</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <>
                    <tr key={b.id}>
                      <td><strong>{b.bookingRef}</strong></td>
                      <td>{b.customerName ?? "—"}</td>
                      <td>
                        {b.package?.name ?? (b.groupFlight ? `${b.groupFlight.airline} — ${b.groupFlight.route}` : "—")}
                        {b.package?.category && (
                          <span className="adp-pill" style={{ marginLeft: "6px" }}>
                            {b.package.category === "umrah" ? "Umrah" : "World Tour"}
                          </span>
                        )}
                        {b.groupFlight && (
                          <span className="adp-pill" style={{ marginLeft: "6px" }}>Group Flight</span>
                        )}
                      </td>
                      <td>
                        {b.roomTypeLabel ?? b.travelClass ?? "—"}
                        <div style={{ fontSize: "12px", opacity: 0.7 }}>
                          {b.groupFlight
                            ? `${b.seatsRequested ?? 1} seat(s)`
                            : `${b.adults ?? 0}A / ${b.children ?? 0}C / ${b.infants ?? 0}I`}
                        </div>
                      </td>
                      <td>{pkr(b.totalPricePkr)}</td>
                      <td><span className={`adp-pill adp-p-${b.status}`}>{b.status}</span></td>
                      <td style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                          className="adp-btn adp-btn-t"
                        >
                          {expanded === b.id ? "Hide" : "Details"}
                        </button>
                        {b.status === "pending" && (
                          <button onClick={() => updateStatus(b.id, "confirmed")} className="adp-btn adp-btn-s" style={{ color: "var(--a-green)" }}>Confirm</button>
                        )}
                        {b.status !== "cancelled" && (
                          <button onClick={() => updateStatus(b.id, "cancelled")} className="adp-btn adp-btn-r">Cancel</button>
                        )}
                      </td>
                    </tr>
                    {expanded === b.id && (
                      <tr key={`${b.id}-details`}>
                        <td colSpan={7} style={{ background: "rgba(255,255,255,0.03)", padding: "12px 16px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "8px", fontSize: "13px" }}>
                            <div><strong>Phone:</strong> {b.phone ?? "—"}</div>
                            <div><strong>Email:</strong> {b.email ?? "—"}</div>
                            <div><strong>Booked:</strong> {new Date(b.createdAt).toLocaleString()}</div>
                            {b.specialRequests && (
                              <div style={{ gridColumn: "1 / -1" }}><strong>Special Requests:</strong> {b.specialRequests}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminDirectBookingsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <DirectBookingsInner />
      </AdminShell>
    </AdminGuard>
  );
}
