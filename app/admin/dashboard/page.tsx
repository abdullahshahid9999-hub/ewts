"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type DashboardStats = {
  totalAgents: number;
  pendingAgentBookings: number;
  totalActiveListings: number;
  listingsBreakdown: { packages: number; groupFlights: number; visaServices: number };
  revenueThisMonth: number;
  totalPayable: number;
  visa: { pending: number; moreInfo: number; approvedThisMonth: number; today: number };
};

function pkr(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

const SECTION_GROUPS = [
  {
    group: "Content & Listings",
    items: [
      { href: "/admin/packages",     title: "Packages",      desc: "Umrah & tour packages" },
      { href: "/admin/visa-services", title: "Visa Services",  desc: "Country visa listings" },
      { href: "/admin/group-flights", title: "Group Flights",  desc: "Group ticket listings" },
      { href: "/admin/insurance",     title: "Insurance",      desc: "Companies, plans, rates" },
      { href: "/admin/blogs",         title: "Blog",           desc: "Articles & posts" },
    ],
  },
  {
    group: "Agents & Bookings",
    items: [
      { href: "/admin/agents",         title: "Agents",          desc: "Agent accounts, commission rates" },
      { href: "/admin/agent-bookings",  title: "Agent Bookings",  desc: "Review & issue bookings" },
      { href: "/admin/payment-slips",   title: "Payment Slips",   desc: "Approve/reject agent payments" },
      { href: "/admin/finance",         title: "Finance",         desc: "Revenue, commission, agent balances" },
    ],
  },
  {
    group: "Admin",
    items: [
      { href: "/admin/invite-admins",  title: "Invite Admins",  desc: "Invite new admin users via email" },
      { href: "/admin/bank-accounts",  title: "Bank Accounts",  desc: "Manage bank account details" },
    ],
  },
];
const SECTIONS = SECTION_GROUPS.flatMap(g => g.items);

function DashboardInner() {
  const { admin, accessToken, refresh } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminFetch("/api/admin/dashboard-stats", accessToken, refresh);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setStats(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, refresh]);

  const cards = [
    { label: "Total Agents", value: stats?.totalAgents },
    { label: "Pending Bookings", value: stats?.pendingAgentBookings },
    { label: "Active Listings", value: stats?.totalActiveListings },
    { label: "Revenue This Month", value: stats ? pkr(stats.revenueThisMonth) : undefined },
    { label: "Total Payable (Owed by Agents)", value: stats ? pkr(stats.totalPayable) : undefined },
  ];

  return (
    <>
      <div className="adp-ph">
        <div>
          <h2>Welcome, <em>{admin?.email ?? "Admin"}</em></h2>
          <p>Manage packages, visas, flights, insurance, agents and content</p>
        </div>
      </div>

      <div className="adp-sg" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: "16px" }}>
        {cards.map((c) => (
          <div key={c.label} className="adp-sc" style={{ display: "block" }}>
            <div className="adp-sc-n" style={{ fontSize: "20px" }}>
              {loading ? "…" : c.value ?? "—"}
            </div>
            <div className="adp-sc-l">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Visa Pipeline Summary */}
      <div style={{ background: "var(--a-surface,#f8f9fb)", border: "1px solid var(--a-bdr,#e5e7eb)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--a-muted)" }}>🛂 Visa Pipeline</span>
          <a href="/admin/visa-applications" style={{ fontSize: 12, color: "var(--a-gold,#d4a843)", fontWeight: 600 }}>View All →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Pending Review", value: stats?.visa.pending, color: "#B45309" },
            { label: "More Info Needed", value: stats?.visa.moreInfo, color: "#7C3AED" },
            { label: "Approved This Month", value: stats?.visa.approvedThisMonth, color: "#047857" },
            { label: "Received Today", value: stats?.visa.today, color: "var(--a-navy,#0A1930)" },
          ].map((v) => (
            <div key={v.label} style={{ background: "#fff", border: "1px solid var(--a-bdr,#e5e7eb)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: v.color }}>{loading ? "…" : v.value ?? "—"}</div>
              <div style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 2 }}>{v.label}</div>
            </div>
          ))}
        </div>
      </div>

{SECTION_GROUPS.map((grp) => (
        <div key={grp.group} className="adp-card" style={{ marginBottom: 16 }}>
          <div className="adp-ch"><h3>{grp.group}</h3></div>
          <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px" }}>
            {grp.items.map((s) => (
              <Link key={s.href} href={s.href} className="adp-sc" style={{ display: "block" }}>
                <div className="adp-sc-n" style={{ fontSize: "14px" }}>{s.title}</div>
                <div className="adp-sc-l">{s.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <DashboardInner />
      </AdminShell>
    </AdminGuard>
  );
}
