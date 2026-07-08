"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type Package = {
  id: string;
  category: string;
  name: string;
  duration: string | null;
  price: string | null;
  destination: string | null;
  imageUrl: string | null;
  featured: boolean;
  status: string;
};

const emptyForm = { category: "umrah", name: "", duration: "", price: "", destination: "", featured: false, status: "active" };

function PackagesInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/packages");
    const data = await res.json().catch(() => ({}));
    setPackages(data.packages ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(pkg: Package) {
    setEditingId(pkg.id);
    setForm({ category: pkg.category, name: pkg.name, duration: pkg.duration ?? "", price: pkg.price ?? "", destination: pkg.destination ?? "", featured: pkg.featured, status: pkg.status });
    setFile(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);

    const body = new FormData();
    body.set("category", form.category);
    body.set("name", form.name);
    body.set("duration", form.duration);
    body.set("price", form.price);
    body.set("destination", form.destination);
    body.set("featured", String(form.featured));
    body.set("status", form.status);
    if (file) body.set("image", await compressImage(file));

    const url = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save package."); return; }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package?")) return;
    await adminFetch(`/api/admin/packages/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="adp-ph">
        <div><h2>Package <em>Management</em></h2><p>Umrah &amp; tour packages shown on the public site</p></div>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>{editingId ? "Edit Package" : "New Package"}</h3></div>
        <form onSubmit={handleSubmit} className="adp-fg adp-fr" style={{ padding: "16px 18px" }}>
          <div>
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="umrah">Umrah</option>
              <option value="tours">Tours</option>
            </select>
          </div>
          <div>
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label>Duration</label>
            <input placeholder="e.g. 10 Days" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </div>
          <div>
            <label>Price</label>
            <input placeholder="e.g. PKR 250,000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <label>Destination</label>
            <input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} />
          </div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} style={{ width: "auto" }} />
            Featured on homepage
          </div>
          <div>
            <label>Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {error && <p style={{ gridColumn: "1 / -1", color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">
              {submitting ? "Saving…" : editingId ? "Update Package" : "Create Package"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : packages.length === 0 ? (
            <p className="etd">No packages yet.</p>
          ) : (
            <table className="adp-table">
              <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}{p.featured ? " ★" : ""}</strong></td>
                    <td className="capitalize">{p.category}</td>
                    <td>{p.price ?? "—"}</td>
                    <td><span className={`adp-pill adp-p-${p.status}`}>{p.status}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => startEdit(p)} className="adp-btn adp-btn-s">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="adp-btn adp-btn-r">Delete</button>
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

export default function AdminPackagesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <PackagesInner />
      </AdminShell>
    </AdminGuard>
  );
}
