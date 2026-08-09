"use client";

import { useEffect, useState, useCallback } from "react";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Permission = {
  canCreateBookings: boolean;
  canViewBookings: boolean;
  canSubmitPaymentSlip: boolean;
  canViewLedger: boolean;
  canManageSavedClients: boolean;
  canViewNotifications: boolean;
};

type Staff = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  designation: string | null;
  status: string;
  permissions: Permission;
  createdAt: string;
};

const PERM_LABELS: { key: keyof Permission; label: string; desc: string }[] = [
  { key: "canCreateBookings",    label: "Create Bookings",    desc: "Can make new bookings" },
  { key: "canViewBookings",      label: "View Bookings",      desc: "Can view all agency bookings" },
  { key: "canSubmitPaymentSlip", label: "Submit Payments",    desc: "Can upload payment slips" },
  { key: "canViewLedger",        label: "View Ledger",        desc: "Can see credit/balance" },
  { key: "canManageSavedClients",label: "Saved Clients",      desc: "Can add/edit saved clients" },
  { key: "canViewNotifications", label: "Notifications",      desc: "Can view notifications" },
];

const emptyPerms = (): Permission => ({
  canCreateBookings: false, canViewBookings: true,
  canSubmitPaymentSlip: false, canViewLedger: false,
  canManageSavedClients: false, canViewNotifications: true,
});

const emptyForm = () => ({
  fullName: "", email: "", phone: "", designation: "", password: "", permissions: emptyPerms(),
});

function StaffInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [list, setList]           = useState<Staff[]>([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(emptyForm());
  const [editId, setEditId]       = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await agentFetch("/api/agent/staff", accessToken, refresh);
    const d = await res.json().catch(() => ({}));
    if (res.ok) setList(d.staff ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditId(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  }

  function startEdit(s: Staff) {
    setEditId(s.id);
    setForm({ fullName: s.fullName, email: s.email, phone: s.phone ?? "", designation: s.designation ?? "", password: "", permissions: { ...emptyPerms(), ...s.permissions } });
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim())    { setError("Email is required."); return; }
    if (!editId && form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    const body = editId
      ? { fullName: form.fullName, phone: form.phone, designation: form.designation, permissions: form.permissions, ...(form.password ? { password: form.password } : {}) }
      : { ...form };
    const res = await agentFetch(
      editId ? `/api/agent/staff/${editId}` : "/api/agent/staff",
      accessToken, refresh,
      { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Failed to save."); return; }
    setShowForm(false);
    load();
  }

  async function toggleStatus(s: Staff) {
    await agentFetch(`/api/agent/staff/${s.id}`, accessToken, refresh, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s.status === "active" ? "suspended" : "active" }),
    });
    load();
  }

  async function deleteStaff(s: Staff) {
    if (!confirm(`Remove ${s.fullName}? This cannot be undone.`)) return;
    await agentFetch(`/api/agent/staff/${s.id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  function setPerm(key: keyof Permission, val: boolean) {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: val } }));
  }

  const inp = (label: string, value: string, onChange: (v: string) => void, opts?: { type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</label>
      <input type={opts?.type ?? "text"} value={value} onChange={e => onChange(e.target.value)}
        placeholder={opts?.placeholder ?? ""} required={opts?.required}
        className="ap-input" style={{ width: "100%", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <AgentShell>
      <div className="ap-ph" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2>Staff <em>Management</em></h2>
          <p>Add team members and control what they can access</p>
        </div>
        <button onClick={startNew} className="ap-btn ap-btn-gold">+ Add Staff Member</button>
      </div>

      {/* ── ADD / EDIT FORM ── */}
      {showForm && (
        <div className="ap-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{editId ? "Edit Staff Member" : "New Staff Member"}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--muted)", lineHeight: 1 }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {inp("Full Name *", form.fullName, v => setForm(f => ({ ...f, fullName: v })), { required: true })}
            {inp("Email Address *", form.email, v => setForm(f => ({ ...f, email: v })), { type: "email", required: true })}
            {inp("Phone Number", form.phone, v => setForm(f => ({ ...f, phone: v })), { placeholder: "03xx-xxxxxxx" })}
            {inp("Designation", form.designation, v => setForm(f => ({ ...f, designation: v })), { placeholder: "e.g. Ticketing Agent" })}
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                {editId ? "New Password (leave blank to keep)" : "Temporary Password *"}
              </label>
              <input type={showPw ? "text" : "password"} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters" className="ap-input"
                style={{ width: "100%", boxSizing: "border-box", paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: "absolute", right: 10, bottom: 10, background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--muted)" }}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Access Permissions
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {PERM_LABELS.map(({ key, label, desc }) => (
                <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: `1.5px solid ${form.permissions[key] ? "var(--gold)" : "var(--bdr)"}`, borderRadius: 8, cursor: "pointer", background: form.permissions[key] ? "rgba(212,168,67,0.06)" : "#fff", transition: "all .15s" }}>
                  <input type="checkbox" checked={form.permissions[key]} onChange={e => setPerm(key, e.target.checked)}
                    style={{ marginTop: 2, accentColor: "var(--gold)", width: 15, height: 15, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
              ⚠️ Staff can never issue tickets or view agency financials beyond their permissions. Ticket issuance is owner-only.
            </p>
          </div>

          {error && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={saving} className="ap-btn ap-btn-gold" style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : editId ? "Save Changes" : "Create Staff Member"}
            </button>
            <button onClick={() => setShowForm(false)} className="ap-btn" style={{ background: "none", border: "1px solid var(--bdr)" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── STAFF LIST ── */}
      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
      ) : list.length === 0 && !showForm ? (
        <div className="ap-card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No Staff Members Yet</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Add team members to help manage bookings under your agency.</p>
          <button onClick={startNew} className="ap-btn ap-btn-gold">+ Add First Staff Member</button>
        </div>
      ) : list.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map(s => {
            const activePerms = PERM_LABELS.filter(p => s.permissions[p.key]).map(p => p.label);
            return (
              <div key={s.id} className="ap-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), #c9a85c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                  {s.fullName[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{s.fullName}</span>
                    {s.designation && <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--surface)", padding: "2px 8px", borderRadius: 12 }}>{s.designation}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: s.status === "active" ? "var(--green-bg)" : "var(--red-bg)", color: s.status === "active" ? "var(--green)" : "var(--red)" }}>
                      {s.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{s.email}{s.phone ? ` · ${s.phone}` : ""}</div>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {activePerms.length > 0
                      ? activePerms.map(p => <span key={p} style={{ fontSize: 10, background: "rgba(212,168,67,0.1)", color: "#9C7E3A", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{p}</span>)
                      : <span style={{ fontSize: 11, color: "var(--muted)" }}>No permissions assigned</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => startEdit(s)} className="ap-btn" style={{ fontSize: 12, padding: "6px 14px" }}>Edit</button>
                  <button onClick={() => toggleStatus(s)} className="ap-btn" style={{ fontSize: 12, padding: "6px 14px" }}>
                    {s.status === "active" ? "Suspend" : "Activate"}
                  </button>
                  <button onClick={() => deleteStaff(s)} className="ap-btn" style={{ fontSize: 12, padding: "6px 14px", color: "var(--red)", borderColor: "var(--red-bd)" }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff login info card */}
      <div className="ap-card" style={{ padding: 18, marginTop: 24, background: "rgba(212,168,67,0.04)", border: "1.5px solid rgba(212,168,67,0.2)" }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🔑 How Staff Login Works</p>
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
          Staff members log in at <strong>b2b.eastwestpk.com</strong> → Staff Login tab using their email and the temporary password you set.
          They should change their password after first login. Staff cannot issue tickets or view full agency financials — those are owner-only.
        </p>
      </div>
    </AgentShell>
  );
}

export default function StaffPage() {
  return <AgentGuard><StaffInner /></AgentGuard>;
}
