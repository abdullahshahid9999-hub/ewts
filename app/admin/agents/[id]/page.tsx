"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type Agent = { id: string; agentCode: string; fullName: string; email: string; phone: string | null; balance: number; creditLimit: number; tier: string; status: string };
type Tx = { id: string; amount: number; type: string; note: string | null; createdAt: string };
type Booking = { id: string; bookingRef: string; serviceType: string; sellPrice: number; commission: number; status: string; createdAt: string; groupFlight: { airline: string; route: string } | null };
type Slip = { id: string; amount: number; status: string; note: string | null; slipImageUrl: string | null; createdAt: string };
type Summary = { totalSell: number; totalCommission: number; totalNetPayable: number; totalCredited: number; totalDebited: number; balance: number; outstanding: number };

function pkr(n: number) { return `PKR ${Math.abs(n).toLocaleString()}`; }

function AgentLedgerInner() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, refresh } = useAdminAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [tab, setTab] = useState<"ledger" | "bookings" | "slips">("ledger");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch(`/api/admin/agents/${id}/ledger`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setAgent(data.agent ?? null);
    setSummary(data.summary ?? null);
    setTxs(data.transactions ?? []);
    setBookings(data.bookings ?? []);
    setSlips(data.paymentSlips ?? []);
    setLoading(false);
  }, [id, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p style={{ padding: 40, color: "var(--a-muted)", fontSize: 13 }}>Loading…</p>;
  if (!agent || !summary) return <p style={{ padding: 40, color: "var(--a-muted)", fontSize: 13 }}>Agent not found.</p>;

  const tabs = [
    { value: "ledger", label: "💳 Transaction Ledger" },
    { value: "bookings", label: "📋 Booking Breakdown" },
    { value: "slips", label: "🧾 Payment Slips" },
  ] as const;

  return (
    <>
      <div className="adp-ph">
        <div>
          <Link href="/admin/agents" style={{ fontSize: 12, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>← Back to Agents</Link>
          <h2>{agent.fullName} <em>Ledger</em></h2>
          <p>{agent.agentCode} · {agent.email} · {agent.tier} tier</p>
        </div>
        <div style={{
          background: summary.outstanding > 0 ? "#FEF2F2" : "#ECFDF5",
          border: `1px solid ${summary.outstanding > 0 ? "#FECACA" : "#A7F3D0"}`,
          borderRadius: 10, padding: "12px 18px", textAlign: "center"
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--a-muted)", marginBottom: 4 }}>
            {summary.outstanding > 0 ? "Amount Owed to E&W" : "Account Status"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: summary.outstanding > 0 ? "#DC2626" : "#059669" }}>
            {summary.outstanding > 0 ? pkr(summary.outstanding) : "Settled ✓"}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Account Balance", val: `${agent.balance < 0 ? "-" : ""}${pkr(agent.balance)}`, color: agent.balance < 0 ? "#DC2626" : "#059669" },
          { label: "Credit Limit", val: pkr(agent.creditLimit), color: "var(--a-text)" },
          { label: "Total Sales (Issued)", val: pkr(summary.totalSell), color: "var(--a-text)" },
          { label: "Total Commission", val: pkr(summary.totalCommission), color: "#D97706" },
          { label: "Net Payable", val: pkr(summary.totalNetPayable), color: "var(--a-text)" },
          { label: "Total Credited (Topups)", val: pkr(summary.totalCredited), color: "#059669" },
        ].map(c => (
          <div key={c.label} className="adp-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--a-muted)", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} className="adp-btn"
            style={{ padding: "6px 14px", fontSize: 12,
              background: tab === t.value ? "var(--a-gold)" : "none",
              color: tab === t.value ? "#000" : "var(--a-muted)",
              border: tab === t.value ? "none" : "1px solid var(--a-border2)",
              fontWeight: tab === t.value ? 700 : 500 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ledger" && (
        <div className="adp-card">
          <div className="adp-ch"><h3>Transaction Ledger</h3><p>Every debit (booking issued) and credit (topup) — running balance shown</p></div>
          <div className="adp-tw">
            {txs.length === 0 ? <p className="etd">No transactions yet.</p> : (
              <table className="adp-table">
                <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Running Balance</th><th>Note</th></tr></thead>
                <tbody>
                  {(() => {
                    let running = agent.balance;
                    return txs.map(tx => {
                      const row = { ...tx, runningBalance: running };
                      running = tx.type === "debit"
                        ? running + Math.abs(tx.amount)
                        : running - Math.abs(tx.amount);
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                            {new Date(tx.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                            <br /><span style={{ color: "var(--a-muted)" }}>{new Date(tx.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</span>
                          </td>
                          <td>
                            <span className={`adp-pill ${tx.type === "credit" ? "adp-p-confirmed" : "adp-p-cancelled"}`}>
                              {tx.type === "credit" ? "↑ Credit" : "↓ Debit"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: tx.type === "credit" ? "#059669" : "#DC2626" }}>
                            {tx.type === "credit" ? "+" : "-"}{pkr(tx.amount)}
                          </td>
                          <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: row.runningBalance < 0 ? "#DC2626" : "#059669" }}>
                            {row.runningBalance < 0 ? "-" : ""}{pkr(row.runningBalance)}
                          </td>
                          <td style={{ fontSize: 11, color: "var(--a-muted)" }}>{tx.note ?? "—"}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="adp-card">
          <div className="adp-ch"><h3>Booking Breakdown</h3><p>Sell price → commission deducted → net payable to E&W per booking</p></div>
          <div className="adp-tw">
            {bookings.length === 0 ? <p className="etd">No bookings yet.</p> : (
              <table className="adp-table">
                <thead><tr><th>Ref</th><th>Service</th><th>Sell Price</th><th>Commission (Agent Keeps)</th><th>Net to E&W</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{b.bookingRef}</td>
                      <td>
                        <div style={{ fontSize: 12, textTransform: "capitalize" }}>{b.serviceType.replace("_", " ")}</div>
                        {b.groupFlight && <div style={{ fontSize: 10, color: "var(--a-muted)" }}>{b.groupFlight.airline} · {b.groupFlight.route}</div>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{pkr(b.sellPrice)}</td>
                      <td style={{ color: "#D97706", fontWeight: 600 }}>
                        {pkr(b.commission)}
                        {b.sellPrice > 0 && <span style={{ fontSize: 10, color: "var(--a-muted)", marginLeft: 4 }}>({Math.round(b.commission / b.sellPrice * 100)}%)</span>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{pkr(b.sellPrice - b.commission)}</td>
                      <td><span className={`adp-pill adp-p-${b.status}`}>{b.status}</span></td>
                      <td style={{ fontSize: 11, color: "var(--a-muted)", whiteSpace: "nowrap" }}>
                        {new Date(b.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "var(--a-surface)", fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: "10px 14px", fontSize: 12 }}>Issued bookings total</td>
                    <td style={{ padding: "10px 14px" }}>{pkr(summary.totalSell)}</td>
                    <td style={{ padding: "10px 14px", color: "#D97706" }}>{pkr(summary.totalCommission)}</td>
                    <td style={{ padding: "10px 14px" }}>{pkr(summary.totalNetPayable)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "slips" && (
        <div className="adp-card">
          <div className="adp-ch"><h3>Payment Slips</h3><p>All topup submissions from this agent</p></div>
          <div className="adp-tw">
            {slips.length === 0 ? <p className="etd">No payment slips yet.</p> : (
              <table className="adp-table">
                <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Note</th><th>Slip</th></tr></thead>
                <tbody>
                  {slips.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontSize: 11 }}>{new Date(s.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td style={{ fontWeight: 700 }}>{pkr(s.amount)}</td>
                      <td><span className={`adp-pill adp-p-${s.status === "approved" ? "confirmed" : s.status === "rejected" ? "cancelled" : "pending"}`}>{s.status}</span></td>
                      <td style={{ fontSize: 11, color: "var(--a-muted)" }}>{s.note ?? "—"}</td>
                      <td>{s.slipImageUrl ? <a href={s.slipImageUrl} target="_blank" rel="noreferrer" style={{ color: "var(--a-gold)", fontSize: 12, fontWeight: 600 }}>📎 View</a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminAgentLedgerPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AgentLedgerInner />
      </AdminShell>
    </AdminGuard>
  );
}
