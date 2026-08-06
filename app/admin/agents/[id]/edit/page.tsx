"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

function EditAgentInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", balance: "", creditLimit: "", tier: "", status: "" });
  const [rateForm, setRateForm] = useState({ serviceType: "umrah", rateType: "percentage", value: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/agents", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    const found: Agent | undefined = (data.agents ?? []).find((a: Agent) => a.id === id);
    if (found) {
      setAgent(found);
      setForm({
        fullName: found.fullName,
        phone: found.phone ?? "",
        balance: String(found.balance),
        creditLimit: String(found.creditLimit),
        tier: found.tier,
        status: found.status,
      });
    } else {
      setError("Agent not found.");
    }
    setLoading(false);
  }, [id, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function saveAgent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await adminFetch(`/api/admin/agents/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        phone: form.phone,
        balance: Number(form.balance),
        creditLimit: Number(form.creditLimit),
        tier: form.tier,
        status: form.status,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not update agent."); return; }
    router.push("/admin/agents");
  }

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    if (!rateForm.value) { setError("Enter a rate value."); return; }
    setError(null);
    const res = await adminFetch(`/api/admin/agents/${id}/commission-rates`, accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType: rateForm.serviceType, rateType: rateForm.rateType, value: Number(rateForm.value) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not set rate."); return; }
    setRateForm((f) => ({ ...f, value: "" }));
    load();
  }

  if (loading) return <p className="etd">Loading…</p>;
  if (!agent) return <p className="etd">{error ?? "Agent not found."}</p>;

  return (
    <>
      <div className="adp-ph">
        <div><h2>Edit <em>{agent.agentCode}</em></h2><p>{agent.fullName}</p></div>
        <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>← Back to Agents</Link>
      </div>
      {error && <p style={{ color: "var(--a-red)", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}

      <div className="adp-card">
        <div className="adp-ch"><h3>Agent Details</h3></div>
        <form onSubmit={saveAgent} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div><label>Full Name</label><input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
          <div><label>Phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div><label>Balance (PKR)</label><input value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))} /></div>
          <div><label>Credit Limit (PKR)</label><input value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} /></div>
          <div>
            <label>Tier</label>
            <select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
              <option value="standard">Standard</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="suspended">Suspended (Deactivated)</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="adp-btn adp-btn-g" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>Cancel</Link>
          </div>
        </form>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>Commission Rates</h3></div>
        <form onSubmit={saveRate} style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
          <select value={rateForm.serviceType} onChange={(e) => setRateForm((f) => ({ ...f, serviceType: e.target.value }))} style={{ width: "auto" }}>
            <option value="umrah">Umrah</option>
            <option value="group_ticket">Group Ticket</option>
            <option value="insurance">Insurance</option>
            <option value="world_tour">World Tour</option>
            <option value="visa_services">Visa Services</option>
          </select>
          <select value={rateForm.rateType} onChange={(e) => setRateForm((f) => ({ ...f, rateType: e.target.value }))} style={{ width: "auto" }}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed (PKR)</option>
          </select>
          <input type="number" placeholder="Value" value={rateForm.value} onChange={(e) => setRateForm((f) => ({ ...f, value: e.target.value }))} style={{ width: "100px" }} />
          <button type="submit" className="adp-btn adp-btn-g">Save Rate</button>
        </form>
        <div style={{ padding: "0 18px 16px", fontSize: "12px" }}>
          {agent.commissionRates.length === 0 ? <span className="etd">No rates set.</span> : agent.commissionRates.map((r) => (
            <div key={r.id}>{r.serviceType}: {r.rateType === "percentage" ? `${r.value}%` : `PKR ${r.value}`}</div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function EditAgentPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <EditAgentInner />
      </AdminShell>
    </AdminGuard>
  );
}
