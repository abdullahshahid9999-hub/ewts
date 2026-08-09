"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import { useEffect, useState } from "react";

const NAV = [
  {
    section: "Main",
    items: [{ href: "/agent/dashboard", icon: "🏠", label: "Dashboard" }],
  },
  {
    section: "My Bookings",
    items: [
      { href: "/agent/bookings", icon: "📋", label: "My Bookings" },
    ],
  },
  {
    section: "New Booking",
    items: [
      { href: "/agent/new-booking", icon: "➕", label: "New Booking" },
      { href: "/agent/saved-clients", icon: "👥", label: "Saved Clients" },
    ],
  },
  {
    section: "Finance",
    items: [
      { href: "/agent/finance", icon: "💰", label: "Finance & Ledger" },
      { href: "/agent/topup", icon: "💳", label: "Topup" },
      { href: "/agent/bank-accounts", icon: "🏦", label: "Bank Accounts" },
    ],
  },
  {
    section: "Account",
    items: [{ href: "/agent/profile", icon: "👤", label: "My Profile" }, { href: "/agent/team", icon: "👥", label: "My Team" }],
  },
];

function tierClass(tier: string) {
  const t = tier?.toLowerCase();
  if (t === "gold") return "ap-tier-gold";
  if (t === "platinum") return "ap-tier-platinum";
  if (t === "silver") return "ap-tier-silver";
  return "ap-tier-standard";
}

export default function AgentSidebar({ open, onClose, dark, onToggleDark }: { open: boolean; onClose: () => void; dark?: boolean; onToggleDark?: () => void }) {
  const { agent, logout, accessToken, refresh } = useAgentAuth();
  const pathname = usePathname();

  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    agentFetch("/api/agent/notifications?unreadOnly=true", accessToken, refresh)
      .then(r => r.json()).then(d => setUnread(d.unreadCount ?? 0)).catch(() => {});
    const t = setInterval(() => {
      agentFetch("/api/agent/notifications?unreadOnly=true", accessToken, refresh)
        .then(r => r.json()).then(d => setUnread(d.unreadCount ?? 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [accessToken, refresh]);

  function isActive(href: string) {
    const [hrefPath] = href.split("?");
    return pathname === hrefPath || pathname === href;
  }

  const balance = agent ? Number(agent.balance ?? 0) : 0;
  const creditLimit = agent ? Number(agent.creditLimit ?? 0) : 0;

  return (
    <aside className={`ap-sb ${open ? "open" : ""}`}>
      <div className="ap-sb-brand">
        <div className="ap-sb-brand-txt">East &amp; <span>West</span></div>
      </div>
      <div className="ap-sb-agent">
        <div className="ap-sb-agent-name">{agent?.fullName ?? "Loading…"}</div>
        <div className="ap-sb-agent-meta">
          <span className="ap-sb-agent-code">{agent?.agentCode ?? "—"}</span>
          {agent?.tier && <span className={`ap-tier-pill ${tierClass(agent.tier)}`}>{agent.tier}</span>}
        </div>
      </div>
      <div className="ap-sb-balance">
        <div className="ap-sb-bal-label">Account Balance</div>
        <div className={`ap-sb-bal-amount ${balance < 0 ? "neg" : ""}`}>
          {balance < 0 ? "-" : ""}PKR {Math.abs(balance).toLocaleString()}
        </div>
        <div className="ap-sb-bal-limit">Credit limit: PKR {creditLimit.toLocaleString()}</div>
      </div>
      <div className="ap-sb-nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="ap-sb-lbl">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`ap-sbn ${isActive(item.href) ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span><span>{item.icon}</span> {item.label}</span>
                {item.href === "/agent/notifications" && unread > 0 && (
                  <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 99, padding: "1px 7px", flexShrink: 0 }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="ap-sb-footer">
        {onToggleDark && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              {dark ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </span>
            <button className={`ap-dark-toggle${dark ? " on" : ""}`} onClick={onToggleDark} aria-label="Toggle dark mode" />
          </div>
        )}
        <button className="ap-sb-out" onClick={logout}>Sign Out</button>
      </div>
    </aside>
  );
}
