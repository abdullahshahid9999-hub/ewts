"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Notification = { id: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

export default function AgentNotificationBell() {
  const { accessToken, refresh } = useAgentAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await agentFetch("/api/agent/notifications", accessToken, refresh);
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }, [accessToken, refresh]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // poll every 30s — simple, no websocket infra needed
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    setUnreadCount(0);
    setNotifications((n) => n.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    await agentFetch("/api/agent/notifications", accessToken, refresh, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }),
    });
  }

  async function markOneRead(id: string) {
    await agentFetch("/api/agent/notifications", accessToken, refresh, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
  }

  function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{ position: "relative", width: 34, height: 34, borderRadius: 8, border: "1px solid var(--bdr)", background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: 42, width: 320, maxHeight: 400, overflowY: "auto", background: "var(--white)", border: "1px solid var(--bdr)", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.15)", zIndex: 100 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--bdr)" }}>
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>No notifications yet.</p>
          ) : (
            notifications.map((n) => {
              const inner = (
                <div
                  onClick={() => { if (!n.readAt) markOneRead(n.id); setOpen(false); }}
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--bdr)", background: n.readAt ? "transparent" : "rgba(212,168,67,0.08)", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: n.readAt ? 500 : 700 }}>{n.title}</span>
                    <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  {n.body && <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{n.body}</p>}
                </div>
              );
              return n.link ? <Link key={n.id} href={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>;
            })
          )}
        </div>
      )}
    </div>
  );
}
