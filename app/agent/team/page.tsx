"use client";
import { useEffect, useState, useCallback } from "react";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Perm = "canCreateBookings"|"canViewBookings"|"canSubmitPaymentSlip"|"canViewLedger"|"canManageSavedClients"|"canViewNotifications";
type SubUser = { id: string; fullName: string; email: string; phone: string|null; designation: string|null; status: string; permissions: Record<Perm,boolean> };

const PERM_LABELS: Record<Perm, { label: string; desc: string }> = {
  canCreateBookings:    { label: "Create Bookings",      desc: "Umrah, Tours, Flights, Visa, Insurance book kar sake" },
  canViewBookings:      { label: "View Bookings",        desc: "Agency ki saari bookings dekh sake" },
  canSubmitPaymentSlip: { label: "Submit Payment Slips", desc: "Top-up request submit kar sake" },
  canViewLedger:        { label: "View Ledger",          desc: "Balance aur transactions dekh sake" },
  canManageSavedClients:{ label: "Saved Clients",        desc: "Client profiles manage kar sake" },
  canViewNotifications: { label: "Notifications",        desc: "Agency notifications dekh sake" },
};
const DEF: Record<Perm,boolean> = { canCreateBookings:true, canViewBookings:true, canSubmitPaymentSlip:true, canViewLedger:true, canManageSavedClients:true, canViewNotifications:true };

