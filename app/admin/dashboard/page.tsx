"use client";

import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/lib/adminAuthClient";

const SECTIONS = [
  { href: "/admin/packages", title: "Packages", desc: "Umrah & tour packages" },
  { href: "/admin/visa-services", title: "Visa Services", desc: "Country visa listings" },
  { href: "/admin/group-flights", title: "Group Flights", desc: "Group ticket listings" },
  { href: "/admin/insurance", title: "Insurance", desc: "Companies, plans, rates" },
  { href: "/admin/blogs", title: "Blog", desc: "Articles & posts" },
  { href: "/admin/agents", title: "Agents", desc: "Agent accounts, commission rates" },
  { href: "/admin/agent-bookings", title: "Agent Bookings", desc: "Review & issue bookings" },
  { href: "/admin/payment-slips", title: "Payment Slips", desc: "Approve/reject agent payments" },
];

function DashboardInner() {
  const { admin } = useAdminAuth();

  return (
    <>
      <div className="adp-ph">
        <div>
          <h2>Welcome, <em>{admin?.email ?? "Admin"}</em></h2>
          <p>Manage packages, visas, flights, insurance, agents and content</p>
        </div>
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
