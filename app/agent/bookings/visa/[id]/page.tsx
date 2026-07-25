"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import { compressImage } from "@/lib/imageCompression";

type Doc = { id: string; fileUrl: string; fileName: string };
type Applicant = { id: string; fullName: string; ageGroup: string; passportNumber: string | null; documents: Doc[] };
type RequiredDoc = { id: string; name: string; isRequired: boolean };
type Application = {
  id: string;
  batchRef: string;
  status: string;
  adminNote: string | null;
  totalPricePkr: number;
  visa: { title: string; country: string; requiredDocuments: RequiredDoc[] };
  applicants: Applicant[];
};

function VisaApplicationDetailInner() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { accessToken, refresh } = useAgentAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, File>>({}); // key: `${applicantId}_${docId}`
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await agentFetch(`/api/agent/visa-applications/${id}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setApp(data.application);
    setLoading(false);
  }, [id, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function setFile(key: string, file: File | null) {
    if (!file) {
      setFiles((f) => { const n = { ...f }; delete n[key]; return n; });
      return;
    }
    const compressed = await compressImage(file);
    setFiles((f) => ({ ...f, [key]: compressed }));
  }

  async function handleSubmit() {
    if (Object.keys(files).length === 0) { setError("Attach at least one document before submitting."); return; }
    setSubmitting(true);
    setError(null);
    const form = new FormData();
    Object.entries(files).forEach(([key, file]) => form.set(`doc_${key}`, file));
    const res = await agentFetch(`/api/agent/visa-applications/${id}`, accessToken, refresh, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Could not upload documents."); return; }
    setSuccess(true);
    setFiles({});
    load();
  }

  if (loading) return <p className="etd">Loading…</p>;
  if (!app) return <p className="etd">Application not found.</p>;

  const needsMoreInfo = app.status === "more_info_needed";

  return (
    <>
      <div className="ap-ph">
        <div>
          <h2>Visa <span>Application</span></h2>
          <p>{app.visa.title} · {app.visa.country} · <span style={{ fontFamily: "monospace" }}>{app.batchRef}</span></p>
        </div>
        <button onClick={() => router.push("/agent/bookings/visa")} className="ap-btn ap-btn-ghost">← Back to list</button>
      </div>

      <div className="ap-card" style={{ padding: 18, marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Status</p>
        <p style={{ fontWeight: 700, textTransform: "capitalize", marginBottom: app.adminNote ? 10 : 0 }}>{app.status.replace(/_/g, " ")}</p>
        {app.adminNote && (
          <div style={{ background: needsMoreInfo ? "#FFF7ED" : "var(--bg)", border: "1px solid var(--bdr)", borderRadius: 8, padding: 12, fontSize: 13 }}>
            📝 {app.adminNote}
          </div>
        )}
      </div>

      {app.applicants.map((a) => (
        <div key={a.id} className="ap-card" style={{ padding: 18, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 4, textTransform: "capitalize" }}>{a.fullName} <span style={{ fontWeight: 400, color: "var(--muted)" }}>({a.ageGroup})</span></p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Passport: {a.passportNumber || "—"}</p>

          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Documents on file</p>
          {a.documents.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: needsMoreInfo ? 14 : 0 }}>None yet.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: needsMoreInfo ? 14 : 0 }}>
              {a.documents.map((d) => (
                <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="ap-btn ap-btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}>
                  📎 {d.fileName}
                </a>
              ))}
            </div>
          )}

          {needsMoreInfo && app.visa.requiredDocuments.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Add / replace a document</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {app.visa.requiredDocuments.map((doc) => {
                  const key = `${a.id}_${doc.id}`;
                  return (
                    <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, minWidth: 140 }}>{doc.name}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ fontSize: 11, flex: 1 }} onChange={(e) => setFile(key, e.target.files?.[0] ?? null)} />
                      {files[key] && <span style={{ color: "#16a34a", fontSize: 11 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ))}

      {needsMoreInfo && (
        <div className="ap-card" style={{ padding: 18 }}>
          {success && <p style={{ fontSize: 12, color: "#15803D", marginBottom: 10 }}>✅ Documents submitted — application moved back to "Under Review".</p>}
          {error && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</p>}
          <button onClick={handleSubmit} disabled={submitting} className="ap-btn ap-btn-gold">
            {submitting ? "Uploading…" : "Submit Documents"}
          </button>
        </div>
      )}
    </>
  );
}

export default function AgentVisaApplicationDetailPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <VisaApplicationDetailInner />
      </AgentShell>
    </AgentGuard>
  );
}
