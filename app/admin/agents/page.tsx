"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

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

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/agents", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
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
                  <td>{a.fullName}</td>
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
                      <button onClick={() => startEdit(a)} className="adp-btn adp-btn-s">Edit</button>
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
