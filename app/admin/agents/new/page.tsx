"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

// Preview what the next Agent ID will look like
function useNextAgentCodePreview(accessToken: string | null, refresh: () => Promise<string | null>) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!accessToken) return;
    adminFetch("/api/admin/agents/next-code", accessToken, refresh)
      .then((r) => r.json())
      .then((d) => { if (d.agentCode) setPreview(d.agentCode); })
      .catch(() => {});
  }, [accessToken, refresh]);
  return preview;
}

const empty = { fullName: "", email: "", phone: "", password: "" };

function NewAgentInner() {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nextCode = useNextAgentCodePreview(accessToken, refresh);

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await adminFetch("/api/admin/agents", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not create agent."); return; }
    router.push("/admin/agents");
  }

  return (
    <>
      <div className="adp-ph">
        <div><h2>New <em>Agent</em></h2><p>Create a new agent account</p></div>
        <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>← Back</Link>
      </div>
      {error && <p style={{ color: "var(--a-red)", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

      <div className="adp-card">
        <div className="adp-ch"><h3>Agent Details</h3></div>
        <form onSubmit={createAgent} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>

          {/* Auto-generated Agent ID preview */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Agent ID <span style={{ color: "var(--a-muted)", fontSize: "11px" }}>(auto-generated)</span></label>
            <div style={{
              padding: "10px 14px",
              background: "var(--a-surface-2, #f7f7f7)",
              border: "1px solid var(--a-border)",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "0.08em",
              color: "var(--a-gold)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              {nextCode ?? "Loading…"}
              <span style={{ fontSize: "11px", fontFamily: "inherit", fontWeight: 400, color: "var(--a-muted)", letterSpacing: 0 }}>
                will be assigned on save
              </span>
            </div>
          </div>

          <div>
            <label>Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Muhammad Ali"
              required
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="agent@example.com"
              required
            />
          </div>

          <div>
            <label>Phone <span style={{ color: "var(--a-muted)", fontSize: "11px" }}>(optional)</span></label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="03001234567"
            />
          </div>

          <div>
            <label>Temporary Password <span style={{ color: "var(--a-muted)", fontSize: "11px" }}>(min 8 chars)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              placeholder="Agent will use this to first login"
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="adp-btn adp-btn-g" disabled={saving}>
              {saving ? "Creating…" : "Create Agent"}
            </button>
            <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}

export default function NewAgentPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <NewAgentInner />
      </AdminShell>
    </AdminGuard>
  );
}
