"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type VisaService = { id: string; title: string; country: string; type: string; price: string | null; days: string | null; status: string };

const emptyForm = { title: "", country: "", type: "tourist", price: "", days: "", validity: "", status: "active" };

function VisaServicesInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [items, setItems] = useState<VisaService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/visa-services");
    const data = await res.json().catch(() => ({}));
    setItems(data.visaServices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() { setEditingId(null); setForm(emptyForm); setFile(null); setError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.country.trim()) { setError("Title and country are required."); return; }
    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.set(k, v));
    if (file) body.set("countryImage", await compressImage(file));

    const url = editingId ? `/api/admin/visa-services/${editingId}` : "/api/admin/visa-services";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save."); return; }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this visa service?")) return;
    await adminFetch(`/api/admin/visa-services/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="adp-ph"><div><h2>Visa <em>Services</em></h2><p>Country visa listings shown on the public site</p></div></div>

      <div className="adp-card">
        <div className="adp-ch"><h3>{editingId ? "Edit Visa Service" : "New Visa Service"}</h3></div>
        <form onSubmit={handleSubmit} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div><label>Title</label><input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
          <div><label>Country</label><input required value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></div>
          <div>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="tourist">Tourist</option><option value="umrah">Umrah</option><option value="business">Business</option><option value="work">Work</option>
            </select>
          </div>
          <div><label>Price</label><input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
          <div><label>Processing Days</label><input value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))} /></div>
          <div><label>Validity</label><input value={form.validity} onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))} /></div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
          <div><label>Country Image</label><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>

          {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">{submitting ? "Saving…" : editingId ? "Update" : "Create"}</button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? <p className="etd">Loading…</p> : items.length === 0 ? <p className="etd">No visa services yet.</p> : (
            <table className="adp-table">
              <thead><tr><th>Title</th><th>Country</th><th>Type</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.title}</strong></td>
                    <td>{v.country}</td>
                    <td className="capitalize">{v.type}</td>
                    <td><span className={`adp-pill adp-p-${v.status}`}>{v.status}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => { setEditingId(v.id); setForm({ title: v.title, country: v.country, type: v.type, price: v.price ?? "", days: v.days ?? "", validity: "", status: v.status }); setFile(null); }}
                        className="adp-btn adp-btn-s"
                      >Edit</button>
                      <button onClick={() => handleDelete(v.id)} className="adp-btn adp-btn-r">Delete</button>
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

export default function AdminVisaServicesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <VisaServicesInner />
      </AdminShell>
    </AdminGuard>
  );
}
