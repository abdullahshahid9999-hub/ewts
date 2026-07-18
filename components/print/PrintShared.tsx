export type PrintAgent = { fullName: string; phone: string | null; logoUrl: string | null };
export type PrintTraveller = { fullName: string; passportNo?: string; passportExpiry?: string; dob?: string; cnic?: string };

export function fmt(dt: string) {
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
export function Barcode({ value }: { value: string }) {
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

export function PrintTopBar({
  agent, bookingRef, ticketNumber, isIssued, secondaryLogoUrl, secondaryLabel,
}: {
  agent: PrintAgent; bookingRef: string; ticketNumber: string | null; isIssued: boolean;
  secondaryLogoUrl?: string | null; secondaryLabel?: string;
}) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, background: "#fff", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <div style={{ height: 48 }}>
        {agent.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.logoUrl} alt={agent.fullName} style={{ height: 48, objectFit: "contain" }} />
        ) : (
          <strong style={{ fontSize: 20 }}>{agent.fullName}</strong>
        )}
      </div>
      <div style={{ textAlign: "center", flex: 1 }}>
        <p style={{ margin: 0, fontSize: 15 }}>Booking Reference : <strong>{bookingRef}</strong></p>
        {secondaryLabel ? (
          <p style={{ margin: 0, fontSize: 15 }}>{secondaryLabel}</p>
        ) : (
          <p style={{ margin: 0, fontSize: 15 }}>Ticket Number # <strong>{isIssued && ticketNumber ? ticketNumber : ""}</strong></p>
        )}
      </div>
      <Barcode value={bookingRef} />
    </div>
  );
}

export function PrintSecondRow({
  secondaryLogoUrl, secondaryName, agent, createdAt, issuedAt, isIssued,
}: {
  secondaryLogoUrl?: string | null; secondaryName?: string;
  agent: PrintAgent; createdAt: string; issuedAt: string | null; isIssued: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: "1px solid #333", marginBottom: 24 }}>
      <div style={{ height: 44 }}>
        {secondaryLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={secondaryLogoUrl} alt={secondaryName} style={{ height: 44, objectFit: "contain" }} />
        ) : (
          <strong>{secondaryName}</strong>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 14 }}>Booked By :</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{agent.fullName}</p>
        <p style={{ margin: "8px 0 0", fontSize: 14 }}>Contact Number :</p>
        <p style={{ margin: 0, fontSize: 14 }}>{agent.phone ?? "—"}</p>
      </div>
      <div style={{ borderLeft: "1px solid #999", paddingLeft: 24, fontSize: 13, lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>Reserved On :</p>
        <p style={{ margin: 0, fontWeight: 600 }}>{fmt(createdAt)}</p>
        <p style={{ margin: "8px 0 0" }}>Ticketed On :</p>
        <p style={{ margin: 0, fontWeight: 600 }}>{isIssued && issuedAt ? fmt(issuedAt) : "—"}</p>
      </div>
    </div>
  );
}

export function PrintPassengerTable({ travellers }: { travellers: PrintTraveller[] }) {
  return (
    <>
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
    </>
  );
}
