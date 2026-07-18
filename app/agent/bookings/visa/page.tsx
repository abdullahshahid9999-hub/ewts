"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type VisaApp = {
  id: string;
  batchRef: string;
  fullName: string;
  status: string;
  totalPricePkr: number;
  createdAt: string;
  visa: { title: string; country: string; type: string };
  applicants: { id: string; fullName: string; ageGroup: string }[];
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "more_info_needed", label: "More Info Needed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#F3F4F6", fg: "#374151" },
  under_review: { bg: "#FEF9C3", fg: "#854D0E" },
  more_info_needed: { bg: "#FFF7ED", fg: "#C2410C" },
  approved: { bg: "#F0FDF4", fg: "#15803D" },
  rejected: { bg: "#FEF2F2", fg: "#B91C1C" },
};

function VisaBookingsInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [status, setStatus] = useState("all");
  const [apps, setApps] = useState<VisaApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    try {
      const res = await agentFetch(`/api/agent/visa-applications?${params.toString()}`, accessToken, refresh);
      if (!res.ok) { setError("Could not load visa applications."); return; }
      const data = await res.json();
      setApps(data.applications ?? []);
    } finally {
      setLoading(false);
    }
  }, [status, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="ap-ph">
        <div><h2>Visa <span>Applications</span></h2><p>Your visa applications submitted on behalf of customers</p></div>
        <Link href="/agent/visa" className="ap-btn ap-btn-gold">New Application</Link>
      </div>

      <div className="ap-tab-bar" style={{ marginBottom: 12 }}>
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)} className={`ap-tab-btn ${status === t.value ? "active" : ""}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="ap-card">
        <div className="ap-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : error ? (
            <p className="etd" style={{ color: "var(--red)" }}>{error}</p>
          ) : apps.length === 0 ? (
            <p className="etd">No visa applications match these filters.</p>
          ) : (
            <table className="ap-table">
              <thead>
                <tr><th>Reference</th><th>Visa</th><th>Travellers</th><th>Status</th><th>Total</th><th>Created</th></tr>
              </thead>
              <tbody>
                {apps.map((a) => {
                  const c = STATUS_COLORS[a.status] ?? STATUS_COLORS.pending;
                  return (
                    <tr key={a.id}>
                      <td><strong style={{ fontFamily: "monospace", fontSize: 12 }}>{a.batchRef}</strong></td>
                      <td style={{ fontSize: 12.5 }}>
                        <strong>{a.visa.title}</strong>
                        <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>{a.visa.country} · {a.visa.type}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {a.applicants.length > 0
                          ? a.applicants.map((t) => t.fullName.split(" ")[0]).join(", ")
                          : a.fullName}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.fg, padding: "3px 9px", borderRadius: 999, textTransform: "capitalize", whiteSpace: "nowrap" }}>
                          {a.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>PKR {a.totalPricePkr.toLocaleString()}</td>
                      <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default function AgentVisaBookingsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <VisaBookingsInner />
      </AgentShell>
    </AgentGuard>
  );
}
