"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type Step = { id: string; title: string; description: string | null; imageUrl: string | null; tag: string; sortOrder: number; isActive: boolean };

const TAG_COLOR: Record<string, string> = {
  makkah: "#15803d", madinah: "#1d4ed8", transit: "#7c3aed",
  activity: "#d97706", flight: "#0891b2", hotel: "#be185d",
};

export default function UmrahStepsPage() {
  const router = useRouter();
  const { accessToken, refresh } = useAdminAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminFetch("/api/admin/umrah-steps", accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setSteps(data.steps ?? []);
    setLoading(false);
  }, [accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function deleteStep(id: string) {
    if (!confirm("Delete this step?")) return;
    await adminFetch(`/api/admin/umrah-steps/${id}`, accessToken, refresh, { method: "DELETE" });
    load();
  }

  async function toggleActive(step: Step) {
    const body = new FormData();
    body.set("isActive", String(!step.isActive));
    await adminFetch(`/api/admin/umrah-steps/${step.id}`, accessToken, refresh, { method: "PATCH", body });
    load();
  }

  // Drag reorder
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
    const items = steps.map((s, idx) => ({ id: s.id, sortOrder: idx }));
    await adminFetch("/api/admin/umrah-steps", accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Umrah Step Library</h2>
              <p style={{ fontSize: 12, color: "var(--a-dim)", marginTop: 4 }}>Drag to reorder · Steps appear as suggestions in package itinerary</p>
            </div>
            <button onClick={() => router.push("/admin/umrah-steps/new")} className="adp-btn adp-btn-g">
              + New Step
            </button>
          </div>

          {saving && <p style={{ fontSize: 12, color: "var(--a-blue)", marginBottom: 10 }}>Saving order…</p>}

          {loading ? <p style={{ color: "var(--a-dim)" }}>Loading…</p> : steps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--a-dim)" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
              <p>No steps yet. Create your first step to build the library.</p>
              <button onClick={() => router.push("/admin/umrah-steps/new")} className="adp-btn adp-btn-g" style={{ marginTop: 12 }}>
                + New Step
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {steps.map((step, i) => (
                <div key={step.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    border: "1.5px solid var(--a-border)", borderRadius: 10,
                    background: dragIdx === i ? "#f0f4ff" : "#fff",
                    cursor: "grab", opacity: step.isActive ? 1 : 0.5,
                  }}>
                  <span style={{ color: "var(--a-dim)", fontSize: 16, cursor: "grab" }}>⠿</span>
                  {step.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={step.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{step.title}</p>
                    {step.description && <p style={{ fontSize: 11, color: "var(--a-dim)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{step.description}</p>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: (TAG_COLOR[step.tag] ?? "#666") + "18", color: TAG_COLOR[step.tag] ?? "#666" }}>
                    {step.tag}
                  </span>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(step)} className="adp-btn adp-btn-t" style={{ fontSize: 11, padding: "4px 8px" }}>
                      {step.isActive ? "Hide" : "Show"}
                    </button>
                    <button onClick={() => router.push(`/admin/umrah-steps/${step.id}`)} className="adp-btn adp-btn-t" style={{ fontSize: 11, padding: "4px 8px" }}>
                      Edit
                    </button>
                    <button onClick={() => deleteStep(step.id)} className="adp-btn adp-btn-r" style={{ fontSize: 11, padding: "4px 8px" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
