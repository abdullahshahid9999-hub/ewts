"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type GroupFlight = {
  id: string;
  airline: string;
  route: string;
  depDate: string | null;
  price: string;
  seats: number;
};

function NewBookingInner() {
  const { accessToken, refresh } = useAgentAuth();
  const router = useRouter();
  const [serviceType, setServiceType] = useState<"umrah" | "group_ticket" | "insurance">("umrah");
  const [sellPrice, setSellPrice] = useState("");
  const [groupFlightId, setGroupFlightId] = useState("");
  const [flights, setFlights] = useState<GroupFlight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (serviceType !== "group_ticket") return;
    agentFetch("/api/agent/group-flights", accessToken, refresh).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setFlights(data.flights ?? []);
      }
    });
  }, [serviceType, accessToken, refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(sellPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid sell price.");
      return;
    }
    if (serviceType === "group_ticket" && !groupFlightId) {
      setError("Select a group flight.");
      return;
    }

    setSubmitting(true);
    const res = await agentFetch("/api/agent/bookings", accessToken, refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType,
        sellPrice: price,
        groupFlightId: serviceType === "group_ticket" ? groupFlightId : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create booking.");
      return;
    }
    router.push("/agent/bookings");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--navy)]">New Booking</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-[var(--bdr)] bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Service type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as typeof serviceType)}
            className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
          >
            <option value="umrah">Umrah</option>
            <option value="group_ticket">Group Ticket</option>
            <option value="insurance">Insurance</option>
          </select>
        </div>

        {serviceType === "group_ticket" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Flight</label>
            <select
              value={groupFlightId}
              onChange={(e) => setGroupFlightId(e.target.value)}
              className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
            >
              <option value="">Select a flight…</option>
              {flights.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.airline} · {f.route} {f.depDate ? `· ${f.depDate}` : ""} ({f.seats} seats left)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Sell price (PKR)</label>
          <input
            type="number"
            min={1}
            required
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            className="w-full rounded-lg border border-[var(--bdr)] px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[var(--navy)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create booking"}
        </button>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <NewBookingInner />
      </AgentShell>
    </AgentGuard>
  );
}
