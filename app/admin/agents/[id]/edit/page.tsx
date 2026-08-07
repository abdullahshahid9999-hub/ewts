"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type CommissionRate = { id: string; serviceType: string; rateType: string; value: number };
type Agent = {
  id: string; agentCode: string; fullName: string; email: string; phone: string | null;
  balance: number; creditLimit: number; tier: string; status: string;
  agencyName?: string | null; agencyAddress?: string | null;
  dtsLicense?: boolean; dtsLicenseNumber?: string | null;
  commissionRates: CommissionRate[];
};

const SERVICE_TYPES = [
  { value: "umrah", label: "Umrah" }, { value: "group_ticket", label: "Group Ticket" },
  { value: "insurance", label: "Insurance" }, { value: "world_tour", label: "World Tour" },
  { value: "visa_services", label: "Visa Services" },
];
const INP: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid var(--a-border)", borderRadius: 8, fontSize: 14 };

function EditAgentInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", balance: "", creditLimit: "", tier: "", status: "", agencyName: "", agencyAddress: "" });
  const [dtsLicense, setDtsLicense] = useState(false);
  const [dtsNumber, setDtsNumber] = useState("");
  const [rateForm, setRateForm] = useState({ serviceType: "umrah", rateType: "percentage", value: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/agents", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    const found: Agent | undefined = (data.agents ?? []).find((a: Agent) => a.id === id);
    if (found) {
      setAgent(found);
      setForm({ fullName: found.fullName, phone: found.phone ?? "", balance: String(found.balance), creditLimit: String(found.creditLimit), tier: found.tier, status: found.status, agencyName: found.agencyName ?? "", agencyAddress: found.agencyAddress ?? "" });
      setDtsLicense(found.dtsLicense ?? false);
      setDtsNumber(found.dtsLicenseNumber ?? "");
    } else { setError("Agent not found."); }
    setLoading(false);
  }, [id, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function saveAgent(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSaving(true);
    const res = await adminFetch(`/api/admin/agents/${id}`, accessToken, refresh, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, balance: Number(form.balance), creditLimit: Number(form.creditLimit), dtsLicense, dtsLicenseNumber: dtsLicense ? dtsNumber : "" }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not update."); return; }
    router.push("/admin/agents");
  }

  async function saveRate(e: React.FormEvent) {
    e.preventDefault(); if (!rateForm.value) { setError("Enter a value."); return; }
    setError(null);
    const res = await adminFetch(`/api/admin/agents/${id}/commission-rates`, accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType: rateForm.serviceType, rateType: rateForm.rateType, value: Number(rateForm.value) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not set rate."); return; }
    setRateForm((f) => ({ ...f, value: "" })); load();
  }

  if (loading) return <p className="etd">Loading…</p>;
  if (!agent) return <p className="etd">{error ?? "Agent not found."}</p>;

  return (
    <>
      <div className="adp-ph">
        <div><h2>Edit <em>{agent.agentCode}</em></h2><p>{agent.fullName}</p></div>
        <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>← Back</Link>
      </div>
      {error && <p style={{ color: "var(--a-red)", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <div className="adp-card" style={{ marginBottom: 16 }}>
        <div className="adp-ch"><h3>Basic Information</h3></div>
        <form onSubmit={saveAgent} style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
          <div><label>Full Name</label><input style={INP} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></div>
          <div><label>Phone</label><input style={INP} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div><label>Balance (PKR)</label><input style={INP} value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))} /></div>
          <div><label>Credit Limit (PKR)</label><input style={INP} value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} /></div>
          <div>
            <label>Tier</label>
            <select style={INP} value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
              <option value="standard">Standard</option><option value="silver">Silver</option><option value="gold">Gold</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select style={INP} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option><option value="suspended">Suspended</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}><label>Agency Name</label><input style={INP} value={form.agencyName} onChange={(e) => setForm((f) => ({ ...f, agencyName: e.target.value }))} placeholder="e.g. Al-Noor Travels" /></div>
          <div style={{ gridColumn: "1 / -1" }}><label>Agency Address</label><textarea style={{ ...INP, resize: "vertical", minHeight: 64 }} value={form.agencyAddress} onChange={(e) => setForm((f) => ({ ...f, agencyAddress: e.target.value }))} /></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>DTS License</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setDtsLicense(v)}
                  style={{ padding: "7px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "2px solid", borderColor: dtsLicense === v ? "var(--a-gold)" : "var(--a-border)", background: dtsLicense === v ? "var(--a-gold)" : "transparent", color: dtsLicense === v ? "#fff" : "var(--a-text)" }}>
                  {v ? "✓ Yes" : "✗ No"}
                </button>
              ))}
            </div>
          </div>
          {dtsLicense && (
            <div style={{ gridColumn: "1 / -1" }}><label>DTS License Number</label><input style={INP} value={dtsNumber} onChange={(e) => setDtsNumber(e.target.value)} placeholder="DTS-2024-00123" /></div>
          )}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="adp-btn adp-btn-g" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            <Link href="/admin/agents" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>Cancel</Link>
          </div>
        </form>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>Commission Rates</h3></div>
        <form onSubmit={saveRate} style={{ padding: "16px 18px", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
          <select value={rateForm.serviceType} onChange={(e) => setRateForm((f) => ({ ...f, serviceType: e.target.value }))} style={{ width: "auto" }}>
            {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={rateForm.rateType} onChange={(e) => setRateForm((f) => ({ ...f, rateType: e.target.value }))} style={{ width: "auto" }}>
            <option value="percentage">%</option><option value="fixed">PKR</option>
          </select>
          <input type="number" placeholder="Value" value={rateForm.value} onChange={(e) => setRateForm((f) => ({ ...f, value: e.target.value }))} style={{ width: 100 }} />
          <button type="submit" className="adp-btn adp-btn-g">Set Rate</button>
        </form>
        <div style={{ padding: "0 18px 16px", fontSize: 12 }}>
          {agent.commissionRates.length === 0 ? <span className="etd">No rates set.</span> : agent.commissionRates.map((r) => (
            <div key={r.id} style={{ padding: "4px 0", borderBottom: "1px solid var(--a-border)" }}>
              {SERVICE_TYPES.find((s) => s.value === r.serviceType)?.label ?? r.serviceType}: {r.rateType === "percentage" ? `${r.value}%` : `PKR ${r.value}`}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function EditAgentPage() {
  return <AdminGuard><AdminShell><EditAgentInner /></AdminShell></AdminGuard>;
}
