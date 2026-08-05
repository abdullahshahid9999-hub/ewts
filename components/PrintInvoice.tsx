"use client";

import { legsFromFlight } from "@/lib/groupFlightLegs";
import {
  PrintTopBar, PrintSecondRow, PrintPassengerTable, SectionHeading,
  EWTS_AGENCY_NAME, EWTS_PHONE,
  type PrintTraveller,
} from "@/components/print/PrintShared";

export type PrintInvoiceBooking = {
  bookingRef: string;
  ticketNumber: string | null;
  status: string;
  travellers: PrintTraveller[] | null;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
  sellPrice: number;
  commission: number;
  adults: number | null;
  children: number | null;
  infants: number | null;
  agent: { fullName: string; phone: string | null; logoUrl: string | null } | null;
  groupFlight: {
    airline: string;
    airlineLogoUrl: string | null;
    route: string;
    flightNo: string | null;
    baggage: string | null;
    meal: string | null;
    depTime: string | null;
    arrTime: string | null;
    legs: unknown;
  } | null;
};

type FareRow = { label: string; count: number; perPersonFare: number; perPersonCommission: number };

const cell = { padding: "11px 14px", fontSize: 13 } as const;
const headCell = {
  textAlign: "left" as const, padding: "10px 14px", fontSize: 12, fontWeight: 700,
  color: "#555", textTransform: "uppercase" as const, letterSpacing: 0.4,
};

