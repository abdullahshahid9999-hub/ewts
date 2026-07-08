"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
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
  return `PKR ${n.toLocaleString()}`;
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

  return (
    <>
      <div className="adp-ph"><div><h2>Finance <em>Overview</em></h2><p>Revenue, commission, and agent balances</p></div></div>

      {loading ? (
        <p className="etd">Loading finance data…</p>
      ) : (
        <>
          <div className="adp-sg" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="adp-sc">
              <div className="adp-sc-n">{pkr(totals.totalRevenue)}</div>
              <div className="adp-sc-l">Total Revenue (sell price)</div>
            </div>
            <div className="adp-sc">
              <div className="adp-sc-n" style={{ color: "var(--a-gold)" }}>{pkr(totals.totalCommission)}</div>
              <div className="adp-sc-l">Total Commission Paid Out</div>
            </div>
          </div>

          <div className="adp-card">
            <div className="adp-ch"><h3>Service-wise Breakdown</h3></div>
            <div className="adp-tw">
              <table className="adp-table">
                <thead><tr><th>Service</th><th>Bookings</th><th>Revenue</th><th>Commission</th></tr></thead>
                <tbody>
                  {serviceBreakdown.length === 0 && (
                    <tr><td colSpan={4} className="etd" style={{ textAlign: "center" }}>No confirmed bookings yet.</td></tr>
                  )}
                  {serviceBreakdown.map((s) => (
                    <tr key={s.serviceType}>
                      <td><strong>{SERVICE_LABELS[s.serviceType] ?? s.serviceType}</strong></td>
                      <td>{s.bookingCount}</td>
                      <td>{pkr(s.totalSellPrice)}</td>
                      <td style={{ color: "var(--a-gold)" }}>{pkr(s.totalCommission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="adp-card">
            <div className="adp-ch"><h3>Agent Balances &amp; Outstanding</h3></div>
            <div className="adp-tw">
              <table className="adp-table">
                <thead><tr><th>Agent</th><th>Tier</th><th>Balance</th><th>Credit Limit</th><th>Outstanding</th><th>Status</th></tr></thead>
                <tbody>
                  {agentBalances.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.fullName}</strong> <span style={{ color: "var(--a-muted)", fontSize: "11px" }}>({a.agentCode})</span></td>
                      <td className="capitalize">{a.tier}</td>
                      <td style={{ color: a.balance < 0 ? "var(--a-red)" : undefined }}>{pkr(a.balance)}</td>
                      <td>{pkr(a.creditLimit)}</td>
                      <td>{a.outstanding > 0 ? <span style={{ color: "var(--a-red)", fontWeight: 600 }}>{pkr(a.outstanding)}</span> : "—"}</td>
                      <td><span className={`adp-pill adp-p-${a.status}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function AdminFinancePage() {
  return (
    <AdminGuard>
      <AdminShell>
        <FinanceInner />
      </AdminShell>
    </AdminGuard>
  );
}
