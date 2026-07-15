"use client";

import { useEffect, useState, useCallback } from "react";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Tx = {
  id: string;
  amount: number;
  type: "debit" | "credit";
  note: string | null;
  createdAt: string;
};

type Booking = {
  id: string;
  bookingRef: string;
  serviceType: string;
  sellPrice: number;
  commission: number;
  status: string;
  createdAt: string;
  groupFlight: { airline: string; route: string } | null;
};

function pkr(n: number) { return `PKR ${Math.abs(n).toLocaleString()}`; }

function FinanceInner() {
  const { agent, accessToken, refresh } = useAgentAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"ledger" | "bookings">("ledger");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [txRes, bkRes] = await Promise.all([
      agentFetch("/api/agent/transactions", accessToken, refresh),
      agentFetch("/api/agent/bookings", accessToken, refresh),
    ]);
    const txData = await txRes.json().catch(() => ({}));
    const bkData = await bkRes.json().catch(() => ({}));
    setTxs(txData.transactions ?? []);
    setBookings(bkData.bookings ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  const totalDebited = txs.filter(t => t.type === "debit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredited = txs.filter(t => t.type === "credit").reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = agent?.balance ?? 0;
  const outstanding = balance < 0 ? -balance : 0;

  const totalSell = bookings.reduce((s, b) => s + b.sellPrice, 0);
  const totalComm = bookings.reduce((s, b) => s + b.commission, 0);

  return (
    <div>
      <div className="ap-ph">
        <div>
          <h2>💰 Finance &amp; <span>Ledger</span></h2>
          <p>Your account balance, commission history, and transaction log</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        <SCard label="Account Balance" value={pkr(balance)} sub={balance < 0 ? "Amount owed to E&W" : "Credit available"} accent={balance < 0 ? "var(--red)" : "var(--green)"} />
        <SCard label="Outstanding" value={pkr(outstanding)} sub="Unpaid to East & West" accent={outstanding > 0 ? "var(--red)" : "var(--muted)"} />
        <SCard label="Credit Limit" value={pkr(agent?.creditLimit ?? 0)} sub="Max credit extended" />
        <SCard label="Total Sales" value={pkr(totalSell)} sub="All-time sell price" />
        <SCard label="Total Commission" value={pkr(totalComm)} sub="Your earnings (deducted)" accent="var(--gold)" />
        <SCard label="Net Payable" value={pkr(totalSell - totalComm)} sub="After commission" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["ledger", "bookings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="ap-btn"
            style={{ padding: "6px 16px", fontSize: 12, textTransform: "capitalize",
              background: tab === t ? "var(--gold)" : "none",
              color: tab === t ? "#000" : "var(--muted)",
              border: tab === t ? "none" : "1px solid var(--bdr)",
              fontWeight: tab === t ? 700 : 500 }}>
            {t === "ledger" ? "💳 Transaction Ledger" : "📋 Booking Breakdown"}
          </button>
        ))}
      </div>

      {tab === "ledger" && (
        <div className="ap-card">
          <div className="ap-ch"><h3>Transaction Ledger</h3><p>Every debit and credit on your account</p></div>
          <div className="ap-tw">
            {loading ? <p className="etd">Loading…</p> : txs.length === 0 ? <p className="etd">No transactions yet.</p> : (
              <table className="ap-table">
                <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Running Balance</th><th>Note</th></tr></thead>
                <tbody>
                  {(() => {
                    // Compute running balance from oldest to newest, display newest first
                    let running = balance;
                    const rows = txs.map(tx => {
                      const row = { ...tx, runningBalance: running };
                      // Reverse the transaction to get previous balance
                      running = tx.type === "debit"
                        ? running + Math.abs(tx.amount)
                        : running - Math.abs(tx.amount);
                      return row;
                    });
                    return rows.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                          {new Date(tx.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                          <br /><span style={{ color: "var(--muted)" }}>{new Date(tx.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td>
                          <span className="ap-pill" style={{
                            background: tx.type === "credit" ? "var(--green-bg)" : "var(--red-bg)",
                            color: tx.type === "credit" ? "var(--green)" : "var(--red)",
                            border: `1px solid ${tx.type === "credit" ? "var(--green-bd)" : "var(--red-bd)"}`,
                          }}>
                            {tx.type === "credit" ? "↑ Credit" : "↓ Debit"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: tx.type === "credit" ? "var(--green)" : "var(--red)" }}>
                          {tx.type === "credit" ? "+" : "-"}{pkr(tx.amount)}
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12, color: tx.runningBalance < 0 ? "var(--red)" : "var(--green)" }}>
                          {tx.runningBalance < 0 ? "-" : ""}{pkr(tx.runningBalance)}
                        </td>
                        <td style={{ fontSize: 11, color: "var(--muted)" }}>{tx.note ?? "—"}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="ap-card">
          <div className="ap-ch"><h3>Booking Breakdown</h3><p>Sell price, commission deducted, and net payable per booking</p></div>
          <div className="ap-tw">
            {loading ? <p className="etd">Loading…</p> : bookings.length === 0 ? <p className="etd">No bookings yet.</p> : (
              <table className="ap-table">
                <thead>
                  <tr><th>Ref</th><th>Service</th><th>Sell Price</th><th>Commission</th><th>Net Payable</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{b.bookingRef}</td>
                      <td style={{ textTransform: "capitalize", fontSize: 12 }}>
                        {b.serviceType.replace("_", " ")}
                        {b.groupFlight && <div style={{ fontSize: 10, color: "var(--muted)" }}>{b.groupFlight.airline} · {b.groupFlight.route}</div>}
                      </td>
                      <td style={{ fontWeight: 700 }}>{pkr(b.sellPrice)}</td>
                      <td style={{ color: "var(--gold)", fontWeight: 600 }}>
                        -{pkr(b.commission)}
                        {b.sellPrice > 0 && <div style={{ fontSize: 10, color: "var(--muted)" }}>({Math.round(b.commission / b.sellPrice * 100)}%)</div>}
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--text)" }}>{pkr(b.sellPrice - b.commission)}</td>
                      <td><span className="ap-pill">{b.status}</span></td>
                      <td style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {new Date(b.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "var(--surface)", fontWeight: 700 }}>
                    <td colSpan={2} style={{ padding: "10px 14px", fontSize: 12 }}>Total ({bookings.length} bookings)</td>
                    <td style={{ padding: "10px 14px" }}>{pkr(totalSell)}</td>
                    <td style={{ padding: "10px 14px", color: "var(--gold)" }}>-{pkr(totalComm)}</td>
                    <td style={{ padding: "10px 14px" }}>{pkr(totalSell - totalComm)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="ap-card" style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent ?? "var(--text)", marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--muted)" }}>{sub}</div>
    </div>
  );
}

export default function AgentFinancePage() {
  return (
    <AgentGuard>
      <AgentShell>
        <FinanceInner />
      </AgentShell>
    </AgentGuard>
  );
}
