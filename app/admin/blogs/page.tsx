"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type Blog = { id: string; title: string; slug: string; category: string | null; published: boolean };

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

  function resetForm() { setEditingId(null); setForm(emptyForm); setFile(null); setError(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError("Title is required."); return; }
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
    <>
      <div className="adp-ph"><div><h2>Blog <em>Posts</em></h2><p>Articles shown on the public site</p></div></div>

      <div className="adp-card">
        <div className="adp-ch"><h3>{editingId ? "Edit Post" : "New Post"}</h3></div>
        <form onSubmit={handleSubmit} className="adp-fg" style={{ padding: "16px 18px", display: "grid", gap: "12px" }}>
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <input placeholder="Slug (optional — derived from title if blank)" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          <input placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <textarea placeholder="Excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
          <textarea placeholder="Content" rows={6} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} style={{ width: "auto" }} />
            Published
          </label>

          {error && <p style={{ color: "var(--a-red)", fontSize: "12px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting} className="adp-btn adp-btn-g">{submitting ? "Saving…" : editingId ? "Update" : "Create"}</button>
            {editingId && <button type="button" onClick={resetForm} className="adp-btn adp-btn-t">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? <p className="etd">Loading…</p> : items.length === 0 ? <p className="etd">No blog posts yet.</p> : (
            <table className="adp-table">
              <thead><tr><th>Title</th><th>Slug</th><th>Published</th><th></th></tr></thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.slug}</td>
                    <td><span className={`adp-pill ${b.published ? "adp-p-published" : "adp-p-pending"}`}>{b.published ? "Yes" : "No"}</span></td>
                    <td style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => { setEditingId(b.id); setForm({ title: b.title, slug: b.slug, category: b.category ?? "", excerpt: "", content: "", published: b.published }); setFile(null); }}
                        className="adp-btn adp-btn-s"
                      >Edit</button>
                      <button onClick={() => handleDelete(b.id)} className="adp-btn adp-btn-r">Delete</button>
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

export default function AdminBlogsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <BlogsInner />
      </AdminShell>
    </AdminGuard>
  );
}
