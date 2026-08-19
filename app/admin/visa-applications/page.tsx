"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";
import { waLinkTo } from "@/lib/whatsapp";
import { APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

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
  applicantCategory: string | null;
  nationality: string | null;
  passportExpiry: string | null;
  adults: number;
  children: number;
  infants: number;
  totalPricePkr: number;
  commission: number | null;
  status: string;
  adminNote: string | null;
  trackingCountry: string | null;
  trackingLink: string | null;
  trackingNumber: string | null;
  finalDocumentUrl: string | null;
  createdAt: string;
  updatedAt: string;
  visa: { title: string; country: string; type: string };
  agent: { fullName: string; agentCode: string } | null;
  applicants?: { id: string; fullName: string; passportNumber: string | null; passportExpiry: string | null; ageGroup: string; nationality: string | null; applicantCategory: string | null; dateOfBirth: string | null; dateOfIssue: string | null; issuingCountry: string | null; documents: { id: string; fileUrl: string; fileName: string }[] }[];
  documents: AppDoc[];
};

// Labels shown to admin — "pending" reads as "Under Consideration" (the
// owner's exact wording: something just came in, from either a direct
// customer or an agent, and hasn't been actioned yet) and there's a new
// "applied" stage between review and a decision, for once the paperwork
// is actually lodged with the embassy/consulate (tracking info attaches
// here).
const STATUS_LABELS: Record<string, string> = {
  pending: "Under Consideration",
  under_review: "Under Review",
  applied: "Applied",
  approved: "Approved",
  rejected: "Rejected",
  more_info_needed: "More Info Needed",
};

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "under_review", label: STATUS_LABELS.under_review },
  { value: "applied", label: STATUS_LABELS.applied },
  { value: "approved", label: STATUS_LABELS.approved },
  { value: "rejected", label: STATUS_LABELS.rejected },
  { value: "more_info_needed", label: STATUS_LABELS.more_info_needed },
];

// Only sensible next steps are offered from each current status — this is
// what stops "aur options" (leftover pipeline buttons) from showing once
// a decision has already been made. Approved/rejected are terminal and
// handled by their own banner further down, not by this map.
const NEXT_STEPS: Record<string, string[]> = {
  pending: ["under_review", "applied", "rejected", "more_info_needed"],
  under_review: ["applied", "approved", "rejected", "more_info_needed"],
  applied: ["approved", "rejected", "more_info_needed"],
  more_info_needed: ["under_review", "applied", "approved", "rejected"],
  approved: [],
  rejected: [],
};

// Rejecting without saying why leaves the applicant (and future-admin-you)
// guessing, same as More Info Needed already required a note for.
const REQUIRES_NOTE = ["rejected", "more_info_needed"];

