"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type VisaService = {
  id: string;
  title: string;
  country: string;
  type: string;
  price: string | null;
  days: string | null;
  status: string;
};

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

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.country.trim()) {
      setError("Title and country are required.");
      return;
    }
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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Visa Services</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-[var(--bdr)] bg-white p-6 sm:grid-cols-2">
        <input placeholder="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Country" required value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
          <option value="tourist">Tourist</option>
          <option value="umrah">Umrah</option>
          <option value="business">Business</option>
          <option value="work">Work</option>
        </select>
        <input placeholder="Price" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Processing days" value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Validity" value={form.validity} onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />

        {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" disabled={submitting} className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {submitting ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-[var(--bdr)] px-4 py-2 text-sm">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No visa services yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Country</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3 font-medium">{v.title}</td>
                  <td className="px-4 py-3">{v.country}</td>
                  <td className="px-4 py-3 capitalize">{v.type}</td>
                  <td className="px-4 py-3 capitalize">{v.status}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => {
                        setEditingId(v.id);
                        setForm({ title: v.title, country: v.country, type: v.type, price: v.price ?? "", days: v.days ?? "", validity: "", status: v.status });
                        setFile(null);
                      }}
                      className="text-[var(--navy)] underline"
                    >Edit</button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-700 underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminVisaServicesPage() {
  return (
    <AdminGuard>
      <VisaServicesInner />
    </AdminGuard>
  );
}
