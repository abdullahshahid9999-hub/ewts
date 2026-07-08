"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/adminAuthClient";

const NAV = [
  {
    section: "Overview",
    items: [{ href: "/admin/dashboard", icon: "📊", label: "Dashboard" }],
  },
  {
    section: "Services",
    items: [
      { href: "/admin/packages", icon: "🌙", label: "Packages" },
      { href: "/admin/visa-services", icon: "🛂", label: "Visa Services" },
      { href: "/admin/group-flights", icon: "✈️", label: "Group Flights" },
      { href: "/admin/insurance", icon: "🛡️", label: "Insurance Plans" },
    ],
  },
  {
    section: "Content",
    items: [{ href: "/admin/blogs", icon: "📝", label: "Blog Posts" }],
  },
  {
    section: "Agent Network",
    items: [
      { href: "/admin/agents", icon: "🧑‍💼", label: "Agents" },
      { href: "/admin/agent-bookings", icon: "📋", label: "Agent Bookings" },
      { href: "/admin/payment-slips", icon: "💳", label: "Payment Slips" },
      { href: "/admin/finance", icon: "💰", label: "Finance" },
    ],
  },
];

export default function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { admin, logout } = useAdminAuth();
  const pathname = usePathname();

  return (
    <aside className={`adp-sb ${open ? "open" : ""}`}>
      <div className="adp-sb-brand">
        <div className="adp-sb-brand-txt">East &amp; <span>West</span></div>
      </div>
      <div style={{ padding: "7px 14px 10px", fontSize: "11px", color: "var(--a-muted)", borderBottom: "1px solid var(--a-border)" }}>
        🛡️ {admin?.email ?? "Admin"}
      </div>
      <div className="adp-sb-nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="adp-sb-lbl">{group.section}</div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`adp-sbn ${pathname === item.href ? "active" : ""}`}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
        ))}
        <a className="adp-sbn" href="/" target="_blank" rel="noopener noreferrer">
          🔗 View Website
        </a>
      </div>
      <div className="adp-sb-footer">
        <button className="adp-sb-out" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
