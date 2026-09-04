"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Preset = "today" | "week" | "month" | "all";
type BookingsSummary = { count: number; totalSellPrice: number; totalCommission: number; net: number };
type StatusCounts = { confirmed: number; on_hold: number; cancelled: number };

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week",  label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all",   label: "All Time" },
];

const QUICK_LINKS = [
  { href: "/agent/new-booking",   icon: "✈️",  label: "New Booking",    desc: "Book Umrah, tours, tickets" },
  { href: "/agent/bookings",      icon: "📋",  label: "My Bookings",    desc: "View & track all bookings" },
  { href: "/agent/topup",         icon: "💳",  label: "Submit Topup",   desc: "Add funds to your account" },
  { href: "/agent/bank-accounts", icon: "🏦",  label: "Bank Accounts",  desc: "East & West payment details" },
  { href: "/agent/saved-clients", icon: "👥",  label: "Saved Clients",  desc: "Your client address book" },
  { href: "/agent/staff",         icon: "🧑‍💼", label: "My Staff",       desc: "Manage team members & access" },
  { href: "/agent/profile",       icon: "👤",  label: "My Profile",     desc: "Account & security settings" },
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
  if (p === "week")  { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: toISO(d), to: today }; }
  if (p === "month") { const d = new Date(now); d.setDate(1); return { from: toISO(d), to: today }; }
  return { from: null, to: null };
}