export default function PrintInvoice({ booking }: { booking: PrintInvoiceBooking }) {
  const isIssued = booking.status === "issued";
  const flight = booking.groupFlight;
  const legs = flight ? legsFromFlight(flight as never) : [];
  const [routeFrom, routeTo] = flight?.route?.split(/->|→|-/).map((s) => s.trim()) ?? ["", ""];

  const adults   = booking.adults   ?? 0;
  const children = booking.children ?? 0;
  const infants  = booking.infants  ?? 0;
  const totalPax = Math.max(1, adults + children + infants);

  const perPersonFare       = booking.sellPrice / totalPax;
  const perPersonCommission = booking.commission / totalPax;

  const rows: FareRow[] = [
    { label: "Adult",  count: adults,   perPersonFare, perPersonCommission },
    { label: "Child",  count: children, perPersonFare, perPersonCommission },
    { label: "Infant", count: infants,  perPersonFare, perPersonCommission },
  ].filter((r) => r.count > 0);

  if (rows.length === 0) {
    rows.push({ label: "Adult", count: 1, perPersonFare: booking.sellPrice, perPersonCommission: booking.commission });
  }

  const grandTotal = booking.sellPrice - booking.commission;

  // Use EWTS details when booking is direct (no agent / agent is the office)
  const effectiveAgent = {
    fullName: booking.agent?.fullName ?? EWTS_AGENCY_NAME,
    phone:    booking.agent?.phone    ?? EWTS_PHONE,
    logoUrl:  booking.agent?.logoUrl  ?? null,
  };

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
      background: "#eef1f5",
      padding: "32px 24px",
      color: "#111",
      maxWidth: 860,
      margin: "0 auto",
    }}>
      {/* ── TOP BAR ── */}
      <PrintTopBar
        agent={effectiveAgent}
        bookingRef={booking.bookingRef}
        ticketNumber={booking.ticketNumber}
        isIssued={isIssued}
        secondaryLabel="Invoice"
      />

      {/* ── SECOND ROW ── */}
      <PrintSecondRow
        secondaryLogoUrl={flight?.airlineLogoUrl}
        secondaryName={flight?.airline}
        agent={effectiveAgent}
        createdAt={booking.createdAt}
        issuedAt={booking.issuedAt}
        isIssued={isIssued}
      />

      {/* ── PASSENGER TABLE ── */}
      <PrintPassengerTable travellers={booking.travellers ?? []} />

      {/* ── TRAVEL ITINERARY ── */}
      <SectionHeading title="Travel Itinerary" />
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, overflow: "hidden", marginBottom: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <thead>
          <tr style={{ background: "#f7f7f9", borderBottom: "1.5px solid #ddd" }}>
            {["Flight No.", "From", "To", "Dep", "Arrival", "Meal", "Baggage", "Status"].map((h) => (
              <th key={h} style={headCell}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {legs.length > 0 ? legs.map((leg, i) => (
            <tr key={i} style={{ borderBottom: i < legs.length - 1 ? "1px solid #eee" : "none" }}>
              <td style={cell}>{leg.flightNo || "—"}</td>
              <td style={cell}>{leg.from || routeFrom || "—"}</td>
              <td style={cell}>{leg.to   || routeTo   || "—"}</td>
              <td style={cell}>{leg.depTime || "—"}</td>
              <td style={cell}>{leg.arrTime || "—"}</td>
              <td style={cell}>{flight?.meal    ?? "—"}</td>
              <td style={cell}>{flight?.baggage ?? "—"}</td>
              <td style={cell}>
                <span style={{
                  display: "inline-block", padding: "4px 12px", borderRadius: 6,
                  fontSize: 12, fontWeight: 700,
                  background: isIssued ? "#e6f7ea" : "#fff6e0",
                  color:      isIssued ? "#1a9e46" : "#a06a00",
                }}>
                  {isIssued ? "Confirmed" : "Pending"}
                </span>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={8} style={{ ...cell, color: "#888" }}>
                {flight ? `${flight.airline} · ${flight.route}` : "No itinerary available."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── PRICING & FARES ── */}
      <SectionHeading title="Pricing & Fares" />
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, overflow: "hidden", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <thead>
          <tr style={{ background: "#f7f7f9", borderBottom: "1.5px solid #ddd" }}>
            {["PAX Type", "PAX No.", "Per Person Fare", "Total", "Commission", "Net Payable"].map((h) => (
              <th key={h} style={headCell}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const rowTotal      = Math.round(r.perPersonFare * r.count);
            const commAmt       = Math.round(r.perPersonCommission);
            const netPayable    = rowTotal - commAmt * r.count;
            return (
              <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid #eee" : "none" }}>
                <td style={{ ...cell, fontWeight: 600 }}>{r.label}</td>
                <td style={cell}>{String(r.count).padStart(2, "0")}</td>
                <td style={cell}>PKR {Math.round(r.perPersonFare).toLocaleString()}</td>
                <td style={cell}>PKR {rowTotal.toLocaleString()}</td>
                <td style={cell}>PKR {commAmt.toLocaleString()} × {r.count}</td>
                <td style={{ ...cell, fontWeight: 700 }}>PKR {netPayable.toLocaleString()}</td>
              </tr>
            );
          })}
          {/* Blank rows for Child/Infant when count is 0 — mirrors reference PDF layout */}
          {adults   === 0 && <tr><td style={{ ...cell, color: "#bbb" }}>Adult</td>  <td style={{ ...cell, color: "#bbb" }}>00</td><td colSpan={4} /></tr>}
          {children === 0 && <tr><td style={{ ...cell, color: "#bbb" }}>Child</td>  <td style={{ ...cell, color: "#bbb" }}>00</td><td colSpan={4} /></tr>}
          {infants  === 0 && <tr><td style={{ ...cell, color: "#bbb" }}>Infant</td> <td style={{ ...cell, color: "#bbb" }}>00</td><td colSpan={4} /></tr>}
        </tbody>
      </table>

      {/* Grand Total */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
        <div style={{
          background: "#fff", border: "1.5px solid #ddd", borderRadius: 8,
          padding: "12px 24px", fontSize: 15, fontWeight: 700,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          Grand Total : &nbsp;<span style={{ fontSize: 17 }}>PKR {grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop: "1px solid #ddd", paddingTop: 14, display: "flex",
        justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "#999",
      }}>
        <span>{effectiveAgent.fullName} · {effectiveAgent.phone ?? EWTS_PHONE}</span>
        <span>Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
        <span style={{ fontStyle: "italic" }}>This is a computer-generated invoice.</span>
      </div>

      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>
    </div>
  );
}
