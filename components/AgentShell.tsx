"use client";

import { useState } from "react";
import AgentSidebar from "./AgentSidebar";
import AgentTopbar from "./AgentTopbar";

export default function AgentShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="ap-body flex">
      <AgentSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AgentTopbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
      <main className="ap-main w-full">{children}</main>
    </div>
  );
}
