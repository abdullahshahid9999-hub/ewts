"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type PendingInvite = {
  id: string; email: string; fullName: string | null;
  inviteExpiresAt: string | null; invitedByEmail: string | null; createdAt: string;
};
type ActiveAdmin = {
  id: string; email: string; fullName: string | null;
  invitedByEmail: string | null; createdAt: string; inviteAcceptedAt: string | null;
};

function InviteAdminsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [admins, setAdmins]   = useState<ActiveAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail]     = useState("");
  const [fullName, setFullName] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      adminFetch("/api/admin/invite", accessToken, refresh),
      adminFetch("/api/admin/admins", accessToken, refresh),
    ]);
    const d1 = await r1.json().catch(() => ({}));
    const d2 = await r2.json().catch(() => ({}));
    if (r1.ok) setPending(d1.pending ?? []);
    if (r2.ok) setAdmins(d2.admins ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function sendInvite() {
    if (!email) return;
    setSending(true); setMsg(null);
    const res = await adminFetch("/api/admin/invite", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fullName }),
    });
    const d = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      setMsg({ type: "ok", text: d.emailWarning ?? `Invitation sent to ${email}` });
      setEmail(""); setFullName(""); load();
    } else {
      setMsg({ type: "err", text: d.error ?? "Failed to send invite." });
    }
  }

  async function revokeInvite(id: string, invEmail: string) {
    if (!confirm(`Revoke invite for ${invEmail}?`)) return;
    const res = await adminFetch("/api/admin/invite", accessToken, refresh, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
    else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Failed."); }
  }

  async function resetPassword(id: string, adminEmail: string) {
    if (!confirm(`Send password reset link to ${adminEmail}? Their current password will be invalidated.`)) return;
    const res = await adminFetch("/api/admin/admins", accessToken, refresh, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) alert(d.emailWarning ?? `Password reset email sent to ${adminEmail}.`);
    else alert(d.error ?? "Failed.");
    load();
  }

  async function terminateAdmin(id: string, adminEmail: string) {
    if (!confirm(`TERMINATE admin account for ${adminEmail}? This cannot be undone.`)) return;
    const res = await adminFetch("/api/admin/admins", accessToken, refresh, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { alert(`${adminEmail} has been removed.`); load(); }
    else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Failed."); }
  }

  function isExpired(expiresAt: string | null) {
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  }
  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  const tdStyle = { padding: "11px 14px", fontSize: 13 } as React.CSSProperties;
  const thStyle = { textAlign: "left" as const, padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" };

  return (
    <AdminShell>
      <div className="adp-ph"><div><h2>Invite <em>Admins</em></h2><p>Manage admin users — invite, reset passwords, or terminate accounts</p></div></div>

      {/* Invite Form */}
      <div className="adp-card" style={{ padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 18px", color: "var(--a-text)" }}>Send New Invitation</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Email Address *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="newadmin@example.com"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              onKeyDown={e => e.key === "Enter" && sendInvite()} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Full Name (optional)</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="John Smith"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              onKeyDown={e => e.key === "Enter" && sendInvite()} />
          </div>
          <button onClick={sendInvite} disabled={sending || !email}
            style={{ padding: "9px 20px", background: "var(--a-gold)", color: "#fff", fontWeight: 700, borderRadius: 8, border: "none", cursor: sending ? "not-allowed" : "pointer", fontSize: 13, opacity: sending ? 0.7 : 1, whiteSpace: "nowrap" }}>
            {sending ? "Sending…" : "✉ Send Invite"}
          </button>
        </div>
        {msg && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: msg.type === "ok" ? "var(--a-green-bg)" : "var(--a-red-bg)", color: msg.type === "ok" ? "var(--a-green)" : "var(--a-red)" }}>
            {msg.type === "ok" ? "✅ " : "⚠️ "}{msg.text}
          </div>
        )}
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 12, color: "var(--a-muted)" }}>
          The invited admin will receive an email with a secure link to set their password. Links expire after <strong>48 hours</strong>.
        </p>
      </div>

      {/* Active Admins */}
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "var(--a-text)" }}>
        Active Admins {!loading && `(${admins.length})`}
      </h3>
      {loading ? <p style={{ color: "var(--a-muted)", fontSize: 13 }}>Loading…</p> : admins.length === 0 ? (
        <div className="adp-card" style={{ padding: 24, textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: "var(--a-muted)", margin: 0 }}>No active admins found.</p>
        </div>
      ) : (
        <div className="adp-card" style={{ overflow: "hidden", marginBottom: 28 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--a-border)", background: "var(--a-raised)" }}>
                {["Name / Email", "Joined", "Invited By", "Actions"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {admins.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < admins.length - 1 ? "1px solid var(--a-border)" : "none" }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{a.fullName || a.email}</div>
                    {a.fullName && <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{a.email}</div>}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: "var(--a-muted)" }}>{fmtDate(a.inviteAcceptedAt ?? a.createdAt)}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: "var(--a-muted)" }}>{a.invitedByEmail || "system"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => resetPassword(a.id, a.email)}
                        style={{ padding: "5px 12px", background: "var(--a-gold-bg, #FEF9EE)", color: "var(--a-gold)", border: "1px solid var(--a-gold)", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        🔑 Reset PW
                      </button>
                      <button onClick={() => terminateAdmin(a.id, a.email)}
                        style={{ padding: "5px 12px", background: "var(--a-red-bg)", color: "var(--a-red)", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        ✕ Terminate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Invitations */}
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "var(--a-text)" }}>
        Pending Invitations {!loading && `(${pending.length})`}
      </h3>
      {!loading && pending.length === 0 ? (
        <div className="adp-card" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <p style={{ fontSize: 14, color: "var(--a-muted)", margin: 0 }}>No pending invitations.</p>
        </div>
      ) : !loading && (
        <div className="adp-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--a-border)", background: "var(--a-raised)" }}>
                {["Email", "Name", "Invited By", "Expires", "Status", ""].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pending.map((inv, i) => {
                const expired = isExpired(inv.inviteExpiresAt);
                return (
                  <tr key={inv.id} style={{ borderBottom: i < pending.length - 1 ? "1px solid var(--a-border)" : "none" }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{inv.email}</td>
                    <td style={{ ...tdStyle, color: "var(--a-muted)" }}>{inv.fullName || "—"}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: "var(--a-muted)" }}>{inv.invitedByEmail || "—"}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: expired ? "var(--a-red)" : "var(--a-muted)" }}>
                      {inv.inviteExpiresAt ? new Date(inv.inviteExpiresAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: expired ? "var(--a-red-bg)" : "var(--a-gold-bg)", color: expired ? "var(--a-red)" : "var(--a-gold)" }}>
                        {expired ? "Expired" : "Pending"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <button onClick={() => revokeInvite(inv.id, inv.email)}
                        style={{ padding: "5px 12px", background: "var(--a-red-bg)", color: "var(--a-red)", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

export default function InviteAdminsPage() {
  return <AdminGuard><InviteAdminsInner /></AdminGuard>;
}
