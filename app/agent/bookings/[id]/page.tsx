"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type Traveller = { fullName: string; passportNo: string; cnic: string };

type Booking = {
  id: string;
  bookingRef: string;
  serviceType: string;
  status: string;
  sellPrice: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  travellers: Traveller[] | null;
  adults: number | null;
  children: number | null;
  infants: number | null;
  expiresAt: string | null;
  createdAt: string;
  groupFlight: {
    airline: string; route: string; flightNo: string | null; depDate: string | null; depTime: string | null;
  } | null;
  package: { name: string } | null;
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
                  autoFocus required maxLength={6} value={code}
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

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs}s`);
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const expired = remaining === "Expired";
  return (
    <span style={{ color: expired ? "var(--red)" : "var(--gold-dark, #b8860b)", fontWeight: 700 }}>
      {expired ? "PNR hold expired" : `PNR must be issued within ${remaining}`}
    </span>
  );
}

function BookingDetailInner() {
  const { accessToken, refresh } = useAgentAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [printMode, setPrintMode] = useState<"fare" | "nofare" | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    const res = await agentFetch(`/api/agent/bookings/${id}`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Booking not found."); setLoading(false); return; }
    setBooking(data.booking);
    setLoading(false);
  }, [id, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!printMode) return;
    const t = setTimeout(() => {
      window.print();
      setPrintMode(null);
    }, 100);
    return () => clearTimeout(t);
  }, [printMode]);

  async function handleCancel() {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    setCancelling(true);
    const res = await agentFetch(`/api/agent/bookings/${id}/cancel`, accessToken, refresh, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setCancelling(false);
    if (!res.ok) { alert(data.error ?? "Could not cancel booking."); return; }
    setBooking(data.booking);
  }

  if (loading) return <p className="etd">Loading…</p>;
  if (error || !booking) return <p className="etd" style={{ color: "var(--red)" }}>{error ?? "Not found."}</p>;

  const canCancel = booking.status !== "issued" && booking.status !== "cancelled";
  const canIssue = booking.status === "pending" || booking.status === "confirmed";
  const showFare = printMode !== "nofare";

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="ap-ph no-print">
        <div>
          <h2>Booking <span>{booking.bookingRef}</span></h2>
          <p>Reference &amp; confirmation</p>
        </div>
        <span className={`ap-pill ap-p-${booking.status}`}>{booking.status.replace("_", " ")}</span>
      </div>

      {booking.expiresAt && canIssue && (
        <div className="ap-card no-print" style={{ padding: "12px 18px", marginBottom: "14px" }}>
          <ExpiryCountdown expiresAt={booking.expiresAt} />
          <span style={{ opacity: 0.6, fontSize: "12px", marginLeft: "8px" }}>
            (hold expires {new Date(booking.expiresAt).toLocaleString()} — book must be issued before then or the seat/rate may be released)
          </span>
        </div>
      )}

      <div className="ap-card" style={{ padding: "22px", marginBottom: "16px" }}>
        <h3 style={{ marginBottom: "12px" }}>Booking Reference: {booking.bookingRef}</h3>

        {booking.groupFlight && (
          <div style={{ marginBottom: "12px", fontSize: "14px" }}>
            <strong>{booking.groupFlight.airline}</strong> {booking.groupFlight.flightNo ?? ""} — {booking.groupFlight.route}
            <div style={{ opacity: 0.75 }}>{booking.groupFlight.depDate ?? ""} {booking.groupFlight.depTime ?? ""}</div>
          </div>
        )}
        {booking.package && <div style={{ marginBottom: "12px", fontSize: "14px" }}><strong>{booking.package.name}</strong></div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginBottom: "14px" }}>
          <div><strong>Customer:</strong> {booking.customerName}</div>
          <div><strong>Phone:</strong> {booking.customerPhone}</div>
          {booking.customerEmail && <div><strong>Email:</strong> {booking.customerEmail}</div>}
          <div><strong>Pax:</strong> {booking.adults ?? 0} Adult(s), {booking.children ?? 0} Child(ren), {booking.infants ?? 0} Infant(s)</div>
        </div>

        {booking.travellers && booking.travellers.length > 0 && (
          <table className="ap-table" style={{ marginBottom: "14px" }}>
            <thead><tr><th>Passenger</th><th>Passport</th><th>CNIC</th></tr></thead>
            <tbody>
              {booking.travellers.map((t, i) => (
                <tr key={i}><td>{t.fullName}</td><td>{t.passportNo || "—"}</td><td>{t.cnic || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {showFare && (
          <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "16px" }}>
            <span>Total Fare</span>
            <span>PKR {booking.sellPrice.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <button onClick={() => setPrintMode("fare")} className="ap-btn ap-btn-ghost">Print with Fare</button>
        <button onClick={() => setPrintMode("nofare")} className="ap-btn ap-btn-ghost">Print without Fare</button>
        {canIssue && (
          <button onClick={() => setShowIssueModal(true)} className="ap-btn ap-btn-gold">Issue Booking</button>
        )}
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling} className="ap-btn ap-btn-ghost" style={{ color: "var(--red)" }}>
            {cancelling ? "Cancelling…" : "Cancel Booking"}
          </button>
        )}
        <button onClick={() => router.push("/agent/dashboard")} className="ap-btn ap-btn-ghost">Go Back to Dashboard</button>
      </div>

      {showIssueModal && (
        <IssueRequestModal
          bookingId={booking.id}
          onClose={() => setShowIssueModal(false)}
          onDone={() => { setShowIssueModal(false); load(); }}
        />
      )}
    </>
  );
}

export default function AgentBookingDetailPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <BookingDetailInner />
      </AgentShell>
    </AgentGuard>
  );
}
