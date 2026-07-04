"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type Blog = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  published: boolean;
};

const emptyForm = { title: "", slug: "", category: "", excerpt: "", content: "", published: false };

function BlogsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/blogs");
    const data = await res.json().catch(() => ({}));
    setItems(data.blogs ?? []);
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
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    const body = new FormData();
    body.set("title", form.title);
    body.set("slug", form.slug);
    body.set("category", form.category);
    body.set("excerpt", form.excerpt);
    body.set("content", form.content);
    body.set("published", String(form.published));
    if (file) body.set("coverImage", await compressImage(file));

    const url = editingId ? `/api/admin/blogs/${editingId}` : "/api/admin/blogs";
    const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not save."); return; }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this blog post?")) return;
    await adminFetch(`/api/admin/blogs/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">Blog</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <input placeholder="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Slug (optional — derived from title if blank)" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" />
        <textarea placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" rows={2} />
        <textarea placeholder="Content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm" rows={6} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
          Published
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
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
          <p className="p-6 text-sm text-[var(--muted)]">No blog posts yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Published</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3 font-medium">{b.title}</td>
                  <td className="px-4 py-3">{b.slug}</td>
                  <td className="px-4 py-3">{b.published ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => {
                        setEditingId(b.id);
                        setForm({ title: b.title, slug: b.slug, category: b.category ?? "", excerpt: "", content: "", published: b.published });
                        setFile(null);
                      }}
                      className="text-[var(--navy)] underline"
                    >Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-700 underline">Delete</button>
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

export default function AdminBlogsPage() {
  return (
    <AdminGuard>
      <BlogsInner />
    </AdminGuard>
  );
}
