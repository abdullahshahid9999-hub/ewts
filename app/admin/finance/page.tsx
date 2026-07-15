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
  rangeBookingCount: number;
  rangeSellPrice: number;
  rangeCommission: number;
  rangeNet: number;
};

type ServiceBreakdown = {
  serviceType: string;
  totalSellPrice: number;
  totalCommission: number;
  bookingCount: number;
};

type Preset = "today" | "week" | "month" | "all";

const SERVICE_LABELS: Record<string, string> = {
  umrah: "Umrah",
  group_ticket: "Group Tickets",
  insurance: "Insurance",
};

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

function pkr(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Computes {from, to} (as yyyy-mm-dd strings, or nulls for "all") for a
// quick preset. Uses the browser's local time so "Today"/"This Week"
// match what the person looking at the screen means by those words.
function rangeForPreset(preset: Preset): { from: string | null; to: string | null } {
  const now = new Date();
  const todayStr = toDateInputValue(now);

  if (preset === "today") return { from: todayStr, to: todayStr };

  if (preset === "week") {
    const day = now.getDay(); // 0 = Sunday
    const mondayOffset = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    return { from: toDateInputValue(monday), to: todayStr };
  }

  if (preset === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateInputValue(first), to: todayStr };
  }

  return { from: null, to: null };
}

function FinanceInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [agentBalances, setAgentBalances] = useState<AgentBalance[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [totals, setTotals] = useState({ totalRevenue: 0, totalCommission: 0, totalReceivable: 0 });
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    const res = await adminFetch(`/api/admin/finance${qs ? `?${qs}` : ""}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setAgentBalances(data.agentBalances ?? []);
    setServiceBreakdown(data.serviceBreakdown ?? []);
    setTotals(data.totals ?? { totalRevenue: 0, totalCommission: 0, totalReceivable: 0 });
    setLoading(false);
  }, [accessToken, refresh, from, to]);

  useEffect(() => { load(); }, [load]);

  function applyPreset(p: Preset) {
    setPreset(p);
    const r = rangeForPreset(p);
    setFrom(r.from);
    setTo(r.to);
  }

  const rangeLabel = preset === "all" && !from && !to
    ? "all-time"
    : `${from ?? "…"} → ${to ?? "…"}`;

  return (
    <>
      <div className="adp-ph"><div><h2>Finance <em>Overview</em></h2><p>Revenue, commission, and agent balances</p></div></div>

      {/* Total Receivable headline — always the current, real-time figure.
          balance is a cumulative running total (see route comment), so this
          number does not change with the date filter below; it answers
          "how much are we owed right now", which is what the owner asked
          this figure to answer. */}
      <div className="adp-card" style={{ background: "var(--a-gold-bg)", border: "1px solid var(--a-gold-bd)", marginBottom: "16px" }}>
        <div style={{ padding: "20px 22px", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--a-gold)" }}>
              Total Receivable — Right Now
            </div>
            <div style={{ fontSize: "38px", fontWeight: 800, color: "var(--a-text)", letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "6px" }}>
              {loading ? "…" : pkr(totals.totalReceivable)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--a-muted)", marginTop: "6px" }}>
              Sum of outstanding balances across all agents currently owing money. Not affected by the date filter below.
            </div>
          </div>
        </div>
      </div>

      {/* Date-range filter — scopes service breakdown + per-agent booking
          activity tables below (not the headline above). */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => applyPreset(p.value)}
            className="adp-btn"
            style={{
              padding: "6px 12px",
              fontSize: "11.5px",
              background: preset === p.value ? "var(--a-gold)" : "none",
              color: preset === p.value ? "#000" : "var(--a-muted)",
              border: "1px solid var(--a-border2)",
              fontWeight: preset === p.value ? 700 : 500,
            }}
          >
            {p.label}
          </button>
        ))}
        <span style={{ width: "1px", height: "18px", background: "var(--a-border2)", margin: "0 2px" }} />
        <input
          type="date"
          value={from ?? ""}
          onChange={(e) => { setPreset("all"); setFrom(e.target.value || null); }}
          className="adp-si"
          style={{ padding: "6px 8px", fontSize: "11.5px" }}
        />
        <span style={{ color: "var(--a-muted)", fontSize: "11px" }}>to</span>
        <input
          type="date"
          value={to ?? ""}
          onChange={(e) => { setPreset("all"); setTo(e.target.value || null); }}
          className="adp-si"
          style={{ padding: "6px 8px", fontSize: "11.5px" }}
        />
        <span style={{ fontSize: "11px", color: "var(--a-muted)", marginLeft: "4px" }}>Showing: {rangeLabel}</span>
      </div>

      {loading ? (
        <p className="etd">Loading finance data…</p>
      ) : (
        <>
          <div className="adp-sg" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="adp-sc">
              <div className="adp-sc-n">{pkr(totals.totalRevenue)}</div>
              <div className="adp-sc-l">Revenue (sell price) — {rangeLabel}</div>
            </div>
            <div className="adp-sc">
              <div className="adp-sc-n" style={{ color: "var(--a-gold)" }}>{pkr(totals.totalCommission)}</div>
              <div className="adp-sc-l">Commission Paid Out — {rangeLabel}</div>
            </div>
          </div>

          <div className="adp-card">
            <div className="adp-ch"><h3>Service-wise Breakdown</h3></div>
            <div className="adp-tw">
              <table className="adp-table">
                <thead><tr><th>Service</th><th>Bookings</th><th>Revenue</th><th>Commission</th></tr></thead>
                <tbody>
                  {serviceBreakdown.length === 0 && (
                    <tr><td colSpan={4} className="etd" style={{ textAlign: "center" }}>No confirmed bookings in this range.</td></tr>
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
            <div className="adp-ch">
              <h3>Agent Balances &amp; Outstanding</h3>
              <p style={{ margin: 0 }}>Balance/Outstanding are current (right now). Booked/Net in Range reflect the selected date filter.</p>
            </div>
            <div className="adp-tw">
              <table className="adp-table">
                <thead>
                  <tr>
                    <th>Agent</th><th>Tier</th><th>Balance</th><th>Credit Limit</th><th>Outstanding</th>
                    <th>Booked in Range</th><th>Net in Range</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {agentBalances.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.fullName}</strong> <span style={{ color: "var(--a-muted)", fontSize: "11px" }}>({a.agentCode})</span></td>
                      <td className="capitalize">{a.tier}</td>
                      <td style={{ color: a.balance < 0 ? "var(--a-red)" : undefined }}>{pkr(a.balance)}</td>
                      <td>{pkr(a.creditLimit)}</td>
                      <td>{a.outstanding > 0 ? <span style={{ color: "var(--a-red)", fontWeight: 600 }}>{pkr(a.outstanding)}</span> : "—"}</td>
                      <td>{a.rangeBookingCount} / {pkr(a.rangeSellPrice)}</td>
                      <td>{pkr(a.rangeNet)}</td>
                      <td><span className={`adp-pill adp-p-${a.status}`}>{a.status}</span></td>
                      <td><a href={`/admin/agents/${a.id}`} className="adp-btn adp-btn-s" style={{ textDecoration: "none", fontSize: 11 }}>💰 Ledger</a></td>
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
