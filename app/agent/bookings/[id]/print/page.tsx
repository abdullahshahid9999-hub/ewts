"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";
import PrintTicket, { PrintTicketBooking } from "@/components/PrintTicket";

function PrintPageInner() {
  const params = useParams();
  const id = params.id as string;
  const { accessToken, refresh } = useAgentAuth();
  const [booking, setBooking] = useState<PrintTicketBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    // TODO: replace with real invoice layout once owner provides reference
    if (booking?.status !== "issued") {
      setInvoiceMsg("Ticket not issued yet.");
      return;
    }
    setInvoiceMsg("Invoice layout not built yet — owner will provide the reference.");
  }

  if (loading) return <p style={{ padding: 40, textAlign: "center" }}>Loading…</p>;
  if (error || !booking) return <p style={{ padding: 40, textAlign: "center", color: "var(--red)" }}>{error ?? "Booking not found."}</p>;
  if (!booking.groupFlight) {
    return <p style={{ padding: 40, textAlign: "center" }}>This booking has no flight attached — nothing to print.</p>;
  }

  return (
    <div style={{ background: "#eef1f5", minHeight: "100vh" }}>
      <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "center", padding: "20px 0" }}>
        <button onClick={() => window.print()} className="ap-btn ap-btn-gold">Print Ticket</button>
        <button onClick={handlePrintInvoice} className="ap-btn ap-btn-ghost">Print Invoice</button>
      </div>
      {invoiceMsg && (
        <p className="no-print" style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{invoiceMsg}</p>
      )}
      <PrintTicket booking={booking} />
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
