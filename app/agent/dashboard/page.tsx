"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Preset = "today" | "week" | "month" | "all";

type BookingsSummary = { count: number; totalSellPrice: number; totalCommission: number; net: number };

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

function rangeForPreset(preset: Preset): { from: string | null; to: string | null } {
  const now = new Date();
  const todayStr = toDateInputValue(now);

  if (preset === "today") return { from: todayStr, to: todayStr };

  if (preset === "week") {
    const day = now.getDay();
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

function DashboardInner() {
  const { agent, accessToken, refresh } = useAgentAuth();

  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [summary, setSummary] = useState<BookingsSummary>({ count: 0, totalSellPrice: 0, totalCommission: 0, net: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    const res = await agentFetch(`/api/agent/bookings${qs ? `?${qs}` : ""}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSummary(data.summary ?? { count: 0, totalSellPrice: 0, totalCommission: 0, net: 0 });
    setLoadingSummary(false);
  }, [accessToken, refresh, from, to]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  function applyPreset(p: Preset) {
    setPreset(p);
    const r = rangeForPreset(p);
    setFrom(r.from);
    setTo(r.to);
  }

  const rangeLabel = preset === "all" && !from && !to ? "all-time" : `${from ?? "…"} → ${to ?? "…"}`;

  const amountPayable = agent && agent.balance < 0 ? -agent.balance : 0;

  return (
    <>
      <div className="ap-ph">
        <div>
          <h2>Welcome back, <span>{agent?.fullName ?? "Agent"}</span></h2>
          <p>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <a
          href="https://wa.me/923336515349"
          target="_blank"
          rel="noopener noreferrer"
          className="ap-btn"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          Contact East &amp; West
        </a>
      </div>

      {/* Amount Payable headline — the agent's own outstanding balance,
          i.e. what they currently owe the company. Always the current,
          real-time figure (same value as agent.balance from
          /api/agent/profile) — not affected by the date filter below,
          since balance is a running total, not a per-period figure. */}
      <div
        className="ap-card"
        style={{
          background: amountPayable > 0 ? "var(--red-bg, rgba(220,38,38,0.06))" : "var(--green-bg, rgba(22,163,74,0.06))",
          border: `1px solid ${amountPayable > 0 ? "var(--red-bd, rgba(220,38,38,0.2))" : "var(--green-bd, rgba(22,163,74,0.2))"}`,
          marginBottom: "16px",
        }}
      >
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: amountPayable > 0 ? "var(--red)" : "var(--green)" }}>
            Amount Payable
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: "6px" }}>
            {agent ? pkr(amountPayable) : "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
            {amountPayable > 0 ? "This is what you currently owe East & West." : "You're settled — no outstanding amount right now."}
          </div>
        </div>
      </div>

      <div className="ap-sg">
        <div className="ap-sc">
          <div className="ap-sc-n">{agent ? `PKR ${Number(agent.balance).toLocaleString()}` : "—"}</div>
          <div className="ap-sc-l">Account Balance</div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-n">{agent ? `PKR ${Number(agent.creditLimit).toLocaleString()}` : "—"}</div>
          <div className="ap-sc-l">Credit Limit</div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-n">{agent?.tier ?? "—"}</div>
          <div className="ap-sc-l">Agent Tier</div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-n">{agent?.agentCode ?? "—"}</div>
          <div className="ap-sc-l">Agent Code</div>
        </div>
      </div>

      {/* Date-range filter — scopes bookings-placed-in-this-period below,
          not the Amount Payable figure above. */}
      <div className="ap-card">
        <div className="ap-ch">
          <h3>My Bookings — By Date Range</h3>
          <p>What you booked (and would owe from those bookings) in a chosen period</p>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
                className="ap-btn"
                style={{
                  padding: "6px 12px",
                  fontSize: "11.5px",
                  background: preset === p.value ? "var(--gold, #B8923A)" : "none",
                  color: preset === p.value ? "#000" : "var(--muted)",
                  border: "1.5px solid var(--bdr)",
                  fontWeight: preset === p.value ? 700 : 500,
                }}
              >
                {p.label}
              </button>
            ))}
            <span style={{ width: "1px", height: "18px", background: "var(--bdr)", margin: "0 2px" }} />
            <input
              type="date"
              value={from ?? ""}
              onChange={(e) => { setPreset("all"); setFrom(e.target.value || null); }}
              className="ap-field"
              style={{ padding: "6px 8px", border: "1.5px solid var(--bdr)", borderRadius: "8px", fontSize: "11.5px" }}
            />
            <span style={{ color: "var(--muted)", fontSize: "11px" }}>to</span>
            <input
              type="date"
              value={to ?? ""}
              onChange={(e) => { setPreset("all"); setTo(e.target.value || null); }}
              className="ap-field"
              style={{ padding: "6px 8px", border: "1.5px solid var(--bdr)", borderRadius: "8px", fontSize: "11.5px" }}
            />
            <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "4px" }}>Showing: {rangeLabel}</span>
          </div>

          {loadingSummary ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div className="ap-sc" style={{ margin: 0 }}>
                <div className="ap-sc-n">{summary.count}</div>
                <div className="ap-sc-l">Bookings in Range</div>
              </div>
              <div className="ap-sc" style={{ margin: 0 }}>
                <div className="ap-sc-n">{pkr(summary.totalSellPrice)}</div>
                <div className="ap-sc-l">Total Sell Price</div>
              </div>
              <div className="ap-sc" style={{ margin: 0 }}>
                <div className="ap-sc-n">{pkr(summary.net)}</div>
                <div className="ap-sc-l">Net (Sell − Commission)</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-ch">
          <h3>Quick Links</h3>
        </div>
        <div style={{ padding: "16px 18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/agent/bookings/new" className="ap-btn ap-btn-gold">New Booking</Link>
          <Link href="/agent/bookings" className="ap-btn ap-btn-ghost">My Bookings</Link>
          <Link href="/agent/profile" className="ap-btn ap-btn-ghost">My Profile</Link>
        </div>
      </div>
    </>
  );
}

export default function AgentDashboardPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <DashboardInner />
      </AgentShell>
    </AgentGuard>
  );
}
