"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type PaymentSlip = {
  id: string;
  amount: number;
  slipImageUrl: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  agent: { agentCode: string; fullName: string };
};

function PaymentSlipsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [slips, setSlips] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Reject modal state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/payment-slips", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSlips(data.paymentSlips ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    if (!confirm("Approve this slip? This will credit the agent's balance immediately.")) return;
    setActing(true);
    setError(null);
    const res = await adminFetch(`/api/admin/payment-slips/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    const data = await res.json().catch(() => ({}));
    setActing(false);
    if (!res.ok) { setError(data.error ?? "Could not approve."); return; }
    load();
  }

  async function reject() {
    if (!rejectId) return;
    setActing(true);
    setError(null);
    const res = await adminFetch(`/api/admin/payment-slips/${rejectId}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected", note: rejectNote.trim() || null }),
    });
    const data = await res.json().catch(() => ({}));
    setActing(false);
    if (!res.ok) { setError(data.error ?? "Could not reject."); return; }
    setRejectId(null);
    setRejectNote("");
    load();
  }

  const filtered = slips.filter((s) => filter === "all" || s.status === filter);
  const pendingCount = slips.filter((s) => s.status === "pending").length;

  const iStyle = { width: "100%", padding: "8px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical" as const };

  return (
    <>
      <div className="adp-ph">
        <div>
          <h2>Payment <em>Slips</em></h2>
          <p>Review agent balance topup requests</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#B45309" }}>
            ⚠️ {pendingCount} pending
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#DC2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {(["pending", "approved", "rejected", "all"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className="adp-btn"
            style={{
              padding: "6px 14px",
              fontSize: 12,
              textTransform: "capitalize",
              background: filter === v ? "var(--a-gold)" : "none",
              color: filter === v ? "#000" : "var(--a-muted)",
              border: filter === v ? "none" : "1px solid var(--a-border2)",
              fontWeight: filter === v ? 700 : 500,
            }}
          >
            {v}{v === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="etd">No {filter !== "all" ? filter : ""} payment slips.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr><th>Date</th><th>Agent</th><th>Amount</th><th>Slip</th><th>Status</th><th>Note</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>
                      {new Date(s.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      <br />
                      <span style={{ color: "var(--a-muted)" }}>{new Date(s.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 12 }}>{s.agent.agentCode}</div>
                      <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{s.agent.fullName}</div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: 14 }}>PKR {s.amount.toLocaleString()}</td>
                    <td>
                      {s.slipImageUrl ? (
                        <a href={s.slipImageUrl} target="_blank" rel="noreferrer"
                          style={{ color: "var(--a-gold)", fontWeight: 700, fontSize: 12 }}>
                          📎 View
                        </a>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`adp-pill adp-p-${s.status === "approved" ? "confirmed" : s.status === "rejected" ? "cancelled" : "pending"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--a-muted)", maxWidth: 200 }}>{s.note ?? "—"}</td>
                    <td>
                      {s.status === "pending" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => approve(s.id)}
                            disabled={acting}
                            className="adp-btn adp-btn-g adp-btn-s"
                            style={{ background: "var(--a-green)", color: "#fff", fontSize: 11 }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => { setRejectId(s.id); setRejectNote(""); setError(null); }}
                            disabled={acting}
                            className="adp-btn adp-btn-r adp-btn-s"
                            style={{ fontSize: 11 }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(7,17,32,.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1.5px solid var(--a-border)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Reject Payment Slip</h3>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: "var(--a-muted)", marginBottom: 14 }}>
                Optionally provide a reason — the agent will see this note in their history.
              </p>
              <textarea
                autoFocus
                rows={3}
                style={iStyle}
                placeholder="e.g. Slip image unclear, amount mismatch — please resubmit"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
              {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{error}</p>}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1.5px solid var(--a-border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setRejectId(null)} className="adp-btn adp-btn-s">Cancel</button>
              <button onClick={reject} disabled={acting} className="adp-btn adp-btn-r">
                {acting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminPaymentSlipsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <PaymentSlipsInner />
      </AdminShell>
    </AdminGuard>
  );
}
