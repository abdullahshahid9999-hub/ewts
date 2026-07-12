"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type BankAccount = {
  id: string;
  bankName: string;
  logoUrl: string | null;
  accountTitle: string;
  accountNumber: string;
  iban: string | null;
  branchCode: string | null;
  sortOrder: number;
  isActive: boolean;
};

const empty = { bankName: "", accountTitle: "", accountNumber: "", iban: "", branchCode: "", sortOrder: "0" };

function BankAccountsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/bank-accounts", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setAccounts(data.accounts ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const body = new FormData();
    body.set("bankName", form.bankName);
    body.set("accountTitle", form.accountTitle);
    body.set("accountNumber", form.accountNumber);
    if (form.iban) body.set("iban", form.iban);
    if (form.branchCode) body.set("branchCode", form.branchCode);
    body.set("sortOrder", form.sortOrder);
    if (logoFile) body.set("logo", logoFile);
    const res = await adminFetch("/api/admin/bank-accounts", accessToken, refresh, {
      method: "POST",
      body,
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not create."); return; }
    setLogoFile(null);
    setForm(empty);
    load();
  }

  async function save(id: string) {
    setError(null);
    setSaving(true);
    const res = await adminFetch(`/api/admin/bank-accounts/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName: editForm.bankName,
        accountTitle: editForm.accountTitle,
        accountNumber: editForm.accountNumber,
        iban: editForm.iban || null,
        branchCode: editForm.branchCode || null,
        sortOrder: Number(editForm.sortOrder),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not save."); return; }
    setEditingId(null);
    load();
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

  const iStyle = {
    width: "100%", padding: "7px 10px", border: "1.5px solid var(--a-border)",
    borderRadius: 7, fontSize: 12, outline: "none",
  };

  return (
    <>
      <div className="adp-ph">
        <div><h2>Bank <em>Accounts</em></h2><p>Configure the accounts shown to agents on the Topup page</p></div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#DC2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Add new account form */}
      <div className="adp-card" style={{ marginBottom: 20 }}>
        <div className="adp-ch"><h3>Add Bank Account</h3></div>
        <form onSubmit={create} style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Bank Name *</label>
            <input style={iStyle} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="e.g. HBL" required />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Bank Logo</label>
            <input type="file" accept="image/*" style={iStyle} onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Account Title *</label>
            <input style={iStyle} value={form.accountTitle} onChange={(e) => setForm({ ...form, accountTitle: e.target.value })} placeholder="e.g. East & West Travel" required />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Account Number *</label>
            <input style={iStyle} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="e.g. 0123456789" required />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>IBAN</label>
            <input style={iStyle} value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="PK36SCBL0000001123456702" />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Branch Code</label>
            <input style={iStyle} value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} placeholder="e.g. 0789" />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Sort Order</label>
            <input style={iStyle} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} placeholder="0" />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={saving} className="adp-btn adp-btn-g">
              {saving ? "Saving…" : "Add Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Accounts list */}
      <div className="adp-card">
        <div className="adp-ch"><h3>Configured Accounts</h3><p>{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p></div>
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : accounts.length === 0 ? (
            <p className="etd">No accounts yet. Add one above.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr><th>Bank</th><th>Account Title</th><th>Number</th><th>IBAN</th><th>Branch</th><th>Status</th><th>Order</th><th></th></tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    {editingId === acc.id ? (
                      <>
                        <td><input style={{ ...iStyle, width: 120 }} value={editForm.bankName} onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 150 }} value={editForm.accountTitle} onChange={(e) => setEditForm({ ...editForm, accountTitle: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 130 }} value={editForm.accountNumber} onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 130 }} value={editForm.iban} onChange={(e) => setEditForm({ ...editForm, iban: e.target.value })} /></td>
                        <td><input style={{ ...iStyle, width: 80 }} value={editForm.branchCode} onChange={(e) => setEditForm({ ...editForm, branchCode: e.target.value })} /></td>
                        <td>—</td>
                        <td><input style={{ ...iStyle, width: 60 }} type="number" value={editForm.sortOrder} onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })} /></td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => save(acc.id)} disabled={saving} className="adp-btn adp-btn-g adp-btn-s">Save</button>
                          <button onClick={() => setEditingId(null)} className="adp-btn adp-btn-s">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                          {acc.logoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={acc.logoUrl} alt={acc.bankName} style={{ width: 22, height: 22, objectFit: "contain", borderRadius: 4 }} />
                          )}
                          {acc.bankName}
                        </td>
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
                        <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => { setEditingId(acc.id); setEditForm({ bankName: acc.bankName, accountTitle: acc.accountTitle, accountNumber: acc.accountNumber, iban: acc.iban ?? "", branchCode: acc.branchCode ?? "", sortOrder: String(acc.sortOrder) }); }} className="adp-btn adp-btn-s">Edit</button>
                          <button onClick={() => toggle(acc)} className="adp-btn adp-btn-s">{acc.isActive ? "Hide" : "Show"}</button>
                          <button onClick={() => remove(acc.id)} className="adp-btn adp-btn-r adp-btn-s">Del</button>
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

export default function AdminBankAccountsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <BankAccountsInner />
      </AdminShell>
    </AdminGuard>
  );
}
