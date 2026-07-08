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
  agent: { agentCode: string; fullName: string };
};

function PaymentSlipsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [slips, setSlips] = useState<PaymentSlip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/payment-slips", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSlips(data.paymentSlips ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function review(id: string, status: "approved" | "rejected") {
    if (status === "approved" && !confirm("Approve this slip? This will credit the agent's balance.")) return;
    await adminFetch(`/api/admin/payment-slips/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Payment <em>Slips</em></h2><p>Approve or reject agent balance top-ups</p></div></div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : slips.length === 0 ? (
            <p className="etd">No payment slips yet.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr><th>Agent</th><th>Amount</th><th>Slip</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {slips.map((s) => (
                  <tr key={s.id}>
                    <td>{s.agent.agentCode} — {s.agent.fullName}</td>
                    <td>PKR {s.amount.toLocaleString()}</td>
                    <td>
                      {s.slipImageUrl ? <a href={s.slipImageUrl} target="_blank" rel="noreferrer" style={{ color: "var(--a-gold)" }}>View</a> : "—"}
                    </td>
                    <td><span className={`adp-pill adp-p-${s.status}`}>{s.status}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      {s.status === "pending" && (
                        <>
                          <button onClick={() => review(s.id, "approved")} className="adp-btn adp-btn-s" style={{ color: "var(--a-green)" }}>Approve</button>
                          <button onClick={() => review(s.id, "rejected")} className="adp-btn adp-btn-r">Reject</button>
                        </>
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

export default function AdminPaymentSlipsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <PaymentSlipsInner />
      </AdminShell>
    </AdminGuard>
  );
}
