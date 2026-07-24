"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type Supplier = {
  id: string;
  name: string;
  contactInfo: string | null;
  isApiBased: boolean;
  apiBaseUrl: string | null;
  apiKeyPreview: string;
  hasApiKey: boolean;
  status: string;
  notes: string | null;
};

const empty = { name: "", contactInfo: "", isApiBased: false, apiBaseUrl: "", apiKey: "", notes: "" };

function SuppliersInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/suppliers", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not load suppliers."); setLoading(false); return; }
    setSuppliers(data.suppliers ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const url = editingId ? `/api/admin/suppliers/${editingId}` : "/api/admin/suppliers";
    const res = await adminFetch(url, accessToken, refresh, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Could not save supplier."); return; }
    setForm(empty);
    setEditingId(null);
    load();
  }

  function startEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({
      name: s.name, contactInfo: s.contactInfo ?? "", isApiBased: s.isApiBased,
      apiBaseUrl: s.apiBaseUrl ?? "", apiKey: "", notes: s.notes ?? "",
    });
  }

  async function toggleStatus(s: Supplier) {
    await adminFetch(`/api/admin/suppliers/${s.id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s.status === "active" ? "inactive" : "active" }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this supplier? Group flights linked to it will keep their history but lose the link.")) return;
    await adminFetch(`/api/admin/suppliers/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Suppliers</h2><p>Wholesalers / consolidators inventory is bought from — API keys are stored encrypted and never shown again after saving.</p></div></div>

      <div className="adp-card" style={{ marginBottom: 16 }}>
        <div className="adp-ch"><h3>{editingId ? "Edit Supplier" : "New Supplier"}</h3></div>
        <form onSubmit={submit} style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label>Supplier Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. FX-Port" required />
          </div>
          <div>
            <label>Contact Info</label>
            <input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder="phone / email / portal login notes" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={form.isApiBased} onChange={(e) => setForm({ ...form, isApiBased: e.target.checked })} id="isApiBased" />
            <label htmlFor="isApiBased" style={{ marginBottom: 0 }}>This supplier has an API (uncheck for manual/phone-based suppliers)</label>
          </div>
          {form.isApiBased && (
            <>
              <div>
                <label>API Base URL</label>
                <input value={form.apiBaseUrl} onChange={(e) => setForm({ ...form, apiBaseUrl: e.target.value })} placeholder="https://api.supplier.com" />
              </div>
              <div>
                <label>API Key {editingId && <span style={{ fontSize: 11, color: "var(--a-muted)" }}>(leave blank to keep existing key)</span>}</label>
                <input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={editingId ? "•••• (unchanged)" : "paste API key"} autoComplete="off" />
              </div>
            </>
          )}
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} className="adp-btn adp-btn-g">{saving ? "Saving…" : editingId ? "Save Changes" : "Add Supplier"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="adp-btn adp-btn-s">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="adp-card">
        {loading ? (
          <p style={{ padding: 18 }}>Loading…</p>
        ) : (
          <div className="adp-tw">
          <table className="adp-table">
            <thead><tr><th>Name</th><th>Type</th><th>Contact</th><th>API Key</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {suppliers.length === 0 && <tr><td colSpan={6} className="etd" style={{ textAlign: "center" }}>No suppliers yet.</td></tr>}
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.isApiBased ? "API" : "Manual"}</td>
                  <td>{s.contactInfo ?? "—"}</td>
                  <td style={{ fontFamily: "monospace" }}>{s.hasApiKey ? s.apiKeyPreview : "—"}</td>
                  <td><span className={`adp-pill adp-p-${s.status}`}>{s.status}</span></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => startEdit(s)} className="adp-btn adp-btn-s">Edit</button>
                    <button onClick={() => toggleStatus(s)} className="adp-btn adp-btn-s">{s.status === "active" ? "Deactivate" : "Activate"}</button>
                    <button onClick={() => remove(s.id)} className="adp-btn adp-btn-r">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminSuppliersPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <SuppliersInner />
      </AdminShell>
    </AdminGuard>
  );
}
