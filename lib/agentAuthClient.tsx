"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type Agent = { id: string; agentCode: string; fullName: string; email: string; tier: string; balance: number; creditLimit: number; logoUrl?: string | null };
export type SubUserInfo = { id: string; fullName: string; email: string; designation: string | null; permissions: Record<string, boolean> };

type AgentAuthContextValue = {
  agent: Agent | null;
  subUser: SubUserInfo | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<string | null>;
  loginAsSubUser: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  can: (permission: string) => boolean;
};

const AgentAuthContext = createContext<AgentAuthContextValue | null>(null);

export function AgentAuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [subUser, setSubUser] = useState<SubUserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tryRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) { setAgent(null); setSubUser(null); setAccessToken(null); return null; }
      const data = await res.json();
      setAccessToken(data.accessToken ?? null);
      setAgent(data.agent ?? null);
      setSubUser(data.subUser ?? null);
      return data.accessToken ?? null;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { tryRefresh(); }, [tryRefresh]);

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    const res = await fetch("/api/agent/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password, ...(totpCode ? { totpCode } : {}) }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.requires2FA) return "__2FA_REQUIRED__";
    if (!res.ok) return data?.error ?? "Login failed.";
    setAccessToken(data.accessToken); setAgent(data.agent); setSubUser(null);
    if (typeof window !== "undefined") {
      data.mustChangePassword ? sessionStorage.setItem("agent_must_change_pw", "1") : sessionStorage.removeItem("agent_must_change_pw");
    }
    return null;
  }, []);

  const loginAsSubUser = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/agent/sub-user-login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email, password }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data?.error ?? "Login failed.";
    setAccessToken(data.accessToken); setAgent(data.agent); setSubUser(data.subUser ?? null);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/agent/logout", { method: "POST", credentials: "include" });
    setAgent(null); setSubUser(null); setAccessToken(null);
  }, []);

  const can = useCallback((permission: string) => {
    if (!subUser) return true;
    return !!subUser.permissions[permission];
  }, [subUser]);

  return (
    <AgentAuthContext.Provider value={{ agent, subUser, accessToken, loading, login, loginAsSubUser, logout, refresh: tryRefresh, can }}>
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  const ctx = useContext(AgentAuthContext);
  if (!ctx) throw new Error("useAgentAuth must be used inside AgentAuthProvider");
  return ctx;
}

export async function agentFetch(url: string, accessToken: string | null, refresh: () => Promise<string | null>, init: RequestInit = {}): Promise<Response> {
  const doFetch = (token: string | null) => fetch(url, { ...init, credentials: "include", headers: { ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  let res = await doFetch(accessToken);
  if (res.status === 401) { const t = await refresh(); res = await doFetch(t); }
  return res;
}
