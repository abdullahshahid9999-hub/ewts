"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Agents</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="mt-6 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <h2 className="font-display text-lg text-[var(--navy)]">New Agent</h2>
        <form onSubmit={createAgent} className="mt-3 grid gap-2 sm:grid-cols-2">
          <input placeholder="Agent code" value={newAgent.agentCode} onChange={(e) => setNewAgent((f) => ({ ...f, agentCode: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <input placeholder="Full name" value={newAgent.fullName} onChange={(e) => setNewAgent((f) => ({ ...f, fullName: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <input placeholder="Email" type="email" value={newAgent.email} onChange={(e) => setNewAgent((f) => ({ ...f, email: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <input placeholder="Phone" value={newAgent.phone} onChange={(e) => setNewAgent((f) => ({ ...f, phone: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
          <input placeholder="Temporary password (min 8 chars)" type="text" value={newAgent.password} onChange={(e) => setNewAgent((f) => ({ ...f, password: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="sm:col-span-2 rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white">Create agent</button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <h2 className="font-display text-lg text-[var(--navy)]">Set Commission Rate</h2>
        <form onSubmit={saveRate} className="mt-3 flex flex-wrap gap-2">
          <select value={rateForm.agentId} onChange={(e) => setRateForm((f) => ({ ...f, agentId: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
            <option value="">Select agent…</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.agentCode} — {a.fullName}</option>)}
          </select>
          <select value={rateForm.serviceType} onChange={(e) => setRateForm((f) => ({ ...f, serviceType: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
            <option value="umrah">Umrah</option>
            <option value="group_ticket">Group Ticket</option>
            <option value="insurance">Insurance</option>
          </select>
          <select value={rateForm.rateType} onChange={(e) => setRateForm((f) => ({ ...f, rateType: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed (PKR)</option>
          </select>
          <input type="number" placeholder="Value" value={rateForm.value} onChange={(e) => setRateForm((f) => ({ ...f, value: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm w-28" />
          <button type="submit" className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white">Save rate</button>
        </form>
      </section>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Code</th><th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Balance</th><th className="px-4 py-3">Credit Limit</th>
                <th className="px-4 py-3">Tier</th><th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rates</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-[var(--bdr)] last:border-0 align-top">
                  <td className="px-4 py-3 font-medium">{a.agentCode}</td>
                  <td className="px-4 py-3">{a.fullName}</td>
                  {editingId === a.id ? (
                    <>
                      <td className="px-4 py-3"><input value={editForm.balance} onChange={(e) => setEditForm((f) => ({ ...f, balance: e.target.value }))} className="w-24 rounded border border-[var(--bdr)] px-2 py-1 text-sm" /></td>
                      <td className="px-4 py-3"><input value={editForm.creditLimit} onChange={(e) => setEditForm((f) => ({ ...f, creditLimit: e.target.value }))} className="w-24 rounded border border-[var(--bdr)] px-2 py-1 text-sm" /></td>
                      <td className="px-4 py-3">
                        <select value={editForm.tier} onChange={(e) => setEditForm((f) => ({ ...f, tier: e.target.value }))} className="rounded border border-[var(--bdr)] px-2 py-1 text-sm">
                          <option value="standard">Standard</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="rounded border border-[var(--bdr)] px-2 py-1 text-sm">
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">PKR {a.balance.toLocaleString()}</td>
                      <td className="px-4 py-3">PKR {a.creditLimit.toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize">{a.tier}</td>
                      <td className="px-4 py-3 capitalize">{a.status}</td>
                    </>
                  )}
                  <td className="px-4 py-3 text-xs">
                    {a.commissionRates.length === 0 ? "—" : a.commissionRates.map((r) => (
                      <div key={r.id}>{r.serviceType}: {r.rateType === "percentage" ? `${r.value}%` : `PKR ${r.value}`}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === a.id ? (
                      <button onClick={() => saveEdit(a.id)} className="text-[var(--navy)] underline">Save</button>
                    ) : (
                      <button onClick={() => startEdit(a)} className="text-[var(--navy)] underline">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminAgentsPage() {
  return (
    <AdminGuard>
      <AgentsInner />
    </AdminGuard>
  );
}
