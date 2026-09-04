"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Preset = "today" | "week" | "month" | "all";
type BookingsSummary = { count: number; totalSellPrice: number; totalCommission: number; net: number };
type StatusCounts = { confirmed: number; on_hold: number; cancelled: number };

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

    const list: Array<{ status: string }> = data.bookings ?? [];
    setStatusCounts({
      confirmed:  list.filter(b => b.status === "confirmed" || b.status === "issued" || b.status === "issue_requested").length,
      on_hold:    list.filter(b => b.status === "pending").length,
      cancelled:  list.filter(b => b.status === "cancelled").length,
    });
    setLoadingSummary(false);
  }, [accessToken, refresh, from, to]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

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
        <div className="db-hero-plane">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
        </div>

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
            <div className="db-status-icon db-status-icon--green">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
            </div>
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
            <div className="db-status-icon db-status-icon--yellow">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><polyline points="10 6 10 10 13 12" strokeLinecap="round"/></svg>
            </div>
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
            <div className="db-status-icon db-status-icon--red">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="6" x2="14" y2="14"/><line x1="14" y1="6" x2="6" y2="14"/></svg>
            </div>
          </div>
          <div className="db-status-prog-row">
            <span>Progress</span>
            <span>{loadingSummary ? "—" : `${summary.count > 0 ? Math.round((statusCounts.cancelled / summary.count) * 100) : 0}%`}</span>
          </div>
          <div className="db-status-bar"><div className="db-status-bar-fill db-status-bar-fill--red" style={{ width: summary.count > 0 ? `${Math.round((statusCounts.cancelled / summary.count) * 100)}%` : "0%" }} /></div>
        </div>
      </div>

      {/* ══ padded content below hero ══ */}
      <div className="db-content-wrap">

      {/* ══════════════════════════════════════════════
          EXPLORE + SPECIAL — two-column, Image 2
          ══════════════════════════════════════════════ */}
      <div className="db-explore-row">

        {/* LEFT: Popular Destinations */}
        <div className="db-explore-col">
          <div className="db-section-tag">
            <svg className="db-section-tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="2.83" y2="8"/><line x1="21.17" y1="16" x2="2.83" y2="16"/></svg>
            <span className="db-section-tag-text">EXPLORE</span>
          </div>
          <h2 className="db-section-title">Popular Destinations</h2>
          <div className="db-dest-grid">
            {/* All Groups card */}
            <Link href="/agent/group-flights" className="db-dest-card">
              <img src="/images/allgroups-bg.jpg" alt="All Groups" className="db-dest-img" />
              <div className="db-dest-overlay">
                <span className="db-dest-chip"><svg style={{display:"inline",marginRight:4,verticalAlign:"middle"}} width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>All routes</span>
                <div className="db-dest-arrow">↗</div>
              </div>
              <div className="db-dest-label">All Groups</div>
            </Link>
            {/* Umrah Packages card */}
            <Link href="/agent/umrah" className="db-dest-card">
              <img src="/images/makarem_1.jpeg" alt="Umrah Packages" className="db-dest-img" />
              <div className="db-dest-overlay">
                <span className="db-dest-chip"><svg style={{display:"inline",marginRight:4,verticalAlign:"middle"}} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 1 4 0"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/></svg>Packages</span>
                <div className="db-dest-arrow">↗</div>
              </div>
              <div className="db-dest-label">Umrah Packages</div>
            </Link>
          </div>
        </div>

        {/* RIGHT: Exclusive Deals */}
        <div className="db-special-col">
          <div className="db-section-tag">
            <svg className="db-section-tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d78" strokeWidth="2.5"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M9 4a2 2 0 0 1 3 3v1H9V4z"/><path d="M15 4a2 2 0 0 0-3 3v1h3V4z"/><line x1="3" y1="8" x2="21" y2="8"/></svg>
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

      </div>{/* end db-content-wrap */}
    </>
  );
}

export default function AgentDashboardPage() {
  return <AgentGuard><AgentShell><DashboardInner /></AgentShell></AgentGuard>;
}