function DashboardInner() {
  const { agent, accessToken, refresh } = useAgentAuth();
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState<string | null>(rangeForPreset("month").from);
  const [to,   setTo]   = useState<string | null>(rangeForPreset("month").to);
  const [summary, setSummary]           = useState<BookingsSummary>({ count: 0, totalSellPrice: 0, totalCommission: 0, net: 0 });
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ confirmed: 0, on_hold: 0, cancelled: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to)   params.set("to",   to);
    const qs = params.toString();
    const res = await agentFetch(`/api/agent/bookings${qs ? `?${qs}` : ""}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSummary(data.summary ?? { count: 0, totalSellPrice: 0, totalCommission: 0, net: 0 });

    // compute confirmed / on_hold / cancelled from bookings array
    const list: Array<{ status: string }> = data.bookings ?? [];
    setStatusCounts({
      confirmed:  list.filter(b => b.status === "confirmed" || b.status === "issued" || b.status === "issue_requested").length,
      on_hold:    list.filter(b => b.status === "pending").length,
      cancelled:  list.filter(b => b.status === "cancelled").length,
    });
    setLoadingSummary(false);
  }, [accessToken, refresh, from, to]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  function applyPreset(p: Preset) { setPreset(p); const r = rangeForPreset(p); setFrom(r.from); setTo(r.to); }

  const amountPayable = agent && agent.balance < 0 ? -agent.balance : 0;
  const tier          = agent?.tier ?? "bronze";
  const tierColor     = TIER_COLORS[tier] ?? "#B8862E";
  const tierBg        = TIER_BG[tier]    ?? "#fffbeb";
  const creditUsed    = agent ? Math.max(0, -(agent.balance)) : 0;
  const creditLimit   = agent ? Number(agent.creditLimit) : 0;
  const creditPct     = creditLimit > 0 ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO BANNER — blue gradient, exact Image 2
          ══════════════════════════════════════════════ */}
      <div className="db-hero">
        {/* Live Updates pill */}
        <div className="db-hero-live">
          <span className="db-hero-live-dot" />
          Live Updates
        </div>

        {/* Greeting */}
        <div className="db-hero-greeting">
          <h1>
            {greeting()},{" "}
            <span style={{ color: "#FFD700" }}>{agent?.fullName?.split(" ")[0] ?? "Agent"}</span>{" "}
            <span>👋</span>
          </h1>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.75, marginTop: 2 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Airplane icon circle — top right of banner */}
        <div className="db-hero-plane">✈️</div>

        {/* Contact button */}
        <a href="https://wa.me/923336515349" target="_blank" rel="noopener noreferrer" className="db-hero-cta">
          💬 Contact East &amp; West
        </a>
      </div>

      {/* ══════════════════════════════════════════════
          3 STATUS CARDS — overlap the hero bottom
          ══════════════════════════════════════════════ */}
      <div className="db-status-row">
        {/* Confirmed */}
        <div className="db-status-card">
          <div className="db-status-top">
            <div>
              <div className="db-status-num">{loadingSummary ? "—" : statusCounts.confirmed}</div>
              <div className="db-status-label">CONFIRMED BOOKINGS</div>
            </div>
            <div className="db-status-icon db-status-icon--green">✓</div>
          </div>
          <div className="db-status-prog-row">
            <span>Progress</span>
            <span>{loadingSummary ? "—" : `${summary.count > 0 ? Math.round((statusCounts.confirmed / summary.count) * 100) : 0}%`}</span>
          </div>
          <div className="db-status-bar"><div className="db-status-bar-fill db-status-bar-fill--green" style={{ width: summary.count > 0 ? `${Math.round((statusCounts.confirmed / summary.count) * 100)}%` : "0%" }} /></div>
        </div>

        {/* On Hold */}
        <div className="db-status-card">
          <div className="db-status-top">
            <div>
              <div className="db-status-num">{loadingSummary ? "—" : statusCounts.on_hold}</div>
              <div className="db-status-label">ON HOLD BOOKINGS</div>
            </div>
            <div className="db-status-icon db-status-icon--yellow">◷</div>
          </div>
          <div className="db-status-prog-row">
            <span>Progress</span>
            <span>{loadingSummary ? "—" : `${summary.count > 0 ? Math.round((statusCounts.on_hold / summary.count) * 100) : 0}%`}</span>
          </div>
          <div className="db-status-bar"><div className="db-status-bar-fill db-status-bar-fill--yellow" style={{ width: summary.count > 0 ? `${Math.round((statusCounts.on_hold / summary.count) * 100)}%` : "0%" }} /></div>
        </div>

        {/* Cancelled */}
        <div className="db-status-card">
          <div className="db-status-top">
            <div>
              <div className="db-status-num">{loadingSummary ? "—" : statusCounts.cancelled}</div>
              <div className="db-status-label">CANCELLED BOOKINGS</div>
            </div>
            <div className="db-status-icon db-status-icon--red">✕</div>
          </div>
          <div className="db-status-prog-row">
            <span>Progress</span>
            <span>{loadingSummary ? "—" : `${summary.count > 0 ? Math.round((statusCounts.cancelled / summary.count) * 100) : 0}%`}</span>
          </div>
          <div className="db-status-bar"><div className="db-status-bar-fill db-status-bar-fill--red" style={{ width: summary.count > 0 ? `${Math.round((statusCounts.cancelled / summary.count) * 100)}%` : "0%" }} /></div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          AGENT IDENTITY CARD
          ══════════════════════════════════════════════ */}
      <div className="db-identity">
        <div className="db-identity-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={agent?.logoUrl || "/logo.png"}
            alt="Agency Logo"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
          />
        </div>
        <div className="db-identity-info">
          <div className="db-identity-row">
            <span className="db-identity-name">{agent?.fullName ?? "—"}</span>
            <span className="db-identity-tier" style={{ background: tierColor }}>{tier.toUpperCase()}</span>
            <span className="db-identity-code">{agent?.agentCode ?? "—"}</span>
          </div>
          <span className="db-identity-email">{agent?.email}</span>
        </div>
        <div className="db-identity-credit">
          <div className="db-identity-credit-row">
            <span>Credit Used</span>
            <span style={{ fontWeight: 700, color: creditPct > 80 ? "#dc2626" : "var(--muted)" }}>{creditPct.toFixed(0)}%</span>
          </div>
          <div className="db-identity-credit-bar">
            <div style={{ height: "100%", width: `${creditPct}%`, background: creditPct > 80 ? "#dc2626" : tierColor, borderRadius: 3, transition: "width .6s" }} />
          </div>
          <div className="db-identity-credit-row" style={{ marginTop: 3 }}>
            <span>Used: {pkr(creditUsed)}</span>
            <span>Limit: {pkr(creditLimit)}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FINANCE STATS ROW
          ══════════════════════════════════════════════ */}
      <div className="db-stats-row">
        {[
          { label: "Account Balance",  value: agent ? pkr(Number(agent.balance)) : "—", icon: "💰", color: Number(agent?.balance ?? 0) < 0 ? "#dc2626" : "#16a34a" },
          { label: "Amount Payable",   value: agent ? pkr(amountPayable) : "—",          icon: "📤", color: amountPayable > 0 ? "#dc2626" : "#16a34a" },
          { label: "Credit Limit",     value: agent ? pkr(creditLimit) : "—",             icon: "🏦", color: "var(--gold)" },
        ].map(s => (
          <div key={s.label} className="db-stat-card">
            <div className="db-stat-icon">{s.icon}</div>
            <div className="db-stat-val" style={{ color: s.color }}>{s.value}</div>
            <div className="db-stat-label">{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          EXPLORE + SPECIAL — two-column, Image 2
          ══════════════════════════════════════════════ */}
      <div className="db-explore-row">

        {/* LEFT: Popular Destinations */}
        <div className="db-explore-col">
          <div className="db-section-tag">
            <span className="db-section-tag-icon">🌐</span>
            <span className="db-section-tag-text">EXPLORE</span>
          </div>
          <h2 className="db-section-title">Popular Destinations</h2>
          <div className="db-dest-grid">
            {/* All Groups card */}
            <Link href="/agent/group-flights" className="db-dest-card">
              <img src="/office-photo-1.jpeg" alt="All Groups" className="db-dest-img" />
              <div className="db-dest-overlay">
                <span className="db-dest-chip">✈ All routes</span>
                <div className="db-dest-arrow">↗</div>
              </div>
              <div className="db-dest-label">All Groups</div>
            </Link>
            {/* Umrah Packages card */}
            <Link href="/agent/umrah" className="db-dest-card">
              <img src="/hotel-makarem-1.jpeg" alt="Umrah Packages" className="db-dest-img" />
              <div className="db-dest-overlay">
                <span className="db-dest-chip">📦 Packages</span>
                <div className="db-dest-arrow">↗</div>
              </div>
              <div className="db-dest-label">Umrah Packages</div>
            </Link>
          </div>
        </div>

        {/* RIGHT: Exclusive Deals */}
        <div className="db-special-col">
          <div className="db-section-tag">
            <span className="db-section-tag-icon" style={{ color: "#e11d78" }}>🎁</span>
            <span className="db-section-tag-text" style={{ color: "#e11d78" }}>SPECIAL</span>
          </div>
          <h2 className="db-section-title">Exclusive Deals</h2>
          <div className="db-deals-empty">
            <div className="db-deals-empty-icon">🎁</div>
            <p className="db-deals-empty-title">No special offers available</p>
            <p className="db-deals-empty-sub">Check back later for exclusive deals</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          BOOKINGS SUMMARY (date filter)
          ══════════════════════════════════════════════ */}
      <div className="db-bsummary">
        <div className="db-bsummary-head">
          <div>
            <h3 className="db-bsummary-title">Bookings Summary</h3>
            <p className="db-bsummary-sub">Filter by date range</p>
          </div>
          <div className="db-bsummary-presets">
            {PRESETS.map(p => (
              <button key={p.value} onClick={() => applyPreset(p.value)}
                className={`db-preset-btn${preset === p.value ? " active" : ""}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="db-bsummary-body">
          <div className="db-bsummary-dates">
            <input type="date" value={from ?? ""} onChange={e => { setPreset("all"); setFrom(e.target.value || null); }} className="db-date-input" />
            <span className="db-date-sep">→</span>
            <input type="date" value={to ?? ""}   onChange={e => { setPreset("all"); setTo(e.target.value   || null); }} className="db-date-input" />
          </div>
          {loadingSummary ? (
            <p style={{ color: "var(--muted)", fontSize: 13, padding: "12px 0" }}>Loading…</p>
          ) : (
            <div className="db-bsummary-grid">
              {[
                { label: "Bookings",              value: String(summary.count),          icon: "🗂️" },
                { label: "Total Sell Price",       value: pkr(summary.totalSellPrice),    icon: "💵" },
                { label: "Net (after commission)", value: pkr(summary.net),               icon: "✅" },
              ].map(s => (
                <div key={s.label} className="db-bsummary-cell">
                  <div className="db-bsummary-cell-icon">{s.icon}</div>
                  <div className="db-bsummary-cell-val">{s.value}</div>
                  <div className="db-bsummary-cell-lbl">{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          QUICK ACTIONS
          ══════════════════════════════════════════════ */}
      <div className="db-quicklinks">
        <h3 className="db-quicklinks-title">Quick Actions</h3>
        <div className="db-quicklinks-grid">
          {QUICK_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="db-quicklink-card">
              <span className="db-quicklink-icon">{l.icon}</span>
              <span className="db-quicklink-label">{l.label}</span>
              <span className="db-quicklink-desc">{l.desc}</span>
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
