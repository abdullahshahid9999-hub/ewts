"use client";

import { useEffect, useState, useCallback } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";
import BlogEditor, { blocksToJson, jsonToBlocks, type Block } from "@/components/BlogEditor";

type Blog = { id: string; title: string; slug: string; category: string | null; published: boolean; authorName: string | null; createdAt: string };

const CATEGORIES = ["Umrah", "Tours", "Visa", "Flights", "Insurance", "Travel Tips", "News", "Other"];

const emptyForm = { title: "", slug: "", category: "", excerpt: "", authorName: "", published: false };

function BlogsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [items, setItems]         = useState<Blog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [blocks, setBlocks]       = useState<Block[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [view, setView]           = useState<"list" | "editor">("list");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/blogs");
    const data = await res.json().catch(() => ({}));
    setItems(data.blogs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setBlocks([]);
    setCoverFile(null);
    setMobileFile(null);
    setError(null);
    setView("editor");
  }

  function startEdit(b: Blog) {
    setEditingId(b.id);
    setForm({ title: b.title, slug: b.slug, category: b.category ?? "", excerpt: "", authorName: b.authorName ?? "", published: b.published });
    setBlocks([]);
    setCoverFile(null);
    setMobileFile(null);
    setError(null);
    setView("editor");
  }

  // Upload a single image file (for inline block images)
  async function uploadBlockImage(file: File): Promise<string> {
    const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.82 });
    const fd = new FormData();
    fd.set("file", compressed, file.name);
    const res = await adminFetch("/api/admin/blogs/upload-image", accessToken, refresh, { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error ?? "Upload failed");
    return d.url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)));
      fd.set("content", blocksToJson(blocks));
      if (coverFile) {
        const c = await compressImage(coverFile, { maxDimension: 1400, quality: 0.85 });
        fd.set("coverImage", c, coverFile.name);
      }
      if (mobileFile) {
        const c = await compressImage(mobileFile, { maxDimension: 800, quality: 0.85 });
        fd.set("mobileCoverImage", c, mobileFile.name);
      }
      const url = editingId ? `/api/admin/blogs/${editingId}` : "/api/admin/blogs";
      const res = await adminFetch(url, accessToken, refresh, { method: editingId ? "PATCH" : "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Save failed."); return; }
      await load();
      setView("list");
    } finally { setSubmitting(false); }
  }

  async function togglePublish(b: Blog) {
    await adminFetch(`/api/admin/blogs/${b.id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !b.published }),
    });
    load();
  }

  async function deleteBlog(id: string) {
    if (!confirm("Delete this blog post?")) return;
    await adminFetch(`/api/admin/blogs/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  const filtered = filterCat ? items.filter(b => b.category === filterCat) : items;

  // ── EDITOR VIEW ─────────────────────────────────────────────────────────────
  if (view === "editor") return (
    <AdminShell>
      <div className="adp-ph" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2>{editingId ? "Edit" : "New"} <em>Blog Post</em></h2>
          <p>Rich block editor — add headings, images, quotes and more</p>
        </div>
        <button onClick={() => setView("list")} className="adp-btn adp-btn-t" style={{ fontSize: 13 }}>← Back to list</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* ── LEFT: content ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="adp-card" style={{ padding: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => {
                const t = e.target.value;
                setForm(f => ({ ...f, title: t, slug: f.slug || t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));
              }} placeholder="Blog post title…" required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 16, fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div className="adp-card" style={{ padding: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Content</label>
              <BlogEditor
                initialBlocks={blocks.length ? blocks : jsonToBlocks("")}
                onChange={setBlocks}
                uploadFn={uploadBlockImage}
              />
            </div>
          </div>

          {/* ── RIGHT: settings ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20 }}>
            <div className="adp-card" style={{ padding: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Settings</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-slug"
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--a-border)", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--a-border)", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                    <option value="">— None —</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Author Name</label>
                  <input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} placeholder="e.g. Shahid Mahmood"
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--a-border)", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Excerpt</label>
                  <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Short summary…" rows={2}
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--a-border)", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                  <input type="checkbox" id="pub" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--a-gold)" }} />
                  <label htmlFor="pub" style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Publish immediately</label>
                </div>
              </div>
            </div>

            <div className="adp-card" style={{ padding: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Cover Images</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Desktop / Main Cover</label>
                  <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
                    style={{ fontSize: 12, width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--a-muted)", display: "block", marginBottom: 4 }}>Mobile Cover <span style={{ color: "#aaa", fontWeight: 400 }}>(optional, shown on phones)</span></label>
                  <input type="file" accept="image/*" onChange={e => setMobileFile(e.target.files?.[0] ?? null)}
                    style={{ fontSize: 12, width: "100%" }} />
                </div>
              </div>
            </div>

            {error && <div style={{ padding: "10px 14px", background: "var(--a-red-bg)", color: "var(--a-red)", borderRadius: 8, fontSize: 13 }}>⚠️ {error}</div>}

            <button type="submit" disabled={submitting}
              style={{ padding: "12px", background: "var(--a-gold)", color: "#fff", fontWeight: 800, borderRadius: 8, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Saving…" : editingId ? "Save Changes" : "Publish Post"}
            </button>
          </div>
        </div>
      </form>
    </AdminShell>
  );

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <AdminShell>
      <div className="adp-ph" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2>Blog <em>Posts</em></h2>
          <p>Manage articles, travel guides and announcements</p>
        </div>
        <button onClick={startNew} className="adp-btn adp-btn-p">+ New Post</button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["", ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid", cursor: "pointer", borderColor: filterCat === cat ? "var(--a-gold)" : "var(--a-border)", background: filterCat === cat ? "var(--a-gold)" : "#fff", color: filterCat === cat ? "#fff" : "var(--a-text)" }}>
            {cat || "All"}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: "var(--a-muted)", fontSize: 13 }}>Loading…</p> : (
        <div className="adp-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--a-raised)", borderBottom: "1.5px solid var(--a-border)" }}>
                {["Title", "Category", "Author", "Date", "Status", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--a-muted)", fontSize: 13 }}>No posts found.</td></tr>
              )}
              {filtered.map((b, i) => (
                <tr key={b.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--a-border)" : "none" }}>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--a-muted)" }}>{b.category || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--a-muted)" }}>{b.authorName || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--a-muted)" }}>{new Date(b.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: b.published ? "var(--a-green-bg)" : "var(--a-red-bg)", color: b.published ? "var(--a-green)" : "var(--a-red)" }}>
                      {b.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => startEdit(b)} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid var(--a-border)", borderRadius: 6, cursor: "pointer", background: "#fff" }}>Edit</button>
                    <button onClick={() => togglePublish(b)} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid var(--a-border)", borderRadius: 6, cursor: "pointer", background: "#fff" }}>{b.published ? "Unpublish" : "Publish"}</button>
                    <button onClick={() => deleteBlog(b.id)} style={{ padding: "4px 10px", fontSize: 12, border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", background: "#fff0f0", color: "#ef4444" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

export default function BlogsPage() {
  return <AdminGuard><BlogsInner /></AdminGuard>;
}
