"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import PrintTicket, { PrintTicketBooking } from "@/components/PrintTicket";
import PrintInvoice, { PrintInvoiceBooking } from "@/components/PrintInvoice";

type FullBooking = PrintTicketBooking & PrintInvoiceBooking;

function PrintPageInner() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { accessToken, refresh } = useAgentAuth();
  const [booking, setBooking] = useState<FullBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"ticket" | "invoice">("ticket");
  const [invoiceMsg, setInvoiceMsg] = useState<string | null>(null);

  useEffect(() => {
    agentFetch(`/api/agent/bookings/${id}`, accessToken, refresh).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Could not load booking."); setLoading(false); return; }
      setBooking(data.booking);
      setLoading(false);
    });
  }, [id, accessToken, refresh]);

  function handlePrintInvoice() {
    if (booking?.status !== "issued") {
      setInvoiceMsg("Ticket not issued yet.");
      return;
    }
    setInvoiceMsg(null);
    setView("invoice");
  }

  if (loading) return <p style={{ padding: 40, textAlign: "center" }}>Loading…</p>;
  if (error || !booking) return <p style={{ padding: 40, textAlign: "center", color: "var(--red)" }}>{error ?? "Booking not found."}</p>;
  if (!booking.groupFlight) {
    return <p style={{ padding: 40, textAlign: "center" }}>This booking has no flight attached — nothing to print.</p>;
  }

  return (
    <div style={{ background: "#eef1f5", minHeight: "100vh" }}>
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 900,
          margin: "0 auto",
          padding: "20px 24px 0",
        }}
      >
        {/* Ticket / Invoice — segmented toggle, left-aligned */}
        <div
          style={{
            display: "inline-flex",
            background: "#fff",
            border: "1px solid var(--border, #e2e2e2)",
            borderRadius: 10,
            padding: 4,
            gap: 4,
          }}
        >
          <button
            onClick={() => { setView("ticket"); setInvoiceMsg(null); }}
            className="ap-btn"
            style={{
              background: view === "ticket" ? "var(--gold, #c9a24d)" : "transparent",
              color: view === "ticket" ? "#1a1a1a" : "var(--muted, #666)",
              border: "none",
              borderRadius: 7,
              padding: "8px 18px",
              fontWeight: 600,
              transition: "background .15s",
            }}
          >
            Ticket
          </button>
          <button
            onClick={handlePrintInvoice}
            className="ap-btn"
            style={{
              background: view === "invoice" ? "var(--gold, #c9a24d)" : "transparent",
              color: view === "invoice" ? "#1a1a1a" : "var(--muted, #666)",
              border: "none",
              borderRadius: 7,
              padding: "8px 18px",
              fontWeight: 600,
              transition: "background .15s",
            }}
          >
            Invoice
          </button>
        </div>

        {/* Print / Dashboard / Cancel — right-aligned action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/agent/dashboard"
            className="ap-btn"
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid var(--border, #e2e2e2)",
              color: "var(--muted, #666)",
              borderRadius: 8,
              padding: "9px 16px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Dashboard
          </a>
          <button
            onClick={() => router.back()}
            className="ap-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid var(--border, #e2e2e2)",
              color: "#c0392b",
              borderRadius: 8,
              padding: "9px 16px",
              fontWeight: 600,
            }}
          >
            ✕ Cancel
          </button>
          <button
            onClick={() => window.print()}
            className="ap-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--gold, #c9a24d)",
              border: "none",
              color: "#1a1a1a",
              borderRadius: 8,
              padding: "9px 18px",
              fontWeight: 700,
            }}
            title="Opens the print dialog — choose 'Save as PDF' as the destination to download"
          >
            🖨️ Print / Download PDF
          </button>
        </div>
      </div>

      {invoiceMsg && (
        <p className="no-print" style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 10, marginBottom: 0 }}>{invoiceMsg}</p>
      )}
      <div style={{ paddingTop: 20 }}>
        {view === "ticket" ? <PrintTicket booking={booking} /> : <PrintInvoice booking={booking} />}
      </div>
    </div>
  );
}

export default function AgentBookingPrintPage() {
  return (
    <AgentGuard>
      <PrintPageInner />
    </AgentGuard>
  );
}
