"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type AgentBalance = {
  id: string;
  agentCode: string;
  fullName: string;
  balance: number;
  creditLimit: number;
  tier: string;
  status: string;
  outstanding: number;
};

type ServiceBreakdown = {
  serviceType: string;
  totalSellPrice: number;
  totalCommission: number;
  bookingCount: number;
};

const SERVICE_LABELS: Record<string, string> = {
  umrah: "Umrah",
  group_ticket: "Group Tickets",
  insurance: "Insurance",
};

function pkr(n: number) {
  return `Rs. ${n.toLocaleString()}`;
}

function FinanceInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [agentBalances, setAgentBalances] = useState<AgentBalance[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [totals, setTotals] = useState({ totalRevenue: 0, totalCommission: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/finance", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setAgentBalances(data.agentBalances ?? []);
    setServiceBreakdown(data.serviceBreakdown ?? []);
    setTotals(data.totals ?? { totalRevenue: 0, totalCommission: 0 });
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="p-8 text-muted">Loading finance data…</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10">
      <h1 className="font-display text-3xl font-semibold">
        Finance <span className="italic text-gold">Overview</span>
      </h1>

      {/* TOTALS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted mb-1">Total Revenue (sell price)</div>
          <div className="font-display text-2xl font-semibold">{pkr(totals.totalRevenue)}</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted mb-1">Total Commission Paid Out</div>
          <div className="font-display text-2xl font-semibold text-gold">{pkr(totals.totalCommission)}</div>
        </div>
      </div>

      {/* SERVICE-WISE BREAKDOWN */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Service-wise Breakdown</h2>
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Commission</th>
              </tr>
            </thead>
            <tbody>
              {serviceBreakdown.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">No confirmed bookings yet.</td></tr>
              )}
              {serviceBreakdown.map((s) => (
                <tr key={s.serviceType} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{SERVICE_LABELS[s.serviceType] ?? s.serviceType}</td>
                  <td className="px-4 py-3">{s.bookingCount}</td>
                  <td className="px-4 py-3">{pkr(s.totalSellPrice)}</td>
                  <td className="px-4 py-3 text-gold">{pkr(s.totalCommission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AGENT-WISE BALANCE / OUTSTANDING */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Agent Balances &amp; Outstanding</h2>
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Credit Limit</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {agentBalances.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    {a.fullName} <span className="text-muted text-xs">({a.agentCode})</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{a.tier}</td>
                  <td className={`px-4 py-3 ${a.balance < 0 ? "text-red-600" : ""}`}>{pkr(a.balance)}</td>
                  <td className="px-4 py-3">{pkr(a.creditLimit)}</td>
                  <td className="px-4 py-3 font-semibold">
                    {a.outstanding > 0 ? <span className="text-red-600">{pkr(a.outstanding)}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function FinancePage() {
  return (
    <AdminGuard>
      <FinanceInner />
    </AdminGuard>
  );
}
