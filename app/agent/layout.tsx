import { AgentAuthProvider } from "@/lib/agentAuthClient";
import "./portal.css";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentAuthProvider>
      <div className="min-h-screen bg-[var(--bg)]">{children}</div>
    </AgentAuthProvider>
  );
}
