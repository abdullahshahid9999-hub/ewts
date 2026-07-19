"use client";

import { useAgentAuth } from "@/lib/agentAuthClient";

export default function AgentTopbar({ onMenuToggle, dark, onToggleDark }: { onMenuToggle: () => void; dark?: boolean; onToggleDark?: () => void }) {
  const { agent, logout } = useAgentAuth();
  const balance = agent ? Number(agent.balance ?? 0) : 0;

  return (
    <div className="ap-tbar">
      <button
        onClick={onMenuToggle}
        className="mr-auto hidden max-[900px]:flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--bdr)] bg-white text-sm"
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <div className="ap-tbar-bal">
        <span className="ap-tbar-bal-label">Balance</span>
        <span className={`ap-tbar-bal-amt ${balance < 0 ? "neg" : ""}`}>
          {balance < 0 ? "-" : ""}PKR {Math.abs(balance).toLocaleString()}
        </span>
      </div>
      {onToggleDark && (
        <button className={`ap-dark-toggle${dark ? " on" : ""}`} onClick={onToggleDark} aria-label="Toggle dark mode" title={dark ? "Light mode" : "Dark mode"} />
      )}
      <button onClick={logout} className="ap-sb-out" style={{ width: "auto", padding: "6px 12px" }}>
        Sign Out
      </button>
    </div>
  );
}
