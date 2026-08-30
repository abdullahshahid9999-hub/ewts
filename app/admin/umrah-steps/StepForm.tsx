"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type Step = { id: string; title: string; description: string | null; imageUrl: string | null; tag: string; sortOrder: number; isActive: boolean };
type ImgMode = "upload" | "url";

const TAGS = ["makkah", "madinah", "transit", "activity", "flight", "hotel"];

export default function StepForm({ existing }: { existing?: Step }) {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [tag, setTag] = useState(existing?.tag ?? "activity");
  const [sortOrder, setSortOrder] = useState(String(existing?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [imgMode, setImgMode] = useState<ImgMode>("upload");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState(existing?.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getToken() {
    if (accessToken) return accessToken;
    return await refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    const body = new FormData();
    body.set("title", title.trim());
    body.set("description", description);
    body.set("tag", tag);
    body.set("sortOrder", sortOrder);
    body.set("isActive", String(isActive));
    if (imgMode === "upload" && imgFile) body.set("image", await compressImage(imgFile));
    else if (imgMode === "url" && imgUrl.startsWith("http")) body.set("imageUrl", imgUrl);

    const token = await getToken();
    const url = existing ? `/api/admin/umrah-steps/${existing.id}` : "/api/admin/umrah-steps";
    const method = existing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Save failed."); setSaving(false); return; }
    router.push("/admin/umrah-steps");
    router.refresh();
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button type="button" onClick={() => router.push("/admin/umrah-steps")}
              style={{ fontSize: 13, color: "var(--a-blue)", background: "none", border: "none", cursor: "pointer" }}>
              ← Back to Step Library
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{existing ? "Edit Step" : "New Step"}</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Makkah Hotel Check-in" autoFocus />
            </div>
            <div>
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Optional details shown in itinerary" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>Tag / Category</label>
                <select value={tag} onChange={e => setTag(e.target.value)}>
                  {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label>Sort Order</label>
                <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
              </div>
            </div>
            <div>
              <label>Image</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                {(["upload", "url"] as ImgMode[]).map(m => (
                  <button key={m} type="button" onClick={() => setImgMode(m)}
                    style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1.5px solid", cursor: "pointer",
                      background: imgMode === m ? "var(--a-blue)" : "transparent",
                      color: imgMode === m ? "#fff" : "var(--a-muted)",
                      borderColor: imgMode === m ? "var(--a-blue)" : "var(--a-border)" }}>
                    {m === "upload" ? "📁 Upload" : "🔗 URL"}
                  </button>
                ))}
              </div>
              {imgMode === "upload"
                ? <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)} />
                : <input placeholder="https://…" value={imgUrl} onChange={e => setImgUrl(e.target.value)} />}
              {existing?.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={existing.imageUrl} alt="" style={{ height: 60, objectFit: "cover", borderRadius: 6, marginTop: 8 }} />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              <label htmlFor="isActive" style={{ margin: 0, cursor: "pointer" }}>Active (show in package itinerary dropdown)</label>
            </div>
            {error && <p style={{ color: "var(--a-red)", fontSize: 13 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" className="adp-btn adp-btn-g" disabled={saving} style={{ flex: 1 }}>
                {saving ? "Saving…" : existing ? "Save Changes" : "Create Step"}
              </button>
              <button type="button" className="adp-btn adp-btn-t" onClick={() => router.push("/admin/umrah-steps")} style={{ flex: 1 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
