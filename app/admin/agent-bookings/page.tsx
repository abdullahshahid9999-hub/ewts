"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type AgentBooking = {
  id: string;
  bookingRef: string;
  createdByStaffName?: string | null;
  serviceType: string;
  status: string;
  sellPrice: number;
  commission: number;
  customerName: string | null;
  customerPhone: string | null;
  travellers: { fullName: string; passportNo?: string; cnic?: string }[] | null;
  agent: { agentCode: string; fullName: string };
  package: { id: string; name: string; category: string } | null;
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
  const searchParams = useSearchParams();
  const packageId = searchParams.get("packageId");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [issueModal, setIssueModal] = useState<{ id: string; serviceType: string } | null>(null);
  const [issueTicket, setIssueTicket] = useState("");
  const [issueSupplierId, setIssueSupplierId] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (packageId) params.set("packageId", packageId);
    const res = await adminFetch(`/api/admin/agent-bookings?${params.toString()}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setBookings(data.agentBookings ?? []);
    setLoading(false);
  }, [category, status, packageId, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminFetch("/api/admin/suppliers", accessToken, refresh)
      .then(r => r.json()).then(d => setSuppliers(d.suppliers ?? [])).catch(() => {});
  }, [accessToken, refresh]);

  async function downloadReport() {
    const res = await adminFetch("/api/admin/agent-bookings/export", accessToken, refresh);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `agent-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function confirmIssue() {
    if (!issueModal) return;
    if (issueModal.serviceType === "group_ticket" && !issueTicket.trim()) { alert("Ticket number required."); return; }
    setIssuing(true);
    await adminFetch(`/api/admin/agent-bookings/${issueModal.id}`, accessToken, refresh, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "issued", ticketNumber: issueTicket.trim() || undefined, issueSupplierId: issueSupplierId || undefined, issueSupplierNote: issueNote.trim() || undefined }),
    });
    setIssuing(false); setIssueModal(null); setIssueTicket(""); setIssueSupplierId(""); setIssueNote("");
    load();
  }

  async function updateStatus(id: string, newStatus: string, serviceType?: string) {
    if (newStatus === "issued") { setIssueModal({ id, serviceType: serviceType ?? "" }); setIssueTicket(""); setIssueSupplierId(""); setIssueNote(""); return; }
    await adminFetch(`/api/admin/agent-bookings/${id}`, accessToken, refresh, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Agent <em>Bookings</em></h2><p>Review and issue bookings placed by agents</p></div>
        <button onClick={downloadReport} className="adp-btn adp-btn-g">⬇ Download Report (Excel)</button>
      </div>

      {packageId && bookings[0]?.package && (
        <div style={{ background: "var(--a-gold-bg, #fdf6e3)", border: "1px solid var(--a-gold, #d4a843)", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Showing bookings for <strong>{bookings[0].package.name}</strong> only</span>
          <a href="/admin/agent-bookings" style={{ fontWeight: 700 }}>Clear (show all)</a>
        </div>
      )}

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
                  <th>Ref</th><th>Agent</th><th>Booked By</th><th>Customer</th><th>Passengers</th><th>Service</th><th>Sell Price</th><th>Commission</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bookingRef}</strong></td>
                    <td>{b.agent.agentCode} — {b.agent.fullName}</td>
                    <td style={{ fontSize: 12, color: "var(--a-muted)" }}>{b.createdByStaffName ?? <span style={{ color: "#ccc" }}>Owner</span>}</td>
                    <td>
                      {b.customerName ?? <span style={{ color: "var(--a-dim)" }}>—</span>}
                      {b.customerPhone && <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{b.customerPhone}</div>}
                    </td>
                    <td style={{ fontSize: 11, maxWidth: 180 }}>
                      {b.travellers && b.travellers.length > 0
                        ? b.travellers.map((t) => t.fullName).join(", ")
                        : <span style={{ color: "var(--a-dim)" }}>—</span>}
                    </td>
                    <td className="capitalize">{b.serviceType.replace("_", " ")}</td>
                    <td>PKR {b.sellPrice.toLocaleString()}</td>
                    <td>PKR {b.commission.toLocaleString()}</td>
                    <td><span className={`adp-pill adp-p-${b.status}`}>{b.status.replace("_", " ")}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      {b.status === "issue_requested" && (
                        <button onClick={() => updateStatus(b.id, "issued", b.serviceType)} className="adp-btn adp-btn-s" style={{ color: "var(--a-green)" }}>Mark Issued</button>
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
      {issueModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--a-surface)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ margin: "0 0 6px", fontWeight: 700 }}>Issue Booking</h3>
            <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 20 }}>Select supplier and add reference notes before confirming.</p>
            {issueModal.serviceType === "group_ticket" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ticket Number *</label>
                <input value={issueTicket} onChange={e => setIssueTicket(e.target.value)} placeholder="e.g. 214-2121045-786" style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Supplier (optional)</label>
              <select value={issueSupplierId} onChange={e => setIssueSupplierId(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
                <option value="">— No Supplier / In-house —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reference / Note (optional)</label>
              <textarea value={issueNote} onChange={e => setIssueNote(e.target.value)} placeholder="e.g. PNR: ABC123, Supplier ref: SG-001..." rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={confirmIssue} disabled={issuing} className="adp-btn adp-btn-g" style={{ flex: 1 }}>{issuing ? "Issuing…" : "Confirm Issue ✓"}</button>
              <button onClick={() => setIssueModal(null)} className="adp-btn adp-btn-t">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminAgentBookingsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
          <AgentBookingsInner />
        </Suspense>
      </AdminShell>
    </AdminGuard>
  );
}
