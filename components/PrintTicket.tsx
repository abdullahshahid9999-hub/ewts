"use client";

import { legsFromFlight } from "@/lib/groupFlightLegs";

type Traveller = { fullName: string; passportNo?: string; passportExpiry?: string; dob?: string; cnic?: string };

export type PrintTicketBooking = {
  bookingRef: string;
  ticketNumber: string | null;
  status: string;
  travellers: Traveller[] | null;
  createdAt: string;
  updatedAt: string;
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

function fmt(dt: string) {
  const d = new Date(dt);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} - ${month} - ${year} || ${time}`;
}

// Lightweight visual barcode — encodes nothing real, just needs to look
// like a barcode. Bar widths derived from the ref string so it's at least
// deterministic per booking rather than pure decoration.
function Barcode({ value }: { value: string }) {
  const bars = Array.from(value).map((ch, i) => (ch.charCodeAt(0) % 3) + 1 + (i % 2));
  return (
    <svg viewBox={`0 0 ${bars.length * 4} 60`} style={{ width: 140, height: 50 }}>
      {bars.map((w, i) => {
        const x = bars.slice(0, i).reduce((a, b) => a + b * 4, 0);
        return <rect key={i} x={x} y={0} width={w} height={60} fill="#111" />;
      })}
    </svg>
  );
}

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
      {/* TOP BAR */}
      <div style={{ border: "1px solid #ccc", borderRadius: 8, background: "#fff", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ height: 48 }}>
          {booking.agent.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booking.agent.logoUrl} alt={booking.agent.fullName} style={{ height: 48, objectFit: "contain" }} />
          ) : (
            <strong style={{ fontSize: 20 }}>{booking.agent.fullName}</strong>
          )}
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ margin: 0, fontSize: 15 }}>Booking Reference : <strong>{booking.bookingRef}</strong></p>
          <p style={{ margin: 0, fontSize: 15 }}>
            Ticket Number # <strong>{isIssued && booking.ticketNumber ? booking.ticketNumber : ""}</strong>
          </p>
        </div>
        <Barcode value={booking.bookingRef} />
      </div>

      {/* SECOND ROW */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid #333", marginBottom: 24 }}>
        <div style={{ height: 44 }}>
          {flight?.airlineLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flight.airlineLogoUrl} alt={flight.airline} style={{ height: 44, objectFit: "contain" }} />
          ) : (
            <strong>{flight?.airline}</strong>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 14 }}>Booked By :</p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{booking.agent.fullName}</p>
          <p style={{ margin: "8px 0 0", fontSize: 14 }}>Contact Number :</p>
          <p style={{ margin: 0, fontSize: 14 }}>{booking.agent.phone ?? "—"}</p>
        </div>
        <div style={{ borderLeft: "1px solid #999", paddingLeft: 24, fontSize: 13, lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>Reserved On :</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{fmt(booking.createdAt)}</p>
          <p style={{ margin: "8px 0 0" }}>Ticketed On :</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{isIssued ? fmt(booking.updatedAt) : "—"}</p>
        </div>
      </div>

      {/* PASSENGER TABLE */}
      <h3 style={{ marginBottom: 8 }}>Passenger Name</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #ccc", marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            {["SR", "Name", "Passport", "P-Expiry", "DOB"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 13 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(travellers.length > 0 ? travellers : [{ fullName: "—" }]).map((t, i) => (
            <tr key={i}>
              <td style={{ padding: "10px 14px" }}>{i + 1}</td>
              <td style={{ padding: "10px 14px" }}>{t.fullName?.toUpperCase() || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{t.passportNo || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{t.passportExpiry || "—"}</td>
              <td style={{ padding: "10px 14px" }}>{t.dob || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
