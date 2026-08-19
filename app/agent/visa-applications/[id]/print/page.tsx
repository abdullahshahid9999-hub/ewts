"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import { APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

type Applicant = {
  id: string; fullName: string; ageGroup: string;
  passportNumber: string | null; passportExpiry: string | null;
  dateOfBirth: string | null; dateOfIssue: string | null;
  issuingCountry: string | null; nationality: string | null;
  applicantCategory: string | null;
  documents: { id: string; fileUrl: string; fileName: string }[];
};
type Application = {
  id: string; batchRef: string; status: string; totalPricePkr: number;
  createdAt: string;
  visa: { title: string; country: string; type: string };
  applicants: Applicant[];
};

function fmt(d: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d.slice(0, 10); }
}

function statusLabel(s: string) {
  return ({ pending: "Pending Review", under_review: "Under Review", approved: "Approved", rejected: "Rejected", more_info: "More Info Needed" } as Record<string, string>)[s] ?? s;
}

export default function VisaApplicationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, refresh, agent } = useAgentAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      const res = await agentFetch("/api/agent/visa-applications", accessToken, refresh);
      if (!res.ok) { setError("Could not load applications."); setLoading(false); return; }
      const data = await res.json();
      const found = (data.applications as Application[]).find((a) => a.id === id);
      if (!found) { setError("Application not found."); setLoading(false); return; }
      setApp(found);
      setLoading(false);
    })();
  }, [accessToken, id, refresh]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading…</div>;
  if (error || !app) return <div style={{ padding: 40, color: "red" }}>{error ?? "Not found."}</div>;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { font-family: Arial, sans-serif; background: #fff; color: #111; }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print" style={{ padding: "12px 24px", background: "#0A1930", display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => window.print()} style={{ background: "#d4a843", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>🖨️ Print / Save PDF</button>
        <button onClick={() => window.history.back()} style={{ background: "transparent", color: "#aaa", border: "1px solid #444", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>← Back</button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #0A1930" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {agent?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agent.logoUrl} alt="Agency Logo" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb" }} />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#0A1930" }}>{agent?.fullName ?? "East & West Travel Services"}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{agent?.agentCode} &nbsp;·&nbsp; East &amp; West Travel Services</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0A1930" }}>Visa Application Summary</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Ref: <strong>{app.batchRef}</strong></div>
            <div style={{ fontSize: 12, color: "#666" }}>Date: {fmt(app.createdAt)}</div>
            <div style={{ marginTop: 6, display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: app.status === "approved" ? "#d1fae5" : app.status === "rejected" ? "#fee2e2" : "#fef3c7",
              color: app.status === "approved" ? "#065f46" : app.status === "rejected" ? "#991b1b" : "#92400e" }}>
              {statusLabel(app.status)}
            </div>
          </div>
        </div>

        {/* Visa Info */}
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "#f8f9fb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#0A1930" }}>Visa Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: "#666", fontSize: 11 }}>Destination</span><br /><strong>{app.visa.country}</strong></div>
            <div><span style={{ color: "#666", fontSize: 11 }}>Visa Type</span><br /><strong>{app.visa.title}</strong></div>
            <div><span style={{ color: "#666", fontSize: 11 }}>Total Price</span><br /><strong>PKR {app.totalPricePkr.toLocaleString()}</strong></div>
          </div>
        </div>

        {/* Travellers */}
        <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1930", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Travellers ({app.applicants.length})
        </div>
        {app.applicants.map((a, i) => (
          <div key={a.id} style={{ marginBottom: 16, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: "#0A1930", color: "#fff", padding: "8px 14px", fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
              <span>{i + 1}. {a.fullName}</span>
              <span style={{ fontSize: 11, fontWeight: 400, textTransform: "capitalize", opacity: 0.8 }}>
                {a.ageGroup}{a.applicantCategory ? ` · ${APPLICANT_CATEGORIES.find(c => c.value === a.applicantCategory)?.label ?? a.applicantCategory}` : ""}
              </span>
            </div>
            <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px", fontSize: 12 }}>
              <div><span style={{ color: "#666", fontSize: 11 }}>Passport No.</span><br /><strong>{a.passportNumber ?? "—"}</strong></div>
              <div><span style={{ color: "#666", fontSize: 11 }}>Passport Expiry</span><br /><strong>{fmt(a.passportExpiry)}</strong></div>
              <div><span style={{ color: "#666", fontSize: 11 }}>Date of Birth</span><br /><strong>{fmt(a.dateOfBirth)}</strong></div>
              <div><span style={{ color: "#666", fontSize: 11 }}>Issue Date</span><br /><strong>{fmt(a.dateOfIssue)}</strong></div>
              <div><span style={{ color: "#666", fontSize: 11 }}>Issuing Country</span><br /><strong>{a.issuingCountry ?? "—"}</strong></div>
              <div><span style={{ color: "#666", fontSize: 11 }}>Nationality</span><br /><strong>{a.nationality ?? "—"}</strong></div>
            </div>
            {a.documents.length > 0 && (
              <div style={{ padding: "0 14px 10px", borderTop: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4, marginTop: 8 }}>Documents Uploaded</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {a.documents.map((doc) => (
                    <span key={doc.id} style={{ fontSize: 11, background: "#f3f4f6", borderRadius: 4, padding: "2px 8px" }}>📎 {doc.fileName}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #e5e7eb", fontSize: 11, color: "#999", display: "flex", justifyContent: "space-between" }}>
          <span>East &amp; West Travel Services — Faisalabad, Pakistan</span>
          <span>Printed: {new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
      </div>
    </>
  );
}