function statusPill(s: string) {
  const map: Record<string, string> = {
    pending: "adp-p-pending",
    under_review: "adp-p-confirmed",
    applied: "adp-p-confirmed",
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
  // When set, saving the note also transitions the application to this
  // status (used for Reject / More Info Needed, which always require a
  // reason). Null means the note textarea is just being edited/saved on
  // its own, with no status change attached.
  const [pendingAction, setPendingAction] = useState<{ appId: string; status: string } | null>(null);
  // Approve has no note to type (nothing forces a pause before clicking),
  // so it gets its own lightweight "are you sure" step instead of firing
  // instantly — it's a decision the applicant sees right away.
  const [confirmTarget, setConfirmTarget] = useState<{ appId: string; status: string } | null>(null);
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
    setPendingAction(null);
    setConfirmTarget(null);
    load();
  }

  // Opens the expanded row (if not already) and jumps straight into the
  // right flow for a status — used by both the detail-panel buttons and
  // the quick action icons on the collapsed row, so triage doesn't
  // require expanding first just to click Approve/Reject.
  function startAction(appId: string, targetStatus: string, currentNote: string | null) {
    setExpandedId(appId);
    if (REQUIRES_NOTE.includes(targetStatus)) {
      setNoteTarget(appId);
      setNoteText(targetStatus === "more_info_needed" ? (currentNote ?? "") : "");
      setPendingAction({ appId, status: targetStatus });
      setConfirmTarget(null);
    } else if (targetStatus === "approved") {
      setConfirmTarget({ appId, status: targetStatus });
      setNoteTarget(null);
      setPendingAction(null);
    } else {
      updateStatus(appId, targetStatus);
    }
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
                  <th>Source</th>
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
                        <div style={{ fontSize: 10, color: "var(--a-muted)" }}>{(APPLICANT_CATEGORIES as {value:string;label:string}[]).find((c) => c.value === app.applicantCategory)?.label}{app.nationality ? ` · ${app.nationality}` : ""}</div>
                        <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{app.passportNumber}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{app.visa.title}</div>
                        <div style={{ fontSize: 11, color: "var(--a-muted)", textTransform: "capitalize" }}>{app.visa.country} · {app.visa.type}</div>
                      </td>
                      <td>
                        {app.agent ? (
                          <span
                            title={`Agent code ${app.agent.agentCode}`}
                            style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "#F3E8FF", border: "1px solid #E9D5FF", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}
                          >
                            🧑‍💼 {app.agent.fullName}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--a-muted)" }}>Direct (B2C)</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {app.adults}A {app.children > 0 ? `${app.children}C ` : ""}{app.infants > 0 ? `${app.infants}I` : ""}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: 13 }}>
                        {app.totalPricePkr > 0 ? `PKR ${app.totalPricePkr.toLocaleString()}` : "—"}
                        {app.agent && app.commission !== null && (
                          <div style={{ fontSize: 10, color: "var(--a-muted)" }}>Commission: PKR {app.commission.toLocaleString()}</div>
                        )}
                      </td>
                      <td>
                        <span className={`adp-pill ${statusPill(app.status)}`}>
                          {STATUS_LABELS[app.status] ?? app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: 10, color: "var(--a-muted)", fontFamily: "monospace" }}>
                        {app.batchRef}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                          {NEXT_STEPS[app.status]?.includes("approved") && (
                            <button
                              title="Approve"
                              onClick={(e) => { e.stopPropagation(); startAction(app.id, "approved", app.adminNote); }}
                              className="adp-btn adp-btn-s"
                              style={{ padding: "4px 8px", background: "var(--a-green)", color: "#fff" }}
                            >
                              ✓
                            </button>
                          )}
                          {NEXT_STEPS[app.status]?.includes("rejected") && (
                            <button
                              title="Reject"
                              onClick={(e) => { e.stopPropagation(); startAction(app.id, "rejected", app.adminNote); }}
                              className="adp-btn adp-btn-s"
                              style={{ padding: "4px 8px", background: "var(--a-red)", color: "#fff" }}
                            >
                              ✕
                            </button>
                          )}
                          <span style={{ fontSize: 11, color: "var(--a-muted)" }}>
                            {expandedId === app.id ? "▲ hide" : "▼ details"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === app.id && (
                      <tr key={`${app.id}-detail`}>
                        <td colSpan={9} style={{ padding: "0 0 12px 0", background: "var(--a-surface)" }}>
                          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ padding: "16px 20px", gap: 20 }}>

                            {/* Left: contact + docs */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                                Contact
                              </div>
                              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                                📞 {app.phone}<br />
                                ✉️ {app.email}
                              </div>
                              {app.phone && (
                                <a
                                  href={waLinkTo(app.phone, `Assalam o Alaikum ${app.fullName}! Apki visa application (Ref: ${app.batchRef}) ka update: status abhi "${STATUS_LABELS[app.status] ?? app.status}" hai. East & West Travel Services`)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="adp-btn adp-btn-s"
                                  style={{ marginTop: 8, display: "inline-block", background: "#25D366", color: "#fff", textDecoration: "none" }}
                                >
                                  💬 Notify on WhatsApp
                                </a>
                              )}

                              {app.applicants && app.applicants.length > 0 && (
                                <>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 14, marginBottom: 8 }}>
                                    Travellers ({app.applicants.length})
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {app.applicants.map((a, i) => (
                                      <div key={a.id} style={{ fontSize: 12, background: "var(--a-surface,#f8f9fb)", borderRadius: 8, padding: "8px 10px" }}>
                                        <strong>{i + 1}. {a.fullName}</strong>{" "}
                                        <span style={{ color: "var(--a-muted)", textTransform: "capitalize" }}>({a.ageGroup})</span>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", marginTop: 4, fontSize: 11, color: "var(--a-muted)" }}>
                                          {a.passportNumber && <span>🛂 Passport: <strong style={{color:"var(--a-text)"}}>{a.passportNumber}</strong></span>}
                                          {a.passportExpiry && <span>📅 Expiry: <strong style={{color:"var(--a-text)"}}>{a.passportExpiry.slice(0,10)}</strong></span>}
                                          {a.dateOfBirth && <span>🎂 DOB: <strong style={{color:"var(--a-text)"}}>{new Date(a.dateOfBirth).toLocaleDateString("en-PK")}</strong></span>}
                                          {a.dateOfIssue && <span>📋 Issue Date: <strong style={{color:"var(--a-text)"}}>{new Date(a.dateOfIssue).toLocaleDateString("en-PK")}</strong></span>}
                                          {a.issuingCountry && <span>🌍 Issued In: <strong style={{color:"var(--a-text)"}}>{a.issuingCountry}</strong></span>}
                                          {a.nationality && <span>🏳️ Nationality: <strong style={{color:"var(--a-text)"}}>{a.nationality}</strong></span>}
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                                          {a.documents.map((doc) => (
                                            <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--a-gold)", fontWeight: 600 }}>
                                              📎 {doc.fileName}
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}

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

                            {/* Right: status actions */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                                {app.status === "approved" || app.status === "rejected" ? "Decision" : "Update Status"}
                              </div>

                              {app.status === "approved" || app.status === "rejected" ? (
                                // TERMINAL STATE — this is the fix for "approve/reject ke
                                // baad bhi options aate hain": once a decision is made, the
                                // full button pipeline goes away and is replaced by a single
                                // clear banner, with just one low-emphasis way back
                                // (Reopen) in case of a mistake — not five more buttons.
                                <div
                                  style={{
                                    borderRadius: 10,
                                    padding: "12px 14px",
                                    background: app.status === "approved" ? "#F0FDF4" : "#FEF2F2",
                                    border: `1px solid ${app.status === "approved" ? "#BBF7D0" : "#FECACA"}`,
                                  }}
                                >
                                  <div style={{ fontSize: 13, fontWeight: 700, color: app.status === "approved" ? "#15803D" : "#B91C1C", display: "flex", alignItems: "center", gap: 6 }}>
                                    {app.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                                  </div>
                                  <div style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 2 }}>
                                    Decided {new Date(app.updatedAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                  {app.adminNote && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>📝 {app.adminNote}</div>
                                  )}
                                  <button
                                    disabled={acting}
                                    onClick={(e) => { e.stopPropagation(); updateStatus(app.id, "under_review"); }}
                                    className="adp-btn adp-btn-s"
                                    style={{ marginTop: 10, fontSize: 11, background: "none" }}
                                  >
                                    ↺ Reopen for Review
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {NEXT_STEPS[app.status]?.map((s) => (
                                      <button
                                        key={s}
                                        disabled={acting}
                                        onClick={(e) => { e.stopPropagation(); startAction(app.id, s, app.adminNote); }}
                                        className="adp-btn adp-btn-s"
                                        style={{
                                          justifyContent: "flex-start",
                                          textTransform: "capitalize",
                                          background: s === "approved" ? "var(--a-green)" : s === "rejected" ? "var(--a-red)" : s === "more_info_needed" ? "#FFF7ED" : undefined,
                                          color: (s === "approved" || s === "rejected") ? "#fff" : s === "more_info_needed" ? "#C2410C" : undefined,
                                          border: s === "more_info_needed" ? "1px solid #FED7AA" : undefined,
                                        }}
                                      >
                                        {s === "approved" ? "✓ Approve" : s === "rejected" ? "✕ Reject" : s === "more_info_needed" ? "📋 More Info Needed (add note)" : s === "applied" ? "📨 Mark as Applied" : `→ Mark as ${STATUS_LABELS[s] ?? s.replace(/_/g, " ")}`}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Inline confirm — Approve is one click with no note to
                                      slow it down otherwise, so it gets a short "are you
                                      sure" instead of firing immediately. */}
                                  {confirmTarget?.appId === app.id && (
                                    <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                                      <div style={{ fontSize: 12, color: "#15803D", marginBottom: 8 }}>
                                        Approve this application? The applicant will be notified.
                                      </div>
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                          disabled={acting}
                                          onClick={(e) => { e.stopPropagation(); updateStatus(app.id, "approved"); }}
                                          className="adp-btn adp-btn-s"
                                          style={{ background: "var(--a-green)", color: "#fff" }}
                                        >
                                          Yes, Approve
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setConfirmTarget(null); }}
                                          className="adp-btn adp-btn-s"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Tracking info — visible once "Applied" (or later, as a
                                  read-only record). Uploading the final document is what
                                  actually emails the applicant/agent — not a separate,
                                  easy-to-forget step. */}
                              {(app.status === "applied" || app.trackingLink || app.finalDocumentUrl) && (
                                <TrackingPanel app={app} accessToken={accessToken} refresh={refresh} onDone={load} acting={acting} />
                              )}

                              {/* Note editor — shared by the Reject / More Info Needed
                                  flows (status change gated on a reason via pendingAction)
                                  and by a plain "Add/Edit note" with no status change. */}
                              <div style={{ marginTop: 12 }}>
                                {noteTarget === app.id ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)" }}>
                                      {pendingAction?.appId === app.id
                                        ? pendingAction.status === "rejected"
                                          ? "❌ Reason for rejection (visible to applicant):"
                                          : "📋 Write what info is needed from the applicant:"
                                        : "📝 Admin note (visible to applicant):"}
                                    </div>
                                    <textarea
                                      rows={3}
                                      value={noteText}
                                      onChange={(e) => setNoteText(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder={
                                        pendingAction?.appId === app.id
                                          ? pendingAction.status === "rejected"
                                            ? "e.g. Bank statement does not meet the minimum balance requirement for this visa type..."
                                            : "e.g. Please provide a clear bank statement for last 3 months and a recent salary slip..."
                                          : "Internal note for applicant..."
                                      }
                                      style={{ width: "100%", padding: "7px 10px", border: "1.5px solid var(--a-border)", borderRadius: 8, fontSize: 12, resize: "vertical" }}
                                    />
                                    {pendingAction?.appId === app.id && !noteText.trim() && (
                                      <p style={{ fontSize: 11, color: "var(--a-red)" }}>
                                        A reason is required when {pendingAction.status === "rejected" ? "rejecting" : "requesting more info"}.
                                      </p>
                                    )}
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <button
                                        disabled={acting || (pendingAction?.appId === app.id && !noteText.trim())}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newStatus = pendingAction?.appId === app.id ? pendingAction.status : app.status;
                                          updateStatus(app.id, newStatus, noteText);
                                        }}
                                        className="adp-btn adp-btn-g adp-btn-s"
                                      >
                                        {pendingAction?.appId === app.id
                                          ? pendingAction.status === "rejected" ? "Reject & Send Reason" : "Send to Applicant"
                                          : "Save Note"}
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setNoteTarget(null); setPendingAction(null); }}
                                        className="adp-btn adp-btn-s"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setNoteTarget(app.id); setNoteText(app.adminNote ?? ""); setPendingAction(null); setConfirmTarget(null); }}
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

// Tracking info (country/link/number) + final document upload — kept as
// its own component since it has its own local form state, separate from
// the parent's note/status-action state machine.
function TrackingPanel({
  app, accessToken, refresh, onDone, acting,
}: {
  app: Application; accessToken: string | null; refresh: () => Promise<string | null>; onDone: () => void; acting: boolean;
}) {
  const [country, setCountry] = useState(app.trackingCountry ?? "");
  const [link, setLink] = useState(app.trackingLink ?? "");
  const [number, setNumber] = useState(app.trackingNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function saveTracking() {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    const res = await adminFetch(`/api/admin/visa-applications/${app.id}/tracking`, accessToken, refresh, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingCountry: country, trackingLink: link, trackingNumber: number }),
    });
    setSaving(false);
    if (!res.ok) { setError("Could not save tracking info."); return; }
    setSavedMsg("Saved.");
    onDone();
  }

  async function uploadDocument(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.set("document", file);
    const res = await adminFetch(`/api/admin/visa-applications/${app.id}/document`, accessToken, refresh, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Could not upload document."); return; }
    onDone();
  }

  if (app.finalDocumentUrl) {
    return (
      <div style={{ marginTop: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#15803D" }}>✅ Visa document delivered</div>
        <a href={app.finalDocumentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--a-gold)", fontWeight: 600 }}>📎 View document</a>
        {app.trackingCountry && <div style={{ fontSize: 11, color: "var(--a-muted)", marginTop: 4 }}>{app.trackingCountry}{app.trackingNumber ? ` · ${app.trackingNumber}` : ""}</div>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, background: "#F8FAFC", border: "1px solid var(--a-border)", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted)", textTransform: "uppercase", marginBottom: 8 }}>
        📍 Tracking Info
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country (e.g. UAE)" style={{ fontSize: 12, padding: "6px 10px", border: "1px solid var(--a-border)", borderRadius: 6 }} />
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Tracking portal link" style={{ fontSize: 12, padding: "6px 10px", border: "1px solid var(--a-border)", borderRadius: 6 }} />
        <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Tracking / application number" style={{ fontSize: 12, padding: "6px 10px", border: "1px solid var(--a-border)", borderRadius: 6 }} />
      </div>
      {error && <p style={{ fontSize: 11, color: "var(--a-red)", marginBottom: 6 }}>{error}</p>}
      {savedMsg && <p style={{ fontSize: 11, color: "#15803D", marginBottom: 6 }}>{savedMsg}</p>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <button disabled={saving || acting} onClick={saveTracking} className="adp-btn adp-btn-s">
          {saving ? "Saving…" : "Save"}
        </button>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="adp-btn adp-btn-s" style={{ textDecoration: "none" }}>
            🔗 Check Status
          </a>
        )}
      </div>
      <div style={{ borderTop: "1px dashed var(--a-border)", paddingTop: 10 }}>
        <label className="adp-btn adp-btn-g adp-btn-s" style={{ cursor: "pointer", display: "inline-block" }}>
          {uploading ? "Uploading…" : "📄 Upload Visa & Email Applicant"}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f); e.target.value = ""; }}
          />
        </label>
        <p style={{ fontSize: 10, color: "var(--a-muted)", marginTop: 4 }}>
          Uploading here marks Approved and automatically emails the visa to the applicant{app.agent ? " and agent" : ""}.
        </p>
      </div>
    </div>
  );
}
