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
};

function pkr(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

const SECTIONS = [
  { href: "/admin/packages", title: "Packages", desc: "Umrah & tour packages" },
  { href: "/admin/direct-bookings", title: "Direct Bookings", desc: "Walk-in customer bookings, no agent" },
  { href: "/admin/visa-services", title: "Visa Services", desc: "Country visa listings" },
  { href: "/admin/group-flights", title: "Group Flights", desc: "Group ticket listings" },
  { href: "/admin/insurance", title: "Insurance", desc: "Companies, plans, rates" },
  { href: "/admin/blogs", title: "Blog", desc: "Articles & posts" },
  { href: "/admin/agents", title: "Agents", desc: "Agent accounts, commission rates" },
  { href: "/admin/agent-bookings", title: "Agent Bookings", desc: "Review & issue bookings" },
  { href: "/admin/payment-slips", title: "Payment Slips", desc: "Approve/reject agent payments" },
  { href: "/admin/finance", title: "Finance", desc: "Revenue, commission, agent balances" },
];

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

      <div className="adp-sg" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {SECTIONS.slice(0, 4).map((s) => (
          <Link key={s.href} href={s.href} className="adp-sc" style={{ display: "block" }}>
            <div className="adp-sc-n" style={{ fontSize: "15px" }}>{s.title}</div>
            <div className="adp-sc-l">{s.desc}</div>
          </Link>
        ))}
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>All Sections</h3></div>
        <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "10px" }}>
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="adp-btn adp-btn-t" style={{ justifyContent: "flex-start" }}>
              {s.title}
            </Link>
          ))}
        </div>
      </div>
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
