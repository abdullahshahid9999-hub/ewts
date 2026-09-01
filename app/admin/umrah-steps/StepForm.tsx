"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/lib/adminAuthClient";
import { compressImage } from "@/lib/imageCompression";

type Step = { id: string; title: string; description: string | null; imageUrl: string | null; tag: string; sortOrder: number; isActive: boolean };
type ImgMode = "upload" | "url";

const TAGS = [
  { value: "makkah",   label: "🕋 Makkah",   color: "#15803d" },
  { value: "madinah",  label: "🕌 Madinah",   color: "#1d4ed8" },
  { value: "transit",  label: "🚌 Transit",   color: "#7c3aed" },
  { value: "activity", label: "📍 Activity",  color: "#d97706" },
  { value: "flight",   label: "✈ Flight",    color: "#0891b2" },
  { value: "hotel",    label: "🏨 Hotel",     color: "#be185d" },
];

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

  const selectedTag = TAGS.find(t => t.value === tag) ?? TAGS[3];

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

    let token = accessToken;
    if (!token) token = await refresh();
    const url = existing ? `/api/admin/umrah-steps/${existing.id}` : "/api/admin/umrah-steps";
    const res = await fetch(url, { method: existing ? "PATCH" : "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Save failed."); setSaving(false); return; }
    router.push("/admin/umrah-steps");
    router.refresh();
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <button type="button" onClick={() => router.push("/admin/umrah-steps")}
              style={{ background: "none", border: "1px solid var(--a-border)", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "var(--a-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              ← Back
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{existing ? "Edit Step" : "New Step"}</h2>
              <p style={{ margin: 0, fontSize: 11, color: "var(--a-dim)" }}>Step Library · shown as suggestions in package itinerary</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>

            {/* Title */}
            <div style={{ background: "#fff", border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 8, letterSpacing: 0.5 }}>STEP TITLE *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Makkah Hotel Check-in, Ziyarat Tour, Departure Flight"
                autoFocus style={{ fontSize: 15, fontWeight: 600 }} />
            </div>

            {/* Tag selector */}
            <div style={{ background: "#fff", border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 12, letterSpacing: 0.5 }}>CATEGORY</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {TAGS.map(t => (
                  <label key={t.value} onClick={() => setTag(t.value)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 9, cursor: "pointer",
                      border: `2px solid ${tag === t.value ? t.color : "var(--a-border)"}`,
                      background: tag === t.value ? t.color + "12" : "#f9fafb" }}>
                    <input type="radio" name="tag" value={t.value} checked={tag === t.value} onChange={() => setTag(t.value)} style={{ display: "none" }} />
                    <span style={{ fontSize: 18 }}>{t.label.split(" ")[0]}</span>
                    <span style={{ fontSize: 12, fontWeight: tag === t.value ? 700 : 500, color: tag === t.value ? t.color : "var(--a-muted)" }}>
                      {t.label.split(" ").slice(1).join(" ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ background: "#fff", border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 8, letterSpacing: 0.5 }}>DESCRIPTION <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="Details shown when this step is used in a package itinerary…" />
            </div>

            {/* Image */}
            <div style={{ background: "#fff", border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 12, letterSpacing: 0.5 }}>IMAGE <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {(["upload", "url"] as ImgMode[]).map(m => (
                  <button key={m} type="button" onClick={() => setImgMode(m)}
                    style={{ fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 7, border: "1.5px solid", cursor: "pointer",
                      background: imgMode === m ? selectedTag.color : "transparent",
                      color: imgMode === m ? "#fff" : "var(--a-muted)",
                      borderColor: imgMode === m ? selectedTag.color : "var(--a-border)" }}>
                    {m === "upload" ? "📁 Upload File" : "🔗 Paste URL"}
                  </button>
                ))}
              </div>
              {imgMode === "upload"
                ? <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)} />
                : <input placeholder="https://example.com/image.jpg" value={imgUrl} onChange={e => setImgUrl(e.target.value)} />}
              {existing?.imageUrl && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={existing.imageUrl} alt="" style={{ height: 56, width: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--a-border)" }} />
                  <span style={{ fontSize: 11, color: "var(--a-dim)" }}>Current image — upload/paste new to replace</span>
                </div>
              )}
            </div>

            {/* Sort + Active */}
            <div style={{ background: "#fff", border: "1.5px solid var(--a-border)", borderRadius: 12, padding: "18px 20px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", display: "block", marginBottom: 8, letterSpacing: 0.5 }}>SORT ORDER</label>
                <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ maxWidth: 120 }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 16px", borderRadius: 9,
                border: `2px solid ${isActive ? "#16a34a" : "var(--a-border)"}`,
                background: isActive ? "#f0fdf4" : "#f9fafb" }}>
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#16a34a" }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: isActive ? "#15803d" : "var(--a-muted)" }}>{isActive ? "Active" : "Hidden"}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "var(--a-dim)" }}>Show in package itinerary dropdown</p>
                </div>
              </label>
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: 13, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>{error}</p>}

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, paddingBottom: 32 }}>
              <button type="submit" disabled={saving}
                style={{ padding: "13px 0", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 14,
                  background: saving ? "var(--a-border)" : selectedTag.color,
                  color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving…" : existing ? "Save Changes" : "Create Step"}
              </button>
              <button type="button" onClick={() => router.push("/admin/umrah-steps")}
                style={{ padding: "13px 0", borderRadius: 10, border: "1.5px solid var(--a-border)", fontWeight: 600, fontSize: 14, background: "#fff", cursor: "pointer", color: "var(--a-muted)" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
