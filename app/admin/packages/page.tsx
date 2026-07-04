"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
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

const emptyForm = {
  category: "umrah",
  name: "",
  duration: "",
  price: "",
  destination: "",
  featured: false,
  status: "active",
};

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

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(pkg: Package) {
    setEditingId(pkg.id);
    setForm({
      category: pkg.category,
      name: pkg.name,
      duration: pkg.duration ?? "",
      price: pkg.price ?? "",
      destination: pkg.destination ?? "",
      featured: pkg.featured,
      status: pkg.status,
    });
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
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);

    const body = new FormData();
    body.set("category", form.category);
    body.set("name", form.name);
    body.set("duration", form.duration);
    body.set("price", form.price);
    body.set("destination", form.destination);
    body.set("featured", String(form.featured));
    body.set("status", form.status);

    if (file) {
      // Compress client-side before upload, per brief: ~1280px / JPEG q0.8.
      const compressed = await compressImage(file);
      body.set("image", compressed);
    }

    const url = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
    const res = await adminFetch(url, accessToken, refresh, {
      method: editingId ? "PATCH" : "POST",
      body,
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save package.");
      return;
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package?")) return;
    await adminFetch(`/api/admin/packages/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Packages</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-[var(--bdr)] bg-white p-6 sm:grid-cols-2">
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        >
          <option value="umrah">Umrah</option>
          <option value="tours">Tours</option>
        </select>
        <input
          placeholder="Name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        />
        <input
          placeholder="Duration (e.g. 10 Days)"
          value={form.duration}
          onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        />
        <input
          placeholder="Price (e.g. PKR 250,000)"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        />
        <input
          placeholder="Destination"
          value={form.destination}
          onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        />
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
          />
          Featured on homepage
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />

        {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="sm:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : editingId ? "Update package" : "Create package"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-[var(--bdr)] px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : packages.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No packages yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}{p.featured ? " ★" : ""}</td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3">{p.price ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => startEdit(p)} className="text-[var(--navy)] underline">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-700 underline">Delete</button>
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

export default function AdminPackagesPage() {
  return (
    <AdminGuard>
      <PackagesInner />
    </AdminGuard>
  );
}
