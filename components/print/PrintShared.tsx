import React from "react";
export type PrintAgent = { fullName: string; phone: string | null; logoUrl: string | null };
export type PrintTraveller = { fullName: string; passportNo?: string; passportExpiry?: string; dob?: string; cnic?: string };

// ─── EWTS fallback logo (SVG inline, shown when agent has no logo) ───────────
export const EWTS_AGENCY_NAME = "East & West Travel Services";
export const EWTS_PHONE = "041-2602151";

export function fmt(dt: string) {
  const d = new Date(dt);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} - ${month} - ${year} || ${time}`;
}

// ─── REAL Code128-B barcode (encodes ticket number / booking ref) ─────────────
// Code128-B: each ASCII char 32-127 is encoded as a specific bar pattern.
// Patterns: 11-bit binary where 1=black bar, 0=white bar.
const C128B: Record<number, string> = {
  32:"11011001100",33:"11001101100",34:"11001100110",35:"10010011000",36:"10010001100",
  37:"10001001100",38:"10011001000",39:"10011000100",40:"10001100100",41:"11001001000",
  42:"11001000100",43:"11000100100",44:"10110011100",45:"10011011100",46:"10011001110",
  47:"10111001100",48:"10011101100",49:"10011100110",50:"11001110010",51:"11001011100",
  52:"11001001110",53:"11011100100",54:"11001110100",55:"11101101110",56:"11101001100",
  57:"11100101100",58:"11100100110",59:"11101100100",60:"11100110100",61:"11100110010",
  62:"11011011000",63:"11011000110",64:"11000110110",65:"10100011000",66:"10001011000",
  67:"10001000110",68:"10110001000",69:"10001101000",70:"10001100010",71:"11010001000",
  72:"11000101000",73:"11000100010",74:"10110111000",75:"10110001110",76:"10001101110",
  77:"10111011000",78:"10111000110",79:"10001110110",80:"11101110110",81:"11010001110",
  82:"11000101110",83:"11011101000",84:"11011100010",85:"11011101110",86:"11101011000",
  87:"11101000110",88:"11100010110",89:"11010111000",90:"11010001110",91:"11000010110",
  92:"11011010000",93:"11011001000",94:"11001010000",95:"10100110000",96:"10100001100",
  97:"10010110000",98:"10010000110",99:"10000101100",100:"10000100110",101:"10110010000",
  102:"10110000100",103:"10011010000",104:"10011000010",105:"10000110100",106:"10000110010",
  107:"11000010010",108:"11001010000",109:"11110111010",110:"11000010100",111:"10001111010",
  112:"10100111100",113:"10010111100",114:"10010011110",115:"10111100100",116:"10011110100",
  117:"10011110010",118:"11110100100",119:"11110010100",120:"11110010010",121:"11011011110",
  122:"11011110110",123:"11110110110",124:"10101111000",125:"10100011110",126:"10001011110",
  127:"10111101000",
};
// Start-B=104, Stop=106+11
const START_B = "11010000100";
const STOP    = "1100011101011";

function encodeCode128B(text: string): string {
  const safe = text.replace(/[^\x20-\x7E]/g, "");
  let bits = START_B;
  let checksum = 104;
  for (let i = 0; i < safe.length; i++) {
    const code = safe.charCodeAt(i);
    const val = code - 32;
    bits += C128B[code] ?? C128B[63]; // fallback to '?'
    checksum += val * (i + 1);
  }
  const chk = (checksum % 103) + 32;
  bits += C128B[chk] ?? C128B[63];
  bits += STOP;
  return bits;
}

export function Barcode({ value }: { value: string }) {
  const bits = encodeCode128B(value);
  const W = bits.length * 1.6;
  const H = 52;
  const rects: React.ReactElement[] = [];
  let x = 0;
  let i = 0;
  while (i < bits.length) {
    const bit = bits[i];
    let len = 0;
    while (i + len < bits.length && bits[i + len] === bit) len++;
    if (bit === "1") {
      rects.push(<rect key={i} x={x} y={0} width={len * 1.6} height={H} fill="#111" />);
    }
    x += len * 1.6;
    i += len;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 160, height: H }}>
        {rects}
      </svg>
      <span style={{ fontSize: 9, letterSpacing: 2, color: "#333", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
export function PrintTopBar({
  agent, bookingRef, ticketNumber, isIssued, secondaryLabel,
}: {
  agent: PrintAgent; bookingRef: string; ticketNumber: string | null; isIssued: boolean;
  secondaryLabel?: string;
}) {
  return (
    <div style={{
      border: "1.5px solid #ddd", borderRadius: 10, background: "#fff",
      padding: "18px 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Agency logo / name */}
      <div style={{ minWidth: 140 }}>
        {agent.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.logoUrl} alt={agent.fullName} style={{ height: 52, objectFit: "contain" }} />
        ) : (
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e", letterSpacing: -0.3 }}>{agent.fullName}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>TRAVEL AGENCY</div>
          </div>
        )}
      </div>

      {/* Centre — Booking Ref + Ticket */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          Booking Reference : <strong style={{ fontSize: 15 }}>{bookingRef}</strong>
        </p>
        {secondaryLabel ? (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>{secondaryLabel}</p>
        ) : (
          <p style={{ margin: "4px 0 0", fontSize: 14 }}>
            Ticket Number # <strong>{isIssued && ticketNumber ? ticketNumber : <span style={{ color: "#bbb" }}>Pending</span>}</strong>
          </p>
        )}
      </div>

      {/* Barcode */}
      <div style={{ minWidth: 170, display: "flex", justifyContent: "flex-end" }}>
        <Barcode value={isIssued && ticketNumber ? ticketNumber : bookingRef} />
      </div>
    </div>
  );
}

// ─── SECOND ROW ──────────────────────────────────────────────────────────────
export function PrintSecondRow({
  secondaryLogoUrl, secondaryName, agent, createdAt, issuedAt, isIssued,
}: {
  secondaryLogoUrl?: string | null; secondaryName?: string;
  agent: PrintAgent; createdAt: string; issuedAt: string | null; isIssued: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#fff", border: "1.5px solid #ddd", borderRadius: 10,
      padding: "16px 24px", marginBottom: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Airline logo / name */}
      <div style={{ minWidth: 120 }}>
        {secondaryLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={secondaryLogoUrl} alt={secondaryName} style={{ height: 44, objectFit: "contain" }} />
        ) : (
          <strong style={{ fontSize: 14 }}>{secondaryName ?? "—"}</strong>
        )}
      </div>

      {/* Booked by */}
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#666" }}>Booked By :</p>
        <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 15 }}>{agent.fullName}</p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#666" }}>Contact Number :</p>
        <p style={{ margin: "2px 0 0", fontSize: 13 }}>{agent.phone ?? EWTS_PHONE}</p>
      </div>

      {/* Dates */}
      <div style={{ borderLeft: "1px solid #ddd", paddingLeft: 20, fontSize: 12, lineHeight: 1.7 }}>
        <div style={{ color: "#666" }}>Reserved On :</div>
        <div style={{ fontWeight: 600 }}>{fmt(createdAt)}</div>
        <div style={{ color: "#666", marginTop: 4 }}>Ticketed On :</div>
        <div style={{ fontWeight: 600 }}>{isIssued && issuedAt ? fmt(issuedAt) : "—"}</div>
      </div>
    </div>
  );
}

// ─── PASSENGER TABLE ─────────────────────────────────────────────────────────
export function PrintPassengerTable({ travellers }: { travellers: PrintTraveller[] }) {
  const list = travellers.length > 0 ? travellers : [{ fullName: "—" }];
  return (
    <>
      <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#444" }}>
        Passenger Name
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, overflow: "hidden", marginBottom: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <thead>
          <tr style={{ background: "#f7f7f9", borderBottom: "1.5px solid #ddd" }}>
            {["SR", "Name", "Passport", "P-Expiry", "DOB"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((t, i) => (
            <tr key={i} style={{ borderBottom: i < list.length - 1 ? "1px solid #eee" : "none" }}>
              <td style={{ padding: "11px 14px", fontSize: 13 }}>{i + 1}</td>
              <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600 }}>{t.fullName?.toUpperCase() || "—"}</td>
              <td style={{ padding: "11px 14px", fontSize: 13 }}>{t.passportNo || "—"}</td>
              <td style={{ padding: "11px 14px", fontSize: 13 }}>{t.passportExpiry || "—"}</td>
              <td style={{ padding: "11px 14px", fontSize: 13 }}>{t.dob || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ─── SECTION HEADING ─────────────────────────────────────────────────────────
export function SectionHeading({ title }: { title: string }) {
  return (
    <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#444" }}>
      {title}
    </h3>
  );
}
