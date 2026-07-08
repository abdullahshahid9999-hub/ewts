"use client";

import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth } from "@/lib/agentAuthClient";

function DashboardInner() {
  const { agent } = useAgentAuth();

  return (
    <>
      <div className="ap-ph">
        <div>
          <h2>Welcome back, <span>{agent?.fullName ?? "Agent"}</span></h2>
          <p>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <a
          href="https://wa.me/923336515349"
          target="_blank"
          rel="noopener noreferrer"
          className="ap-btn"
          style={{ background: "var(--green)", color: "#fff" }}
        >
          Contact East &amp; West
        </a>
      </div>

      <div className="ap-sg">
        <div className="ap-sc">
          <div className="ap-sc-n">{agent ? `PKR ${Number(agent.balance).toLocaleString()}` : "—"}</div>
          <div className="ap-sc-l">Account Balance</div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-n">{agent ? `PKR ${Number(agent.creditLimit).toLocaleString()}` : "—"}</div>
          <div className="ap-sc-l">Credit Limit</div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-n">{agent?.tier ?? "—"}</div>
          <div className="ap-sc-l">Agent Tier</div>
        </div>
        <div className="ap-sc">
          <div className="ap-sc-n">{agent?.agentCode ?? "—"}</div>
          <div className="ap-sc-l">Agent Code</div>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-ch">
          <h3>Quick Links</h3>
        </div>
        <div style={{ padding: "16px 18px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link href="/agent/bookings/new" className="ap-btn ap-btn-gold">New Booking</Link>
          <Link href="/agent/bookings" className="ap-btn ap-btn-ghost">My Bookings</Link>
          <Link href="/agent/profile" className="ap-btn ap-btn-ghost">My Profile</Link>
        </div>
      </div>
    </>
  );
}

export default function AgentDashboardPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <DashboardInner />
      </AgentShell>
    </AgentGuard>
  );
}
