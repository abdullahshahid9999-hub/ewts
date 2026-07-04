"use client";

import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
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
  const { admin, logout } = useAdminAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--navy)]">Admin Panel</h1>
          <p className="text-sm text-[var(--muted)]">{admin?.email}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-[var(--bdr)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--gold)]"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl border border-[var(--bdr)] bg-white p-6 shadow-sm transition hover:border-[var(--gold)]"
          >
            <h2 className="font-display text-lg text-[var(--navy)]">{s.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <DashboardInner />
    </AdminGuard>
  );
}
