"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

const CATEGORIES = [
  { value: "all", label: "All services" },
  { value: "umrah", label: "Umrah" },
  { value: "group_ticket", label: "Group Tickets" },
  { value: "insurance", label: "Insurance" },
];

const STATUSES = [
  { value: "all", label: "All statuses" },
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
  expiresAt: string | null;
};

function IssueRequestModal({
  bookingId,
  onClose,
  onDone,
}: {
  bookingId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { accessToken, refresh } = useAgentAuth();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestOtp() {
    setSubmitting(true);
    setError(null);
    const res = await agentFetch("/api/agent-otp/request", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "issue_request" }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send code.");
      return;
    }
    setStep("verify");
  }

  useEffect(() => {
    requestOtp();
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
    if (!verifyRes.ok) {
      setSubmitting(false);
      setError(verifyData.error ?? "Incorrect code.");
      return;
    }

    const issueRes = await agentFetch(`/api/agent/bookings/${bookingId}/issue-request`, accessToken, refresh, {
      method: "POST",
    });
    const issueData = await issueRes.json().catch(() => ({}));
    setSubmitting(false);
    if (!issueRes.ok) {
      setError(issueData.error ?? "Could not request issuance.");
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="font-display text-lg text-[var(--navy)]">Confirm Issuance</h2>
        {step === "request" ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Sending a verification code to your email…</p>
        ) : (
          <form onSubmit={handleVerifyAndIssue} className="mt-4 space-y-3">
            <p className="text-sm text-[var(--muted)]">
              Enter the 6-digit code sent to your registered email.
            </p>
            <input
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm tracking-widest"
              placeholder="000000"
            />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-[var(--navy)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Confirming…" : "Confirm"}
              </button>
            </div>
          </form>
        )}
        {step === "request" && error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
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
    // Single combined query string — both filters are applied together by
    // the API's one where-clause, not two independent calls that could
    // silently clobber each other.
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (status !== "all") params.set("status", status);

    try {
      const res = await agentFetch(`/api/agent/bookings?${params.toString()}`, accessToken, refresh);
      if (!res.ok) {
        setError("Could not load bookings.");
        return;
      }
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [category, status, accessToken, refresh]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mt-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-[var(--navy)]">My Bookings</h1>
        <Link
          href="/agent/bookings/new"
          className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--gold)] hover:text-[var(--navy)]"
        >
          New Booking
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--bdr)] bg-white">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-700">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No bookings match these filters.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--bdr)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-[var(--bdr)] last:border-0">
                  <td className="px-4 py-3 font-medium">{b.bookingRef}</td>
                  <td className="px-4 py-3 capitalize">{b.serviceType.replace("_", " ")}</td>
                  <td className="px-4 py-3 capitalize">{b.status.replace("_", " ")}</td>
                  <td className="px-4 py-3">PKR {b.commission.toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <button
                        onClick={() => setIssuingId(b.id)}
                        className="rounded-lg border border-[var(--gold)] px-3 py-1 text-xs font-medium text-[var(--navy)] hover:bg-[var(--gold-bg)]"
                      >
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

      {issuingId && (
        <IssueRequestModal
          bookingId={issuingId}
          onClose={() => setIssuingId(null)}
          onDone={() => {
            setIssuingId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function AgentBookingsPage() {
  return (
    <AgentGuard>
      <BookingsInner />
    </AgentGuard>
  );
}
