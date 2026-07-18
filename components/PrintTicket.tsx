"use client";

import { legsFromFlight } from "@/lib/groupFlightLegs";
import { PrintTopBar, PrintSecondRow, PrintPassengerTable, type PrintTraveller } from "@/components/print/PrintShared";

export type PrintTicketBooking = {
  bookingRef: string;
  ticketNumber: string | null;
  status: string;
  travellers: PrintTraveller[] | null;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
  agent: { fullName: string; phone: string | null; logoUrl: string | null };
  groupFlight: {
    airline: string;
    airlineLogoUrl: string | null;
    route: string;
    baggage: string | null;
    meal: string | null;
    flightNo: string | null;
    depTime: string | null;
    arrTime: string | null;
    legs: unknown;
  } | null;
};

export default function PrintTicket({ booking }: { booking: PrintTicketBooking }) {
  const isIssued = booking.status === "issued";
  const travellers = booking.travellers ?? [];
  const flight = booking.groupFlight;
  const legs = flight ? legsFromFlight(flight as never) : [];
  // Fallback From/To when legs don't carry them (older single-leg rows) —
  // best-effort split of the flight's own route string.
  const [routeFrom, routeTo] = flight?.route?.split(/->|→|-/).map((s) => s.trim()) ?? ["", ""];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#eef1f5", padding: 32, color: "#111", maxWidth: 900, margin: "0 auto" }}>
      <PrintTopBar agent={booking.agent} bookingRef={booking.bookingRef} ticketNumber={booking.ticketNumber} isIssued={isIssued} />
      <PrintSecondRow
        secondaryLogoUrl={flight?.airlineLogoUrl}
        secondaryName={flight?.airline}
        agent={booking.agent}
        createdAt={booking.createdAt}
        issuedAt={booking.issuedAt}
        isIssued={isIssued}
      />
      <PrintPassengerTable travellers={travellers} />

      {/* ITINERARY TABLE */}
      <h3 style={{ marginBottom: 8 }}>Travel Itinerary</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ccc", marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            {["Flight No.", "From", "To", "Dep", "Arrival", "Meal", "Baggage", "Status"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 13 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {legs.length > 0 ? legs.map((leg, i) => (
            <tr key={i}>
              <td style={{ padding: "10px 14px" }}>{leg.flightNo || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{leg.from || routeFrom || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{leg.to || routeTo || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{leg.depTime || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{leg.arrTime || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{flight?.meal ?? "—"}</td>
              <td style={{ padding: "10px 14px" }}>{flight?.baggage ?? "—"}</td>
              <td style={{ padding: "10px 14px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isIssued ? "#e6f7ea" : "#fff6e0",
                    color: isIssued ? "#1a9e46" : "#a06a00",
                  }}
                >
                  {isIssued ? "Confirmed" : "Not Confirmed"}
                </span>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={8} style={{ padding: "10px 14px", color: "#888" }}>No flight details available.</td></tr>
          )}
        </tbody>
      </table>

      {/* TERMS */}
      <h3 style={{ marginBottom: 8 }}>Term &amp; Conditions</h3>
      <div style={{ background: "#fff", border: "1px solid #ccc" }}>
        {[
          "Tickets are non-changeable and non-refundable",
          "Passengers must report at the check-in counter at least 4 hours prior to departure.",
          "Passengers are responsible for ensuring they meet all visa and entry requirements for their destination.",
        ].map((line, i) => (
          <p key={i} style={{ margin: 0, padding: "12px 16px", borderBottom: i < 2 ? "1px solid #eee" : "none", fontSize: 13.5 }}>
            {i + 1}. {line}
          </p>
        ))}
      </div>

      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
