"use client";

import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import { useAgentAuth } from "@/lib/agentAuthClient";

function DashboardInner() {
  const { agent, logout } = useAgentAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--navy)]">
            Welcome, {agent?.fullName}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Agent code {agent?.agentCode} · Tier {agent?.tier}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-[var(--bdr)] px-4 py-2 text-sm text-[var(--text)] hover:border-[var(--gold)]"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/agent/bookings"
          className="rounded-2xl border border-[var(--bdr)] bg-white p-6 shadow-sm transition hover:border-[var(--gold)]"
        >
          <h2 className="font-display text-lg text-[var(--navy)]">My Bookings</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            View and manage Umrah, group ticket, and insurance bookings.
          </p>
        </Link>
      </div>

      <p className="mt-6 text-xs text-[var(--muted)]">
        Balance, credit limit, and tier are managed by the office — contact
        admin for changes.
      </p>
    </div>
  );
}

export default function AgentDashboardPage() {
  return (
    <AgentGuard>
      <DashboardInner />
    </AgentGuard>
  );
}
