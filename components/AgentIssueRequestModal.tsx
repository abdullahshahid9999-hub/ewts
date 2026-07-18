"use client";

import { useEffect, useState } from "react";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

export default function AgentIssueRequestModal({ bookingId, onClose, onDone }: { bookingId: string; onClose: () => void; onDone: () => void }) {
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