function PermRow({ perms, setPerms }: { perms: Record<Perm,boolean>; setPerms: (p: Record<Perm,boolean>) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 8, marginBottom: 16 }}>
      {(Object.keys(PERM_LABELS) as Perm[]).map(k => (
        <label key={k} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--bdr)", cursor: "pointer", background: perms[k] ? "rgba(184,142,62,0.06)" : "transparent" }}>
          <input type="checkbox" checked={!!perms[k]} onChange={e => setPerms({ ...perms, [k]: e.target.checked })} style={{ marginTop: 2, accentColor: "var(--gold)" }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{PERM_LABELS[k].label}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{PERM_LABELS[k].desc}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function TeamInner() {
  const { accessToken, refresh, agent, subUser } = useAgentAuth();
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newU, setNewU] = useState({ fullName: "", email: "", phone: "", designation: "", password: "" });
  const [newPerms, setNewPerms] = useState<Record<Perm,boolean>>({ ...DEF });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [editPerms, setEditPerms] = useState<Record<Perm,boolean>>({ ...DEF });
  const [msg, setMsg] = useState<{ text: string; ok: boolean }|null>(null);

  // Only main agent (owner) can access this page — sub-users cannot manage other sub-users
  const isOwner = !subUser;
  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const load = useCallback(async () => {
    if (!agent?.id) return;
    setLoading(true);
    const res = await agentFetch(`/api/agent/team`, accessToken, refresh);
    const d = await res.json().catch(() => ({}));
    setSubUsers(d.subUsers ?? []);
    setLoading(false);
  }, [agent?.id, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function createMember(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await agentFetch("/api/agent/team", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newU, permissions: newPerms }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) { flash("Staff member created ✓"); setNewU({ fullName: "", email: "", phone: "", designation: "", password: "" }); setNewPerms({ ...DEF }); setShowNew(false); load(); }
    else flash(d.error ?? "Error", false);
  }

  async function toggleStatus(u: SubUser) {
    const next = u.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !confirm(`Deactivate ${u.fullName}? They won't be able to log in.`)) return;
    await agentFetch(`/api/agent/team/${u.id}`, accessToken, refresh, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    load();
  }

  async function savePerms(userId: string) {
    const res = await agentFetch(`/api/agent/team/${userId}`, accessToken, refresh, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: editPerms }) });
    res.ok ? (flash("Permissions saved ✓"), setEditId(null), load()) : flash("Error saving permissions", false);
  }

  async function deleteMember(u: SubUser) {
    if (!confirm(`Permanently delete ${u.fullName}?`)) return;
    await agentFetch(`/api/agent/team/${u.id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  if (!isOwner) {
    return (
      <div className="ap-card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h3 style={{ fontWeight: 700 }}>Owner Access Only</h3>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Only the main agency owner account can manage staff members.</p>
      </div>
    );
  }

  return (<>
    <div className="ap-ph">
      <div><h2>My <em>Team</em></h2><p>Staff members who share your agency account</p></div>
      <button className="ap-btn ap-btn-gold" onClick={() => setShowNew(true)}>+ Add Staff Member</button>
    </div>

    {msg && <p style={{ fontSize: 12, marginBottom: 12, color: msg.ok ? "#16a34a" : "var(--red)" }}>{msg.text}</p>}

    {/* New member form */}
    {showNew && (
      <div className="ap-card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>New Staff Member</div>
        <form onSubmit={createMember}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div className="ap-field"><label>Full Name *</label><input required value={newU.fullName} onChange={e => setNewU(f => ({ ...f, fullName: e.target.value }))} /></div>
            <div className="ap-field"><label>Email *</label><input type="email" required value={newU.email} onChange={e => setNewU(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="ap-field"><label>Phone</label><input value={newU.phone} onChange={e => setNewU(f => ({ ...f, phone: e.target.value }))} placeholder="03xx-xxxxxxx" /></div>
            <div className="ap-field"><label>Designation <span style={{ fontWeight: 400, fontSize: 11, color: "var(--muted)" }}>(e.g. Sales Manager)</span></label><input value={newU.designation} onChange={e => setNewU(f => ({ ...f, designation: e.target.value }))} /></div>
            <div className="ap-field" style={{ gridColumn: "1/-1" }}><label>Password (min 8 chars) *</label><input type="password" required minLength={8} value={newU.password} onChange={e => setNewU(f => ({ ...f, password: e.target.value }))} /></div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Permissions <span style={{ fontWeight: 400, fontSize: 11, color: "var(--muted)" }}>— sab by default ON, zaroorat pe OFF karo</span></div>
          <PermRow perms={newPerms} setPerms={setNewPerms as (p: Record<Perm,boolean>) => void} />
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>⚠ Issue Tickets permission sirf owner ke paas hoti hai — staff members issue nahi kar sakte.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="ap-btn ap-btn-gold" disabled={saving}>{saving ? "Creating…" : "Create Staff Member"}</button>
            <button type="button" className="ap-btn ap-btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
          </div>
        </form>
      </div>
    )}

    {loading ? <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p> : subUsers.length === 0 ? (
      <div className="ap-card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>No staff members yet. Add your first team member above.</p>
      </div>
    ) : subUsers.map(u => (
      <div key={u.id} className="ap-card" style={{ padding: "16px 20px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{u.fullName}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.email}{u.designation ? ` · ${u.designation}` : ""}</div>
            <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, textTransform: "uppercase", background: u.status === "active" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: u.status === "active" ? "#16a34a" : "#dc2626" }}>{u.status}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="ap-btn ap-btn-ghost" onClick={() => { setEditId(editId === u.id ? null : u.id); setEditPerms({ ...DEF, ...u.permissions }); }}>{editId === u.id ? "Cancel" : "Edit Permissions"}</button>
            <button className="ap-btn ap-btn-ghost" style={{ color: u.status === "active" ? "#dc2626" : "#16a34a" }} onClick={() => toggleStatus(u)}>{u.status === "active" ? "Deactivate" : "Activate"}</button>
            <button className="ap-btn ap-btn-ghost" style={{ color: "#dc2626" }} onClick={() => deleteMember(u)}>Delete</button>
          </div>
        </div>

        {editId === u.id && (
          <div style={{ marginTop: 14, borderTop: "1px solid var(--bdr)", paddingTop: 14 }}>
            <PermRow perms={editPerms} setPerms={setEditPerms as (p: Record<Perm,boolean>) => void} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="ap-btn ap-btn-gold" onClick={() => savePerms(u.id)}>Save Permissions</button>
              <button className="ap-btn ap-btn-ghost" onClick={() => setEditId(null)}>Cancel</button>
            </div>
          </div>
        )}

        {editId !== u.id && (
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(Object.keys(PERM_LABELS) as Perm[]).map(k => (
              <span key={k} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: u.permissions[k] ? "rgba(184,142,62,0.1)" : "rgba(0,0,0,0.04)", color: u.permissions[k] ? "var(--gold-dim,#9C7E3A)" : "var(--muted)", border: "1px solid", borderColor: u.permissions[k] ? "rgba(184,142,62,0.3)" : "var(--bdr)" }}>
                {u.permissions[k] ? "✓" : "✗"} {PERM_LABELS[k].label}
              </span>
            ))}
          </div>
        )}
      </div>
    ))}
  </>);
}

export default function AgentTeamPage() {
  return <AgentGuard><AgentShell><TeamInner /></AgentShell></AgentGuard>;
}
