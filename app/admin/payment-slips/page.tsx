"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Payment Slips</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : slips.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No payment slips yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Agent</th><th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Slip</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {slips.map((s) => (
                <tr key={s.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3">{s.agent.agentCode} — {s.agent.fullName}</td>
                  <td className="px-4 py-3">PKR {s.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {s.slipImageUrl ? <a href={s.slipImageUrl} target="_blank" rel="noreferrer" className="text-[var(--navy)] underline">View</a> : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{s.status}</td>
                  <td className="px-4 py-3 space-x-2">
                    {s.status === "pending" && (
                      <>
                        <button onClick={() => review(s.id, "approved")} className="text-green-700 underline">Approve</button>
                        <button onClick={() => review(s.id, "rejected")} className="text-red-700 underline">Reject</button>
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
  );
}

export default function AdminPaymentSlipsPage() {
  return (
    <AdminGuard>
      <PaymentSlipsInner />
    </AdminGuard>
  );
}
