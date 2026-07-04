"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth } from "@/lib/agentAuthClient";

export default function AgentGuard({ children }: { children: React.ReactNode }) {
  const { agent, loading } = useAgentAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !agent) {
      router.replace("/agent/login");
    }
  }, [loading, agent, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">Loading…</div>;
  }
  if (!agent) return null;

  return <>{children}</>;
}
