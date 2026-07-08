"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

const CATEGORIES = [
  { value: "all", label: "All Services" },
  { value: "umrah", label: "Umrah" },
  { value: "group_ticket", label: "Group Tickets" },
  { value: "insurance", label: "Insurance" },
];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "issue_requested", label: "Issue Requested" },
  { value: "issued", label: "Issued" },
  { value: "cancelled", label: "Cancelled" },
];

type Booking = {
  id: string;
  bookingRef: string;
  serviceType: string;
  status: string;
  commission: number;
  createdAt: string;
};

function IssueRequestModal({ bookingId, onClose, onDone }: { bookingId: string; onClose: () => void; onDone: () => void }) {
  const { accessToken, refresh } = useAgentAuth();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setSubmitting(true);
      const res = await agentFetch("/api/agent-otp/request", accessToken, refresh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "issue_request" }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) { setError(data.error ?? "Could not send code."); return; }
      setStep("verify");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerifyAndIssue(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const verifyRes = await agentFetch("/api/agent-otp/verify", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, purpose: "issue_request" }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) { setSubmitting(false); setError(verifyData.error ?? "Incorrect code."); return; }

    const issueRes = await agentFetch(`/api/agent/bookings/${bookingId}/issue-request`, accessToken, refresh, { method: "POST" });
    const issueData = await issueRes.json().catch(() => ({}));
    setSubmitting(false);
    if (!issueRes.ok) { setError(issueData.error ?? "Could not request issuance."); return; }
    onDone();
  }

  return (
    <div className="ap-overlay">
      <div className="ap-modal">
        <div className="ap-mh"><h3>Confirm <span>Issuance</span></h3></div>
        <div className="ap-mc">
          {step === "request" ? (
            <p className="text-sm text-[var(--muted)]">Sending a verification code to your email…</p>
          ) : (
            <form onSubmit={handleVerifyAndIssue}>
              <p className="text-sm text-[var(--muted)] mb-3">Enter the 6-digit code sent to your registered email.</p>
              <div className="ap-otp-boxes">
                <input
                  autoFocus
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="ap-otp-box"
                  style={{ width: "100%", height: "48px", letterSpacing: "0.4em", textAlign: "center" }}
                  placeholder="000000"
                />
              </div>
              {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={onClose} className="ap-btn ap-btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="ap-btn ap-btn-gold flex-1">
                  {submitting ? "Confirming…" : "Confirm"}
                </button>
              </div>
            </form>
          )}
          {step === "request" && error && <p className="text-sm text-red-700 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function BookingsInner() {
  const { accessToken, refresh } = useAgentAuth();
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Single combined query — category + status applied together in one
    // where-clause on the API side, not two calls that could clobber
    // each other.
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (status !== "all") params.set("status", status);
    try {
      const res = await agentFetch(`/api/agent/bookings?${params.toString()}`, accessToken, refresh);
      if (!res.ok) { setError("Could not load bookings."); return; }
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [category, status, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="ap-ph">
        <div>
          <h2>My <span>Bookings</span></h2>
          <p>All your booking history</p>
        </div>
        <Link href="/agent/bookings/new" className="ap-btn ap-btn-gold">New Booking</Link>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div className="ap-tab-bar" style={{ marginBottom: 0, flex: 1 }}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={`ap-tab-btn ${status === t.value ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="ap-field" style={{ padding: "7px 10px", border: "1.5px solid var(--bdr)", borderRadius: "8px", fontSize: "12px" }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="ap-card">
        <div className="ap-tw">
          {loading ? (
            <p className="etd">Loading…</p>
          ) : error ? (
            <p className="etd" style={{ color: "var(--red)" }}>{error}</p>
          ) : bookings.length === 0 ? (
            <p className="etd">No bookings match these filters.</p>
          ) : (
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Ref</th><th>Service</th><th>Status</th><th>Commission</th><th>Created</th><th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bookingRef}</strong></td>
                    <td className="capitalize">{b.serviceType.replace("_", " ")}</td>
                    <td><span className={`ap-pill ap-p-${b.status}`}>{b.status.replace("_", " ")}</span></td>
                    <td>PKR {b.commission.toLocaleString()}</td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <button onClick={() => setIssuingId(b.id)} className="ap-btn ap-btn-ghost" style={{ padding: "5px 10px", fontSize: "11px" }}>
                          Request Issuance
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {issuingId && (
        <IssueRequestModal
          bookingId={issuingId}
          onClose={() => setIssuingId(null)}
          onDone={() => { setIssuingId(null); load(); }}
        />
      )}
    </>
  );
}

export default function AgentBookingsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <BookingsInner />
      </AgentShell>
    </AgentGuard>
  );
}
