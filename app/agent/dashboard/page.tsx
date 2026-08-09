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

const QUICK_LINKS = [
  { href: "/agent/new-booking",  icon: "✈️", label: "New Booking",     desc: "Book Umrah, tours, tickets" },
  { href: "/agent/bookings",     icon: "📋", label: "My Bookings",     desc: "View & track all bookings" },
  { href: "/agent/topup",        icon: "💳", label: "Submit Topup",    desc: "Add funds to your account" },
  { href: "/agent/bank-accounts",icon: "🏦", label: "Bank Accounts",   desc: "East & West payment details" },
  { href: "/agent/saved-clients",icon: "👥", label: "Saved Clients",   desc: "Your client address book" },
  { href: "/agent/staff",        icon: "🧑‍💼", label: "My Staff",        desc: "Manage team members & access" },
  { href: "/agent/profile",      icon: "👤", label: "My Profile",      desc: "Account & security settings" },
];

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#94a3b8", gold: "#B8862E", platinum: "#7c3aed",
};
const TIER_BG: Record<string, string> = {
  bronze: "#fdf3e7", silver: "#f1f5f9", gold: "#fffbeb", platinum: "#f5f3ff",
};

function pkr(n: number) { return `PKR ${n.toLocaleString("en-PK")}`; }
function toISO(d: Date) { return d.toISOString().slice(0, 10); }

function rangeForPreset(p: Preset) {
  const now = new Date(); const today = toISO(now);
  if (p === "today") return { from: today, to: today };
  if (p === "week") { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: toISO(d), to: today }; }
  if (p === "month") { const d = new Date(now); d.setDate(1); return { from: toISO(d), to: today }; }
  return { from: null, to: null };
}

function DashboardInner() {
  const { agent, accessToken, refresh } = useAgentAuth();
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState<string | null>(rangeForPreset("month").from);
  const [to, setTo] = useState<string | null>(rangeForPreset("month").to);
  const [summary, setSummary] = useState<BookingsSummary>({ count: 0, totalSellPrice: 0, totalCommission: 0, net: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await agentFetch(`/api/agent/bookings${params.toString() ? `?${params}` : ""}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSummary(data.summary ?? { count: 0, totalSellPrice: 0, totalCommission: 0, net: 0 });
    setLoadingSummary(false);
  }, [accessToken, refresh, from, to]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  function applyPreset(p: Preset) { setPreset(p); const r = rangeForPreset(p); setFrom(r.from); setTo(r.to); }

  const amountPayable = agent && agent.balance < 0 ? -agent.balance : 0;
  const tier = agent?.tier ?? "bronze";
  const tierColor = TIER_COLORS[tier] ?? "#B8862E";
  const tierBg = TIER_BG[tier] ?? "#fffbeb";
  const creditUsed = agent ? Math.max(0, -(agent.balance)) : 0;
  const creditLimit = agent ? Number(agent.creditLimit) : 0;
  const creditPct = creditLimit > 0 ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
            {greeting()}, <span style={{ color: "var(--gold)" }}>{agent?.fullName?.split(" ")[0] ?? "Agent"}</span> 👋
          </h2>
        </div>
        <a href="https://wa.me/923336515349" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 18px", borderRadius: 12, textDecoration: "none" }}>
          💬 Contact East &amp; West
        </a>
      </div>

      {/* Agent Identity Card */}
      <div style={{ background: `linear-gradient(135deg, ${tierBg}, #fff)`, border: `1.5px solid ${tierColor}33`, borderRadius: 20, padding: "20px 22px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", border: `2px solid ${tierColor}`, overflow: "hidden", flexShrink: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="/assets/logo.png" alt="Logo" width={44} height={44} style={{ objectFit: "contain", borderRadius: "50%" }} onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display="none"; const p = el.parentElement; if(p){ p.style.background=`linear-gradient(135deg,${tierColor},${tierColor}99)`; p.innerHTML=`<span style="color:#fff;font-weight:900;font-size:20px">${(agent?.fullName??"A")[0]}</span>`; } }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <p style={{ fontWeight: 800, fontSize: 16, margin: 0, color: "var(--text)" }}>{agent?.fullName ?? "—"}</p>
            <span style={{ background: tierColor, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>{tier}</span>
            <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, fontFamily: "monospace" }}>{agent?.agentCode ?? "—"}</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>{agent?.email}</p>
        </div>
        {/* Credit bar */}
        <div style={{ minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Credit Used</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: creditPct > 80 ? "#dc2626" : "var(--muted)" }}>{creditPct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${creditPct}%`, background: creditPct > 80 ? "#dc2626" : tierColor, borderRadius: 3, transition: "width 0.6s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>Used: {pkr(creditUsed)}</span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>Limit: {pkr(creditLimit)}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Account Balance", value: agent ? pkr(Number(agent.balance)) : "—", icon: "💰", color: Number(agent?.balance ?? 0) < 0 ? "#dc2626" : "#16a34a" },
          { label: "Amount Payable", value: agent ? pkr(amountPayable) : "—", icon: "📤", color: amountPayable > 0 ? "#dc2626" : "#16a34a" },
          { label: "Credit Limit", value: agent ? pkr(creditLimit) : "—", icon: "🏦", color: "var(--gold)" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <p style={{ fontWeight: 800, fontSize: 18, margin: 0, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bookings summary */}
      <div className="ap-card" style={{ marginBottom: 16 }}>
        <div className="ap-ch" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ margin: 0 }}>Bookings Summary</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>Filter by date range</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PRESETS.map(p => (
              <button key={p.value} onClick={() => applyPreset(p.value)}
                style={{ padding: "5px 12px", fontSize: 11, fontWeight: preset === p.value ? 800 : 500, borderRadius: 8, border: "1.5px solid", borderColor: preset === p.value ? "var(--gold)" : "var(--bdr)", background: preset === p.value ? "var(--gold)" : "transparent", color: preset === p.value ? "#fff" : "var(--muted)", cursor: "pointer" }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <input type="date" value={from ?? ""} onChange={e => { setPreset("all"); setFrom(e.target.value || null); }}
              style={{ padding: "6px 10px", border: "1.5px solid var(--bdr)", borderRadius: 8, fontSize: 12, background: "#f8fafc" }} />
            <span style={{ color: "var(--muted)", fontSize: 12 }}>→</span>
            <input type="date" value={to ?? ""} onChange={e => { setPreset("all"); setTo(e.target.value || null); }}
              style={{ padding: "6px 10px", border: "1.5px solid var(--bdr)", borderRadius: 8, fontSize: 12, background: "#f8fafc" }} />
          </div>
          {loadingSummary ? <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Bookings", value: String(summary.count), icon: "🗂️" },
                { label: "Total Sell Price", value: pkr(summary.totalSellPrice), icon: "💵" },
                { label: "Net (after commission)", value: pkr(summary.net), icon: "✅" },
              ].map(s => (
                <div key={s.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: "var(--muted)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="ap-card">
        <div className="ap-ch"><h3>Quick Actions</h3></div>
        <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {QUICK_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              style={{ display: "flex", flexDirection: "column", gap: 4, padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, textDecoration: "none", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLAnchorElement).style.background = "#fffbeb"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLAnchorElement).style.background = "#f8fafc"; }}>
              <span style={{ fontSize: 22 }}>{l.icon}</span>
              <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: "var(--text)" }}>{l.label}</p>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AgentDashboardPage() {
  return <AgentGuard><AgentShell><DashboardInner /></AgentShell></AgentGuard>;
}
