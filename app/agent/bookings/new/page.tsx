"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import { useAgentAuth, agentFetch } from "@/lib/agentAuthClient";

type ServiceType = "umrah" | "group_ticket" | "insurance" | "world_tour" | "visa_services";

type GroupFlight = {
  id: string;
  airline: string;
  route: string;
  depDate: string | null;
  price: string;
  seats: number;
};

const SERVICES: { value: ServiceType; icon: string; label: string; desc: string }[] = [
  { value: "umrah", icon: "🕌", label: "Umrah Packages", desc: "Book Umrah travel packages for your clients" },
  { value: "group_ticket", icon: "✈️", label: "Group Flights", desc: "Reserve seats on scheduled group flights" },
  { value: "insurance", icon: "🛡️", label: "Insurance", desc: "Travel insurance policies for clients" },
  { value: "world_tour", icon: "🌍", label: "World Tour", desc: "International tour packages and holidays" },
  { value: "visa_services", icon: "📄", label: "Visa Services", desc: "Visa processing and documentation" },
];

function NewBookingInner() {
  const { accessToken, refresh } = useAgentAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialService = (searchParams.get("service") as ServiceType) ?? null;

  const [step, setStep] = useState<"select" | "details">(initialService ? "details" : "select");
  const [serviceType, setServiceType] = useState<ServiceType>(initialService ?? "umrah");
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

  function selectService(s: ServiceType) {
    setServiceType(s);
    setError(null);
    setSellPrice("");
    setGroupFlightId("");
    setStep("details");
  }

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

  const selectedService = SERVICES.find((s) => s.value === serviceType);

  return (
    <div>
      {/* Page header */}
      <div className="ap-ph">
        <div>
          <h2>New <span>Booking</span></h2>
          <p>Create a new booking for your client</p>
        </div>
      </div>

      {step === "select" ? (
        /* ── Step 1: Service selector grid ── */
        <div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            Select the type of service you want to book:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {SERVICES.map((s) => (
              <button
                key={s.value}
                onClick={() => selectService(s.value)}
                style={{
                  background: "var(--white)",
                  border: "1.5px solid var(--bdr)",
                  borderRadius: 12,
                  padding: "20px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all .15s",
                  boxShadow: "0 1px 2px rgba(20,20,43,.03), 0 8px 24px -8px rgba(20,20,43,.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 8px rgba(20,20,43,.04), 0 14px 32px -10px rgba(20,20,43,.14)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bdr)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 2px rgba(20,20,43,.03), 0 8px 24px -8px rgba(20,20,43,.08)";
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Step 2: Booking details form ── */
        <div style={{ maxWidth: 520 }}>
          <button
            onClick={() => { setStep("select"); setError(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 16, padding: 0 }}
          >
            ← Back to services
          </button>

          <div className="ap-card">
            <div className="ap-ch">
              <div>
                <h3>
                  {selectedService?.icon} {selectedService?.label}
                </h3>
                <p>Fill in the booking details below</p>
              </div>
            </div>
            <div style={{ padding: "20px 20px" }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Change service type within step 2 */}
                <div className="ap-field">
                  <label>Service type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => { setServiceType(e.target.value as ServiceType); setError(null); }}
                  >
                    {SERVICES.map((s) => (
                      <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>

                {serviceType === "group_ticket" && (
                  <div className="ap-field">
                    <label>Flight</label>
                    <select
                      value={groupFlightId}
                      onChange={(e) => setGroupFlightId(e.target.value)}
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

                <div className="ap-field">
                  <label>Sell price (PKR)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 150000"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                  />
                </div>

                {error && (
                  <div style={{ background: "var(--red-bg)", border: "1px solid var(--red-bd)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => { setStep("select"); setError(null); }}
                    className="ap-btn ap-btn-ghost"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ap-btn ap-btn-gold"
                    style={{ flex: 2 }}
                  >
                    {submitting ? "Creating…" : "Create Booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <Suspense fallback={<div style={{ padding: 40, color: "var(--muted)", fontSize: 13 }}>Loading…</div>}>
          <NewBookingInner />
        </Suspense>
      </AgentShell>
    </AgentGuard>
  );
}
