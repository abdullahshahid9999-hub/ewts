"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type BankAccount = {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string | null;
  branchCode: string | null;
  logoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = { bankName: "", accountTitle: "", accountNumber: "", iban: "", branchCode: "", sortOrder: "0" };

function BankAccountsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [form, setForm] = useState(emptyForm);
  const [addLogo, setAddLogo] = useState<File | null>(null);
  const [addLogoPreview, setAddLogoPreview] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/bank-accounts", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setAccounts(data.accounts ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  function pickAddLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setAddLogo(f);
    setAddLogoPreview(f ? URL.createObjectURL(f) : null);
  }

  function pickEditLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setEditLogo(f);
    setEditLogoPreview(f ? URL.createObjectURL(f) : null);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData();
    fd.append("bankName", form.bankName);
    fd.append("accountTitle", form.accountTitle);
    fd.append("accountNumber", form.accountNumber);
    if (form.iban) fd.append("iban", form.iban);
    if (form.branchCode) fd.append("branchCode", form.branchCode);
    fd.append("sortOrder", form.sortOrder);
    if (addLogo) fd.append("logo", addLogo);

    const res = await adminFetch("/api/admin/bank-accounts", accessToken, refresh, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not create."); return; }
    setForm(emptyForm);
    setAddLogo(null);
    setAddLogoPreview(null);
    load();
  }

  async function saveEdit(id: string) {
    setError(null);
    setSaving(true);
    const fd = new FormData();
    fd.append("bankName", editForm.bankName);
    fd.append("accountTitle", editForm.accountTitle);
    fd.append("accountNumber", editForm.accountNumber);
    fd.append("iban", editForm.iban);
    fd.append("branchCode", editForm.branchCode);
    fd.append("sortOrder", editForm.sortOrder);
    if (editLogo) fd.append("logo", editLogo);

    const res = await adminFetch(`/api/admin/bank-accounts/${id}`, accessToken, refresh, { method: "PATCH", body: fd });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not save."); return; }
    setEditingId(null);
    setEditLogo(null);
    setEditLogoPreview(null);
    load();
  }

  function startEdit(acc: BankAccount) {
    setEditingId(acc.id);
    setEditForm({ bankName: acc.bankName, accountTitle: acc.accountTitle, accountNumber: acc.accountNumber, iban: acc.iban ?? "", branchCode: acc.branchCode ?? "", sortOrder: String(acc.sortOrder) });
    setEditLogo(null);
    setEditLogoPreview(acc.logoUrl);
  }

  async function toggle(acc: BankAccount) {
    await adminFetch(`/api/admin/bank-accounts/${acc.id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !acc.isActive }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this bank account? Agents will no longer see it.")) return;
    await adminFetch(`/api/admin/bank-accounts/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  const iStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px",
    border: "1.5px solid var(--a-border)", borderRadius: 7, fontSize: 12, outline: "none",
  };

  const logoBox: React.CSSProperties = {
    width: 48, height: 48, borderRadius: 8, objectFit: "contain",
    border: "1.5px solid var(--a-border)", background: "#f8f8f8",
  };

  return (
    <>
      <div className="adp-ph">
        <div>
          <h2>Bank <em>Accounts</em></h2>
          <p>Configure accounts shown to agents on the Topup page</p>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#DC2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── Add form ── */}
      <div className="adp-card" style={{ marginBottom: 20 }}>
        <div className="adp-ch"><h3>Add Bank Account</h3></div>
        <form onSubmit={create} style={{ padding: "16px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <Field label="Bank Name *">
              <input style={iStyle} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. HBL" required />
            </Field>
            <Field label="Account Title *">
              <input style={iStyle} value={form.accountTitle} onChange={(e) => setForm({ ...form, accountTitle: e.target.value })} placeholder="e.g. East & West Travel" required />
            </Field>
            <Field label="Account Number *">
              <input style={iStyle} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="0123456789" required />
            </Field>
            <Field label="IBAN">
              <input style={iStyle} value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="PK36SCBL0000001123456702" />
            </Field>
            <Field label="Branch Code">
              <input style={iStyle} value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} placeholder="e.g. 0789" />
            </Field>
            <Field label="Sort Order">
              <input style={iStyle} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} placeholder="0" />
            </Field>
          </div>

          {/* Logo upload row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: "1px solid var(--a-border2)", marginBottom: 12 }}>
            {addLogoPreview
              ? <img src={addLogoPreview} alt="logo preview" style={logoBox} />
              : <div style={{ ...logoBox, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "var(--a-muted)" }}>🏦</div>
            }
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Bank Logo (optional)</div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickAddLogo} style={{ fontSize: 12 }} />
              <div style={{ fontSize: 10, color: "var(--a-muted)", marginTop: 4 }}>PNG, JPG, WebP · shown on agent topup page</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={saving} className="adp-btn adp-btn-g">
              {saving ? "Saving…" : "Add Account"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Accounts list ── */}
      <div className="adp-card">
        <div className="adp-ch">
          <h3>Configured Accounts</h3>
          <p>{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : accounts.length === 0 ? (
            <p className="etd">No accounts yet. Add one above.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr><th>Logo</th><th>Bank</th><th>Account Title</th><th>Number</th><th>IBAN</th><th>Branch</th><th>Status</th><th>Order</th><th></th></tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    {editingId === acc.id ? (
                      <>
                        {/* Logo cell in edit mode */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            {editLogoPreview
                              ? <img src={editLogoPreview} alt="logo" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6, border: "1.5px solid var(--a-border)", background: "#f8f8f8" }} />
                              : <div style={{ width: 40, height: 40, borderRadius: 6, border: "1.5px solid var(--a-border)", background: "#f8f8f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--a-muted)" }}>🏦</div>
                            }
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickEditLogo} style={{ fontSize: 10, width: 80 }} />
                          </div>
                        </td>
                        <td><input style={{ ...iStyle, width: 110 }} value={editForm.bankName} onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 140 }} value={editForm.accountTitle} onChange={(e) => setEditForm({ ...editForm, accountTitle: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 120 }} value={editForm.accountNumber} onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 120 }} value={editForm.iban} onChange={(e) => setEditForm({ ...editForm, iban: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 70 }} value={editForm.branchCode} onChange={(e) => setEditForm({ ...editForm, branchCode: e.target.value })} /></td>
                        <td>—</td>
                        <td><input style={{ ...iStyle, width: 54 }} type="number" value={editForm.sortOrder} onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })} /></td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => saveEdit(acc.id)} disabled={saving} className="adp-btn adp-btn-g adp-btn-s">Save</button>
                            <button onClick={() => { setEditingId(null); setEditLogo(null); setEditLogoPreview(null); }} className="adp-btn adp-btn-s">Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {acc.logoUrl
                            ? <img src={acc.logoUrl} alt={acc.bankName} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6, border: "1.5px solid var(--a-border)", background: "#f8f8f8" }} />
                            : <div style={{ width: 40, height: 40, borderRadius: 6, border: "1.5px solid var(--a-border)", background: "#f8f8f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--a-muted)" }}>🏦</div>
                          }
                        </td>
                        <td style={{ fontWeight: 700 }}>{acc.bankName}</td>
                        <td>{acc.accountTitle}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{acc.accountNumber}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{acc.iban ?? "—"}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{acc.branchCode ?? "—"}</td>
                        <td>
                          <span className={`adp-pill ${acc.isActive ? "adp-p-confirmed" : "adp-p-cancelled"}`}>
                            {acc.isActive ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td style={{ color: "var(--a-muted)", fontSize: 11 }}>{acc.sortOrder}</td>
                        <td>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            <button onClick={() => startEdit(acc)} className="adp-btn adp-btn-s">Edit</button>
                            <button onClick={() => toggle(acc)} className="adp-btn adp-btn-s">{acc.isActive ? "Hide" : "Show"}</button>
                            <button onClick={() => remove(acc.id)} className="adp-btn adp-btn-r adp-btn-s">Del</button>
                          </div>
                        </td>
                      </>
                    )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AdminBankAccountsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <BankAccountsInner />
      </AdminShell>
    </AdminGuard>
  );
}
