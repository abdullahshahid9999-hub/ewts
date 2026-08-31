"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type Step = { id: string; title: string; description: string | null; imageUrl: string | null; tag: string; sortOrder: number; isActive: boolean };

const TAG_COLOR: Record<string, { bg: string; text: string }> = {
  makkah:   { bg: "#dcfce7", text: "#15803d" },
  madinah:  { bg: "#dbeafe", text: "#1d4ed8" },
  transit:  { bg: "#ede9fe", text: "#7c3aed" },
  activity: { bg: "#fef3c7", text: "#d97706" },
  flight:   { bg: "#e0f2fe", text: "#0891b2" },
  hotel:    { bg: "#fce7f3", text: "#be185d" },
};

export default function UmrahStepsPage() {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterTag, setFilterTag] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/umrah-steps", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSteps(data.steps ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function deleteStep(id: string) {
    if (!confirm("Delete this step permanently?")) return;
    await adminFetch(`/api/admin/umrah-steps/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  async function toggleActive(step: Step) {
    const body = new FormData();
    body.set("isActive", String(!step.isActive));
    await adminFetch(`/api/admin/umrah-steps/${step.id}`, accessToken, refresh, { method: "PATCH", body });
    load();
  }

  function onDragStart(i: number) { setDragIdx(i); }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...steps];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setDragIdx(i);
    setSteps(next);
  }
  async function onDragEnd() {
    setDragIdx(null);
    setSaving(true);
    await adminFetch("/api/admin/umrah-steps", accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: steps.map((s, idx) => ({ id: s.id, sortOrder: idx })) }),
    });
    setSaving(false);
  }

  const tags = ["all", ...Array.from(new Set(steps.map(s => s.tag)))];
  const filtered = filterTag === "all" ? steps : steps.filter(s => s.tag === filterTag);

  return (
    <AdminGuard>
      <AdminShell>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Umrah Step Library</h2>
              <p style={{ fontSize: 12, color: "var(--a-dim)", marginTop: 4 }}>
                Reusable steps for package itineraries · Drag to reorder · {steps.length} step{steps.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={() => router.push("/admin/umrah-steps/new")} className="adp-btn adp-btn-g" style={{ whiteSpace: "nowrap" }}>
              + New Step
            </button>
          </div>

          {/* Filter tags */}
          {steps.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {tags.map(t => {
                const col = TAG_COLOR[t] ?? { bg: "#f1f5f9", text: "#64748b" };
                const active = filterTag === t;
                return (
                  <button key={t} onClick={() => setFilterTag(t)}
                    style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1.5px solid",
                      background: active ? (col.text) : col.bg,
                      color: active ? "#fff" : col.text,
                      borderColor: col.text, cursor: "pointer", textTransform: "capitalize" }}>
                    {t === "all" ? `All (${steps.length})` : `${t} (${steps.filter(s => s.tag === t).length})`}
                  </button>
                );
              })}
            </div>
          )}

          {saving && <p style={{ fontSize: 12, color: "var(--a-blue)", marginBottom: 10 }}>⟳ Saving order…</p>}

          {loading ? (
            <p style={{ color: "var(--a-dim)", padding: 20 }}>Loading…</p>
          ) : steps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed var(--a-border)", borderRadius: 12 }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📋</p>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No steps yet</p>
              <p style={{ fontSize: 13, color: "var(--a-dim)", marginBottom: 16 }}>
                Build your library of reusable itinerary steps — hotel check-in, ziyarat, transport, flights, etc.
              </p>
              <button onClick={() => router.push("/admin/umrah-steps/new")} className="adp-btn adp-btn-g">+ Create First Step</button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map((step, i) => {
                const col = TAG_COLOR[step.tag] ?? { bg: "#f1f5f9", text: "#64748b" };
                return (
                  <div key={step.id}
                    draggable
                    onDragStart={() => onDragStart(steps.indexOf(step))}
                    onDragOver={e => onDragOver(e, steps.indexOf(step))}
                    onDragEnd={onDragEnd}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      border: `1.5px solid ${dragIdx === i ? "var(--a-blue)" : "var(--a-border)"}`,
                      borderRadius: 10, background: dragIdx === i ? "#eff6ff" : "#fff",
                      cursor: "grab", opacity: step.isActive ? 1 : 0.5,
                      transition: "border-color 0.15s",
                    }}>
                    <span style={{ color: "var(--a-dim)", fontSize: 18, cursor: "grab", flexShrink: 0 }}>⠿</span>
                    {step.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={step.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: col.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        {step.tag === "makkah" ? "🕋" : step.tag === "madinah" ? "🕌" : step.tag === "flight" ? "✈" : step.tag === "hotel" ? "🏨" : step.tag === "transit" ? "🚌" : "📍"}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{step.title}</p>
                      {step.description && <p style={{ fontSize: 11, color: "var(--a-dim)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{step.description}</p>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: col.bg, color: col.text, flexShrink: 0, textTransform: "capitalize" }}>
                      {step.tag}
                    </span>
                    {!step.isActive && <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>hidden</span>}
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <button onClick={() => toggleActive(step)} className="adp-btn adp-btn-t" style={{ fontSize: 11, padding: "4px 8px" }}>
                        {step.isActive ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => router.push(`/admin/umrah-steps/${step.id}`)} className="adp-btn adp-btn-t" style={{ fontSize: 11, padding: "4px 8px" }}>
                        Edit
                      </button>
                      <button onClick={() => deleteStep(step.id)} className="adp-btn adp-btn-r" style={{ fontSize: 11, padding: "4px 8px" }}>
                        Del
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
