"use client";

import { legsFromFlight } from "@/lib/groupFlightLegs";
import { PrintTopBar, PrintSecondRow, PrintPassengerTable, type PrintTraveller } from "@/components/print/PrintShared";

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
  agent: { fullName: string; phone: string | null; logoUrl: string | null };
  groupFlight: {
    airline: string;
    airlineLogoUrl: string | null;
    route: string;
    flightNo: string | null;
    legs: unknown;
  } | null;
};

type FareRow = { label: string; count: number; perPersonFare: number; perPersonCommission: number };

export default function PrintInvoice({ booking }: { booking: PrintInvoiceBooking }) {
  const isIssued = booking.status === "issued";
  const flight = booking.groupFlight;
  const legs = flight ? legsFromFlight(flight as never) : [];

  const adults = booking.adults ?? 0;
  const children = booking.children ?? 0;
  const infants = booking.infants ?? 0;
  const totalPax = Math.max(1, adults + children + infants);

  // AgentBooking only snapshots ONE sellPrice and ONE commission for the
  // whole booking (see lib/commission.ts — commission is a flat fixed
  // amount or a % of the total, never broken out per passenger type).
  // There is no stored per-Adult/Child/Infant fare to pull from, so the
  // per-row split below is a uniform per-head share of that same total —
  // NOT a real fare-by-age-group breakdown. The Grand Total is the actual
  // snapshotted sellPrice/commission (never recomputed), so it always
  // matches the real numbers exactly regardless of the row-level
  // approximation. See PROGRESS.md for the full note.
  const perPersonFare = booking.sellPrice / totalPax;
  const perPersonCommission = booking.commission / totalPax;

  const rows: FareRow[] = [
    { label: "Adult", count: adults, perPersonFare, perPersonCommission },
    { label: "Child", count: children, perPersonFare, perPersonCommission },
    { label: "Infant", count: infants, perPersonFare, perPersonCommission },
  ].filter((r) => r.count > 0);

  const grandTotal = booking.sellPrice - booking.commission;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#eef1f5", padding: 32, color: "#111", maxWidth: 900, margin: "0 auto" }}>
      <PrintTopBar
        agent={booking.agent}
        bookingRef={booking.bookingRef}
        ticketNumber={booking.ticketNumber}
        isIssued={isIssued}
        secondaryLabel="Invoice"
      />
      <PrintSecondRow
        secondaryLogoUrl={flight?.airlineLogoUrl}
        secondaryName={flight?.airline}
        agent={booking.agent}
        createdAt={booking.createdAt}
        issuedAt={booking.issuedAt}
        isIssued={isIssued}
      />
      <PrintPassengerTable travellers={booking.travellers ?? []} />

      {/* PRICING & FARES */}
      <h3 style={{ marginBottom: 8 }}>Pricing &amp; Fares</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ccc", marginBottom: 8 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            {["PAX Type", "PAX No.", "Per Person Fare", "Total", "Commission", "Net Payable"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 13 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: "10px 14px", color: "#888" }}>No passenger breakdown available.</td></tr>
          ) : rows.map((r, i) => {
            const total = Math.round(r.perPersonFare * r.count);
            const commissionAmt = Math.round(r.perPersonCommission);
            const netPayable = total - commissionAmt * r.count;
            return (
              <tr key={i}>
                <td style={{ padding: "10px 14px" }}>{r.label}</td>
                <td style={{ padding: "10px 14px" }}>{r.count}</td>
                <td style={{ padding: "10px 14px" }}>PKR {Math.round(r.perPersonFare).toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>PKR {total.toLocaleString()}</td>
                <td style={{ padding: "10px 14px" }}>PKR {commissionAmt.toLocaleString()} x {r.count}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>PKR {netPayable.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #ccc", padding: "10px 20px", fontSize: 15, fontWeight: 700 }}>
          Grand Total : PKR {grandTotal.toLocaleString()}
        </div>
      </div>

      {legs.length > 0 && (
        <p style={{ fontSize: 12, color: "#666", marginBottom: 24 }}>
          {flight?.airline} {flight?.flightNo ? `· ${flight.flightNo}` : ""} · {flight?.route}
        </p>
      )}

      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
