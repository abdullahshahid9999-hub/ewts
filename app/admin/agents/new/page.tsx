"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

const empty = { agentCode: "", fullName: "", email: "", phone: "", password: "" };

function NewAgentInner() {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>← Back to Agents</Link>
      </div>
      {error && <p style={{ color: "var(--a-red)", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

      <div className="adp-card">
        <div className="adp-ch"><h3>Agent Details</h3></div>
        <form onSubmit={createAgent} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div><label>Agent Code</label><input value={form.agentCode} onChange={(e) => setForm((f) => ({ ...f, agentCode: e.target.value }))} required /></div>
          <div><label>Full Name</label><input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required /></div>
          <div><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></div>
          <div><label>Phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Temporary Password (min 8 chars)</label>
            <input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="adp-btn adp-btn-g" disabled={saving}>{saving ? "Creating…" : "Create Agent"}</button>
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
