"use client";

import { useEffect, useState, useCallback } from "react";
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

const newAgentEmpty = { agentCode: "", fullName: "", email: "", phone: "", password: "" };

function AgentsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState(newAgentEmpty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ balance: "", creditLimit: "", tier: "", status: "" });
  const [rateForm, setRateForm] = useState<{ agentId: string; serviceType: string; rateType: string; value: string }>({
    agentId: "", serviceType: "umrah", rateType: "percentage", value: "",
  });
  const [uploadingLogoId, setUploadingLogoId] = useState<string | null>(null);

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

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await adminFetch("/api/admin/agents", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAgent),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not create agent."); return; }
    setNewAgent(newAgentEmpty);
    load();
  }

  function startEdit(a: Agent) {
    setEditingId(a.id);
    setEditForm({ balance: String(a.balance), creditLimit: String(a.creditLimit), tier: a.tier, status: a.status });
  }

  async function saveEdit(id: string) {
    setError(null);
    const res = await adminFetch(`/api/admin/agents/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        balance: Number(editForm.balance),
        creditLimit: Number(editForm.creditLimit),
        tier: editForm.tier,
        status: editForm.status,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not update agent."); return; }
    setEditingId(null);
    load();
  }

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rateForm.agentId || !rateForm.value) { setError("Select an agent and enter a rate value."); return; }
    const res = await adminFetch(`/api/admin/agents/${rateForm.agentId}/commission-rates`, accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType: rateForm.serviceType, rateType: rateForm.rateType, value: Number(rateForm.value) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not set rate."); return; }
    setRateForm((f) => ({ ...f, value: "" }));
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Agent <em>Network</em></h2><p>Agent accounts, credit, and commission rates</p></div></div>
      {error && <p style={{ color: "var(--a-red)", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

      <div className="adp-card">
        <div className="adp-ch"><h3>New Agent</h3></div>
        <form onSubmit={createAgent} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div><label>Agent Code</label><input value={newAgent.agentCode} onChange={(e) => setNewAgent((f) => ({ ...f, agentCode: e.target.value }))} /></div>
          <div><label>Full Name</label><input value={newAgent.fullName} onChange={(e) => setNewAgent((f) => ({ ...f, fullName: e.target.value }))} /></div>
          <div><label>Email</label><input type="email" value={newAgent.email} onChange={(e) => setNewAgent((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><label>Phone</label><input value={newAgent.phone} onChange={(e) => setNewAgent((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label>Temporary Password (min 8 chars)</label><input value={newAgent.password} onChange={(e) => setNewAgent((f) => ({ ...f, password: e.target.value }))} /></div>
          <div style={{ gridColumn: "1 / -1" }}><button type="submit" className="adp-btn adp-btn-g">Create Agent</button></div>
        </form>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>Set Commission Rate</h3></div>
        <form onSubmit={saveRate} className="adp-fg" style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
          <select value={rateForm.agentId} onChange={(e) => setRateForm((f) => ({ ...f, agentId: e.target.value }))} style={{ width: "auto" }}>
            <option value="">Select agent…</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.agentCode} — {a.fullName}</option>)}
          </select>
          <select value={rateForm.serviceType} onChange={(e) => setRateForm((f) => ({ ...f, serviceType: e.target.value }))} style={{ width: "auto" }}>
            <option value="umrah">Umrah</option>
            <option value="group_ticket">Group Ticket</option>
            <option value="insurance">Insurance</option>
          </select>
          <select value={rateForm.rateType} onChange={(e) => setRateForm((f) => ({ ...f, rateType: e.target.value }))} style={{ width: "auto" }}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed (PKR)</option>
          </select>
          <input type="number" placeholder="Value" value={rateForm.value} onChange={(e) => setRateForm((f) => ({ ...f, value: e.target.value }))} style={{ width: "100px" }} />
          <button type="submit" className="adp-btn adp-btn-g">Save Rate</button>
        </form>
      </div>

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
                  {editingId === a.id ? (
                    <>
                      <td><input value={editForm.balance} onChange={(e) => setEditForm((f) => ({ ...f, balance: e.target.value }))} className="adp-si" style={{ width: "90px" }} /></td>
                      <td><input value={editForm.creditLimit} onChange={(e) => setEditForm((f) => ({ ...f, creditLimit: e.target.value }))} className="adp-si" style={{ width: "90px" }} /></td>
                      <td>
                        <select value={editForm.tier} onChange={(e) => setEditForm((f) => ({ ...f, tier: e.target.value }))} className="adp-ss">
                          <option value="standard">Standard</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                        </select>
                      </td>
                      <td>
                        <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="adp-ss">
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>PKR {a.balance.toLocaleString()}</td>
                      <td>PKR {a.creditLimit.toLocaleString()}</td>
                      <td className="capitalize">{a.tier}</td>
                      <td><span className={`adp-pill adp-p-${a.status}`}>{a.status}</span></td>
                    </>
                  )}
                  <td style={{ fontSize: "11px" }}>
                    {a.commissionRates.length === 0 ? "—" : a.commissionRates.map((r) => (
                      <div key={r.id}>{r.serviceType}: {r.rateType === "percentage" ? `${r.value}%` : `PKR ${r.value}`}</div>
                    ))}
                  </td>
                  <td>
                    {editingId === a.id ? (
                      <button onClick={() => saveEdit(a.id)} className="adp-btn adp-btn-s">Save</button>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => startEdit(a)} className="adp-btn adp-btn-s">Edit</button>
                        <a href={`/admin/agents/${a.id}`} className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>💰 Ledger</a>
                      </div>
                    )}
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
