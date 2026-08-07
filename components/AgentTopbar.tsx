"use client";

import { useAgentAuth } from "@/lib/agentAuthClient";
import AgentNotificationBell from "@/components/AgentNotificationBell";

export default function AgentTopbar({ onMenuToggle, dark, onToggleDark }: { onMenuToggle: () => void; dark?: boolean; onToggleDark?: () => void }) {
  const { agent, subUser, logout } = useAgentAuth();
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
      {subUser && (
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, padding:"3px 10px", borderRadius:20, background:"rgba(184,142,62,0.12)", border:"1px solid rgba(184,142,62,0.3)", color:"#9C7E3A", maxWidth:200, overflow:"hidden" }}>
          <span style={{ fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{subUser.fullName}</span>
          {subUser.designation && <span style={{ opacity:0.7, whiteSpace:"nowrap" }}>· {subUser.designation}</span>}
        </div>
      )}
      <div className="ap-tbar-bal">
        <span className="ap-tbar-bal-label">Balance</span>
        <span className={`ap-tbar-bal-amt ${balance < 0 ? "neg" : ""}`}>
          {balance < 0 ? "-" : ""}PKR {Math.abs(balance).toLocaleString()}
        </span>
      </div>
      <AgentNotificationBell />
      {onToggleDark && (
        <button className={`ap-dark-toggle${dark ? " on" : ""}`} onClick={onToggleDark} aria-label="Toggle dark mode" title={dark ? "Light mode" : "Dark mode"} />
      )}
      <button onClick={logout} className="ap-tbar-signout">
        Sign Out
      </button>
    </div>
  );
}
