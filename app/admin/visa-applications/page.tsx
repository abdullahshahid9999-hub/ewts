"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type AppDoc = {
  id: string;
  fileUrl: string;
  fileName: string;
  document: { name: string } | null;
};

type Application = {
  id: string;
  batchRef: string;
  fullName: string;
  passportNumber: string;
  phone: string;
  email: string;
  adults: number;
  children: number;
  infants: number;
  totalPricePkr: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
  visa: { title: string; country: string; type: string };
  documents: AppDoc[];
};

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "more_info_needed", label: "More Info Needed" },
];

const STATUS_PIPELINE = ["pending", "under_review", "approved", "rejected", "more_info_needed"];

function statusPill(s: string) {
  const map: Record<string, string> = {
    pending: "adp-p-pending",
    under_review: "adp-p-confirmed",
    approved: "adp-p-active",
    rejected: "adp-p-cancelled",
    more_info_needed: "adp-p-pending",
  };
  return map[s] ?? "";
}

function VisaApplicationsInner() {
  const { accessToken, refresh } = useAdminAuth();
  const [status, setStatus] = useState("");
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await adminFetch(`/api/admin/visa-applications?${params}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    setApps(data.applications ?? []);
    setLoading(false);
  }, [status, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, newStatus: string, note?: string) {
    setActing(true);
    setError(null);
    const res = await adminFetch(`/api/admin/visa-applications/${id}`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, ...(note !== undefined && { adminNote: note }) }),
    });
    const data = await res.json().catch(() => ({}));
    setActing(false);
    if (!res.ok) { setError(data.error ?? "Could not update."); return; }
    setNoteTarget(null);
    setNoteText("");
    load();
  }

  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <>
      <div className="adp-ph">
        <div>
          <h2>Visa <em>Applications</em></h2>
          <p>Review submitted visa applications and update their status</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#B45309" }}>
            ⚠️ {pendingCount} pending
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#DC2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Status filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className="adp-btn"
            style={{
              padding: "6px 14px", fontSize: 12,
              background: status === s.value ? "var(--a-gold)" : "none",
              color: status === s.value ? "#000" : "var(--a-muted)",
              border: status === s.value ? "none" : "1px solid var(--a-border2)",
              fontWeight: status === s.value ? 700 : 500,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="adp-card">
        <div className="adp-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : apps.length === 0 ? (
            <p className="etd">No applications match this filter.</p>
          ) : (
            <table className="adp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Applicant</th>
                  <th>Visa</th>
                  <th>Travelers</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Batch</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <Fragment key={app.id}>
                    <tr style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                      <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>
                        {new Date(app.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{app.fullName}</div>
                        <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{app.passportNumber}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{app.visa.title}</div>
                        <div style={{ fontSize: 11, color: "var(--a-muted)", textTransform: "capitalize" }}>{app.visa.country} · {app.visa.type}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {app.adults}A {app.children > 0 ? `${app.children}C ` : ""}{app.infants > 0 ? `${app.infants}I` : ""}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 13 }}>
                        {app.totalPricePkr > 0 ? `PKR ${app.totalPricePkr.toLocaleString()}` : "—"}
                      </td>
                      <td>
                        <span className={`adp-pill ${statusPill(app.status)}`}>
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: 10, color: "var(--a-muted)", fontFamily: "monospace" }}>
                        {app.batchRef}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 11, color: "var(--a-muted)" }}>
                          {expandedId === app.id ? "▲ hide" : "▼ details"}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === app.id && (
                      <tr key={`${app.id}-detail`}>
                        <td colSpan={8} style={{ padding: "0 0 12px 0", background: "var(--a-surface)" }}>
                          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                            {/* Left: contact + docs */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                                Contact
                              </div>
                              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                                📞 {app.phone}<br />
                                ✉️ {app.email}
                              </div>

                              {app.documents.length > 0 && (
                                <>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 14, marginBottom: 8 }}>
                                    Uploaded Documents
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {app.documents.map((doc) => (
                                      <a
                                        key={doc.id}
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ fontSize: 12, color: "var(--a-gold)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
                                      >
                                        📎 {doc.document?.name ?? doc.fileName}
                                      </a>
                                    ))}
                                  </div>
                                </>
                              )}

                              {app.adminNote && (
                                <div style={{ marginTop: 12, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E" }}>
                                  📝 Note: {app.adminNote}
                                </div>
                              )}
                            </div>

                            {/* Right: status pipeline actions */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                                Update Status
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {STATUS_PIPELINE.filter((s) => s !== app.status).map((s) => (
                                  s === "more_info_needed" ? (
                                    // More Info Needed always forces a note first
                                    <button
                                      key={s}
                                      disabled={acting}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setNoteTarget(app.id);
                                        setNoteText(app.adminNote ?? "");
                                        setPendingStatus(app.id);
                                      }}
                                      className="adp-btn adp-btn-s"
                                      style={{ justifyContent: "flex-start", background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" }}
                                    >
                                      📋 More Info Needed (add note)
                                    </button>
                                  ) : (
                                    <button
                                      key={s}
                                      disabled={acting}
                                      onClick={(e) => { e.stopPropagation(); updateStatus(app.id, s); }}
                                      className="adp-btn adp-btn-s"
                                      style={{
                                        justifyContent: "flex-start",
                                        textTransform: "capitalize",
                                        background: s === "approved" ? "var(--a-green)" : s === "rejected" ? "var(--a-red)" : undefined,
                                        color: (s === "approved" || s === "rejected") ? "#fff" : undefined,
                                      }}
                                    >
                                      → Mark as {s.replace(/_/g, " ")}
                                    </button>
                                  )
                                ))}
                              </div>

                              {/* Add/update note */}
                              <div style={{ marginTop: 12 }}>
                                {noteTarget === app.id ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)" }}>
                                      {pendingStatus === app.id
                                        ? "📋 Write what info is needed from the applicant:"
                                        : "📝 Admin note (visible to applicant):"}
                                    </div>
                                    <textarea
                                      rows={3}
                                      value={noteText}
                                      onChange={(e) => setNoteText(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder={pendingStatus === app.id
                                        ? "e.g. Please provide a clear bank statement for last 3 months and a recent salary slip..."
                                        : "Internal note for applicant..."}
                                      style={{ width: "100%", padding: "7px 10px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 12, resize: "vertical" }}
                                    />
                                    {pendingStatus === app.id && !noteText.trim() && (
                                      <p style={{ fontSize: 11, color: "var(--a-red)" }}>Note is required when requesting more info.</p>
                                    )}
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <button
                                        disabled={acting || (pendingStatus === app.id && !noteText.trim())}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newStatus = pendingStatus === app.id ? "more_info_needed" : app.status;
                                          updateStatus(app.id, newStatus, noteText);
                                          setPendingStatus(null);
                                        }}
                                        className="adp-btn adp-btn-g adp-btn-s"
                                      >
                                        {pendingStatus === app.id ? "Send to Applicant" : "Save Note"}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setNoteTarget(null); setPendingStatus(null); }}
                                        className="adp-btn adp-btn-s"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setNoteTarget(app.id); setNoteText(app.adminNote ?? ""); setPendingStatus(null); }}
                                    className="adp-btn adp-btn-s"
                                    style={{ fontSize: 11 }}
                                  >
                                    📝 {app.adminNote ? "Edit note" : "Add note"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminVisaApplicationsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <VisaApplicationsInner />
      </AdminShell>
    </AdminGuard>
  );
}
