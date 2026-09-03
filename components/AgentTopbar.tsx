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

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const agentName  = agent?.fullName ?? "Agent";
  const agentEmail = agent?.email ?? "";
  const agentLogo  = agent?.logoUrl ?? null;

  return (
    <div className="ap-tbar">

      {/* ── LEFT: E&W logo + nav links ── */}
      <div className="ap-tbar-left">
        <Link href="/agent/dashboard" className="ap-tbar-logo" aria-label="Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="East & West" className="ap-tbar-logo-img" />
        </Link>

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

      {/* ── RIGHT: agent chip + bell + dark toggle ── */}
      <div className="ap-tbar-right">

        {/* Sub-user badge */}
        {subUser && (
          <div className="ap-tbar-subuser">
            <span>{subUser.fullName}</span>
            {subUser.designation && <span className="ap-tbar-subuser-desg">· {subUser.designation}</span>}
          </div>
        )}

        {/* Agent identity chip — matches Abid Air right-side chip exactly */}
        <div className="ap-tbar-agent-chip">
          <div className="ap-tbar-agent-avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={agentLogo || "/avatar.png"}
              alt={agentName}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
            />
          </div>
          <div className="ap-tbar-agent-info">
            <span className="ap-tbar-agent-name">{agentName}</span>
            <span className="ap-tbar-agent-email">{agentEmail}</span>
          </div>
          <svg className="ap-tbar-agent-caret" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Notification bell */}
        <AgentNotificationBell />

        {/* Dark mode toggle */}
        {onToggleDark && (
          <button
            className={`ap-dark-toggle${dark ? " on" : ""}`}
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            title={dark ? "Light mode" : "Dark mode"}
          />
        )}

        {/* Sign out */}
        <button onClick={logout} className="ap-tbar-signout">
          Sign Out
        </button>

        {/* Hamburger — mobile only */}
        <button onClick={onMenuToggle} className="ap-tbar-hamburger" aria-label="Toggle menu">
          ☰
        </button>
      </div>
    </div>
  );
}
