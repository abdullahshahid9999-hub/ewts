"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgentAuth } from "@/lib/agentAuthClient";
import AgentNotificationBell from "@/components/AgentNotificationBell";

const NAV_LINKS = [
  { href: "/agent/dashboard",   label: "Dashboard" },
  { href: "/agent/new-booking", label: "New Booking" },
  { href: "/agent/bookings",    label: "My Bookings" },
  { href: "/agent/finance",     label: "Finance" },
];

export default function AgentTopbar({
  onMenuToggle,
  dark,
  onToggleDark,
}: {
  onMenuToggle: () => void;
  dark?: boolean;
  onToggleDark?: () => void;
}) {
  const { agent, subUser, logout } = useAgentAuth();
  const pathname = usePathname();
  const balance = agent ? Number(agent.balance ?? 0) : 0;

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="ap-tbar">
      {/* ── Left: Logo + nav links (desktop) ── */}
      <div className="ap-tbar-left">
        {/* Logo */}
        <Link href="/agent/dashboard" className="ap-tbar-logo" aria-label="Dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="East & West" height={34} style={{ objectFit: "contain", display: "block" }} />
        </Link>

        {/* Desktop nav links */}
        <nav className="ap-tbar-nav">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`ap-tbar-navlink${isActive(l.href) ? " active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Right: sub-user badge, balance, bell, dark toggle, sign-out ── */}
      <div className="ap-tbar-right">
        {subUser && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 20,
              background: "rgba(184,142,62,0.12)",
              border: "1px solid rgba(184,142,62,0.3)",
              color: "#9C7E3A",
              maxWidth: 180,
              overflow: "hidden",
            }}
          >
            <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {subUser.fullName}
            </span>
            {subUser.designation && (
              <span style={{ opacity: 0.7, whiteSpace: "nowrap" }}>· {subUser.designation}</span>
            )}
          </div>
        )}

        <div className="ap-tbar-bal">
          <span className="ap-tbar-bal-label">Balance</span>
          <span className={`ap-tbar-bal-amt${balance < 0 ? " neg" : ""}`}>
            {balance < 0 ? "-" : ""}PKR {Math.abs(balance).toLocaleString()}
          </span>
        </div>

        <AgentNotificationBell />

        {onToggleDark && (
          <button
            className={`ap-dark-toggle${dark ? " on" : ""}`}
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            title={dark ? "Light mode" : "Dark mode"}
          />
        )}

        <button onClick={logout} className="ap-tbar-signout">
          Sign Out
        </button>

        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="ap-tbar-hamburger"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>
    </div>
  );
}
