"use client";

import { useState, useEffect } from "react";
import AgentSidebar from "./AgentSidebar";
import AgentTopbar from "./AgentTopbar";

export default function AgentShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  // Persist preference
  useEffect(() => {
    try { setDark(localStorage.getItem("ap-dark") === "1"); } catch {}
  }, []);

  function toggleDark() {
    setDark(d => {
      const next = !d;
      try { localStorage.setItem("ap-dark", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  return (
    <div className={`ap-body flex${dark ? " ap-dark" : ""}`}>
      <AgentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dark={dark} onToggleDark={toggleDark} />
      <AgentTopbar onMenuToggle={() => setSidebarOpen(o => !o)} dark={dark} onToggleDark={toggleDark} />
      <main className="ap-main w-full">{children}</main>
    </div>
  );
}
