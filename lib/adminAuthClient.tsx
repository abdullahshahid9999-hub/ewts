"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type Admin = {
  id: string;
  fullName: string | null;
  email: string;
};

type AdminAuthContextValue = {
  admin: Admin | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// Access token is kept in React state only (never localStorage/sessionStorage
// — browser storage is not available in this environment and, more
// importantly, tokens in localStorage are readable by any injected script).
// The refresh token lives in an httpOnly cookie set by the API route, so a
// silent refresh on page load re-establishes the session.
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const tryRefresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/refresh", { method: "POST", credentials: "include" });
      if (!res.ok) {
        setAdmin(null);
        setAccessToken(null);
        return null;
      }
      const data = await res.json();
      setAccessToken(data.accessToken ?? null);
      setAdmin(data.admin ?? null);
      return data.accessToken ?? null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tryRefresh();
  }, [tryRefresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/admin/login", {
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
    setAdmin(data.admin);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAdmin(null);
    setAccessToken(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, accessToken, loading, login, logout, refresh: tryRefresh }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}

// Helper for authenticated fetches from admin pages: attaches the bearer
// token and retries once after a silent refresh if the token expired.
export async function adminFetch(
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
