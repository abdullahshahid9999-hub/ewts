"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import PrintTicket, { PrintTicketBooking } from "@/components/PrintTicket";
import PrintInvoice, { PrintInvoiceBooking } from "@/components/PrintInvoice";

type FullBooking = PrintTicketBooking & PrintInvoiceBooking;

function PrintPageInner() {
  const params = useParams();
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
      <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "center", padding: "20px 0" }}>
        <button onClick={() => { setView("ticket"); setInvoiceMsg(null); }} className={view === "ticket" ? "ap-btn ap-btn-gold" : "ap-btn ap-btn-ghost"}>
          Ticket
        </button>
        <button onClick={handlePrintInvoice} className={view === "invoice" ? "ap-btn ap-btn-gold" : "ap-btn ap-btn-ghost"}>
          Invoice
        </button>
        <button onClick={() => window.print()} className="ap-btn ap-btn-gold">Print</button>
      </div>
      {invoiceMsg && (
        <p className="no-print" style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{invoiceMsg}</p>
      )}
      {view === "ticket" ? <PrintTicket booking={booking} /> : <PrintInvoice booking={booking} />}
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
