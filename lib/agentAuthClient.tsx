"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type Agent = {
  id: string;
  agentCode: string;
  fullName: string;
  email: string;
  tier: string;
  balance: number;
  creditLimit: number;
};

type AgentAuthContextValue = {
  agent: Agent | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
};

const AgentAuthContext = createContext<AgentAuthContextValue | null>(null);

// Access token is kept in React state only (never localStorage/sessionStorage
// — browser storage is not available in this environment and, more
// importantly, tokens in localStorage are readable by any injected script).
// The refresh token lives in an httpOnly cookie set by the API route, so a
// silent refresh on page load re-establishes the session.
export function AgentAuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tryRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) {
        setAgent(null);
        setAccessToken(null);
        return null;
      }
      const data = await res.json();
      setAccessToken(data.accessToken ?? null);
      setAgent(data.agent ?? null);
      return data.accessToken ?? null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tryRefresh();
  }, [tryRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/agent/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return data?.error ?? "Login failed.";
    }
    setAccessToken(data.accessToken);
    setAgent(data.agent);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/agent/logout", { method: "POST", credentials: "include" });
    setAgent(null);
    setAccessToken(null);
  }, []);

  return (
    <AgentAuthContext.Provider value={{ agent, accessToken, loading, login, logout, refresh: tryRefresh }}>
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  const ctx = useContext(AgentAuthContext);
  if (!ctx) throw new Error("useAgentAuth must be used inside AgentAuthProvider");
  return ctx;
}

// Helper for authenticated fetches from agent pages: attaches the bearer
// token and retries once after a silent refresh if the token expired.
export async function agentFetch(
  url: string,
  accessToken: string | null,
  refresh: () => Promise<string | null>,
  init: RequestInit = {}
): Promise<Response> {
  const doFetch = (token: string | null) =>
    fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await doFetch(accessToken);
  if (res.status === 401) {
    const newToken = await refresh();
    res = await doFetch(newToken);
  }
  return res;
}
