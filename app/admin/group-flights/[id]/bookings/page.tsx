"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth, adminFetch } from "@/lib/adminAuthClient";

type Flight = { id: string; airline: string; route: string; flightNo: string | null; depDate: string | null; seats: number };
type DirectBooking = {
  id: string; bookingRef: string; customerName: string | null; phone: string | null;
  seatsRequested: number | null; totalPricePkr: number | null; status: string; createdAt: string;
};
type AgentBookingRow = {
  id: string; bookingRef: string; ticketNumber: string | null; customerName: string | null;
  sellPrice: number; status: string; createdAt: string; agent: { agentCode: string; fullName: string };
};

function FlightBookingsInner() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, refresh } = useAdminAuth();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [direct, setDirect] = useState<DirectBooking[]>([]);
  const [agentRows, setAgentRows] = useState<AgentBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminFetch(`/api/admin/group-flights/${id}/bookings`, accessToken, refresh);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Could not load bookings."); setLoading(false); return; }
    setFlight(data.flight);
    setDirect(data.directBookings ?? []);
    setAgentRows(data.agentBookings ?? []);
    setLoading(false);
  }, [id, accessToken, refresh]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload() {
    const res = await adminFetch(`/api/admin/group-flights/${id}/bookings/export`, accessToken, refresh);
    if (!res.ok) { alert("Could not generate the download."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flight-${flight?.flightNo ?? flight?.route ?? "bookings"}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalBookings = direct.length + agentRows.length;

  return (
    <>
      <div className="adp-ph">
        <div>
          <h2>Flight <em>Bookings</em></h2>
          <p>{flight ? `${flight.airline} ${flight.flightNo ?? ""} — ${flight.route}${flight.depDate ? ` — ${flight.depDate}` : ""}` : "Loading…"}</p>
        </div>
        <button onClick={handleDownload} disabled={loading || totalBookings === 0} className="adp-btn adp-btn-g">
          Download All Bookings (Excel)
        </button>
      </div>

      {error && <p style={{ color: "var(--a-red)", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      {flight && (
        <div className="adp-sg" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="adp-sc"><div className="adp-sc-n">{flight.seats}</div><div className="adp-sc-l">Seats Remaining</div></div>
          <div className="adp-sc"><div className="adp-sc-n">{direct.length}</div><div className="adp-sc-l">Direct (B2C) Bookings</div></div>
          <div className="adp-sc"><div className="adp-sc-n">{agentRows.length}</div><div className="adp-sc-l">Agent Bookings</div></div>
        </div>
      )}

      <div className="adp-card">
        <div className="adp-ch"><h3>Direct (B2C) Bookings</h3></div>
        <div className="adp-tw">
          {loading ? <p className="etd">Loading…</p> : direct.length === 0 ? <p className="etd">None yet.</p> : (
            <table className="adp-table">
              <thead><tr><th>PNR</th><th>Customer</th><th>Phone</th><th>Seats</th><th>Total</th><th>Status</th><th>Booked</th></tr></thead>
              <tbody>
                {direct.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bookingRef}</strong></td>
                    <td>{b.customerName ?? "—"}</td>
                    <td>{b.phone ?? "—"}</td>
                    <td>{b.seatsRequested ?? "—"}</td>
                    <td>{b.totalPricePkr ? `PKR ${b.totalPricePkr.toLocaleString()}` : "—"}</td>
                    <td><span className={`adp-pill adp-p-${b.status}`}>{b.status}</span></td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="adp-card">
        <div className="adp-ch"><h3>Agent Bookings</h3></div>
        <div className="adp-tw">
          {loading ? <p className="etd">Loading…</p> : agentRows.length === 0 ? <p className="etd">None yet.</p> : (
            <table className="adp-table">
              <thead><tr><th>Ref</th><th>Ticket No.</th><th>Agent</th><th>Customer</th><th>Sell Price</th><th>Status</th><th>Booked</th></tr></thead>
              <tbody>
                {agentRows.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.bookingRef}</strong></td>
                    <td>{b.ticketNumber ?? "—"}</td>
                    <td>{b.agent.agentCode} — {b.agent.fullName}</td>
                    <td>{b.customerName ?? "—"}</td>
                    <td>PKR {b.sellPrice.toLocaleString()}</td>
                    <td><span className={`adp-pill adp-p-${b.status}`}>{b.status.replace("_", " ")}</span></td>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminFlightBookingsPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <FlightBookingsInner />
      </AdminShell>
    </AdminGuard>
  );
}
