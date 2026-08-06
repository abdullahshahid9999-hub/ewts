"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type CommissionRate = { id: string; serviceType: string; rateType: string; value: number };
type Agent = {
  id: string;
  agentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  balance: number;
  creditLimit: number;
  tier: string;
  status: string;
  logoUrl: string | null;
  commissionRates: CommissionRate[];
};

function AgentsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function uploadLogo(agentId: string, file: File) {
    setUploadingLogoId(agentId);
    setError(null);
    const compressed = await compressImage(file);
    const form = new FormData();
    form.set("logo", compressed);
    const res = await adminFetch(`/api/admin/agents/${agentId}/logo`, accessToken, refresh, { method: "PATCH", body: form });
    const data = await res.json().catch(() => ({}));
    setUploadingLogoId(null);
    if (!res.ok) { setError(data.error ?? "Could not upload logo."); return; }
    load();
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/agents", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not load agents.");
      setAgents([]);
      setLoading(false);
      return;
    }
    setAgents(data.agents ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  // Quick one-click deactivate/activate — no need to open the full edit
  // page just to stop an agent from being able to book/login.
  async function toggleStatus(a: Agent) {
    const nextStatus = a.status === "active" ? "suspended" : "active";
    if (nextStatus === "suspended" && !confirm(`Deactivate ${a.fullName}? They won't be able to log in or book until reactivated.`)) return;
    setTogglingId(a.id);
    setError(null);
    const res = await adminFetch(`/api/admin/agents/${a.id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json().catch(() => ({}));
    setTogglingId(null);
    if (!res.ok) { setError(data.error ?? "Could not update status."); return; }
    load();
  }

  return (
    <>
      <div className="adp-ph">
        <div><h2>Agent <em>Network</em></h2><p>Agent accounts, credit, and commission rates</p></div>
        <Link href="/admin/agents/new" className="adp-btn adp-btn-g" style={{ textDecoration: "none" }}>+ New Agent</Link>
      </div>
      {error && <p style={{ color: "var(--a-red)", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

      <div className="adp-card">
        <div className="adp-tw">
        {loading ? (
          <p className="etd">Loading…</p>
        ) : (
          <table className="adp-table">
            <thead>
              <tr>
                <th>Code</th><th>Name</th>
                <th>Balance</th><th>Credit Limit</th>
                <th>Tier</th><th>Status</th>
                <th>Rates</th><th></th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.agentCode}</strong></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {a.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.logoUrl} alt={a.fullName} style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 4, border: "1px solid var(--a-border)" }} />
                      ) : (
                        <span style={{ width: 28, height: 28, borderRadius: 4, background: "var(--a-surface-2, #f2f2f2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--a-muted)" }}>—</span>
                      )}
                      <span>{a.fullName}</span>
                    </div>
                    <label style={{ fontSize: 10, color: "var(--a-gold)", cursor: "pointer", marginTop: 2, display: "inline-block" }}>
                      {uploadingLogoId === a.id ? "Uploading…" : a.logoUrl ? "Change logo" : "Upload logo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(a.id, f); e.target.value = ""; }}
                      />
                    </label>
                  </td>
                  <td>PKR {a.balance.toLocaleString()}</td>
                  <td>PKR {a.creditLimit.toLocaleString()}</td>
                  <td className="capitalize">{a.tier}</td>
                  <td><span className={`adp-pill adp-p-${a.status}`}>{a.status}</span></td>
                  <td style={{ fontSize: "11px" }}>
                    {a.commissionRates.length === 0 ? "—" : a.commissionRates.map((r) => (
                      <div key={r.id}>{r.serviceType}: {r.rateType === "percentage" ? `${r.value}%` : `PKR ${r.value}`}</div>
                    ))}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Link href={`/admin/agents/${a.id}/edit`} className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>Edit</Link>
                      <Link href={`/admin/agents/${a.id}`} className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>💰 Ledger</Link>
                      <button
                        onClick={() => toggleStatus(a)}
                        disabled={togglingId === a.id}
                        className="adp-btn adp-btn-r"
                        title={a.status === "active" ? "Deactivate this agent" : "Reactivate this agent"}
                      >
                        {togglingId === a.id ? "…" : a.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </>
  );
}

export default function AdminAgentsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <AgentsInner />
      </AdminShell>
    </AdminGuard>
  );
}
