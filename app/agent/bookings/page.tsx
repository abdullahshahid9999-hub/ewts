"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentBookingsByType from "@/components/AgentBookingsByType";
import AgentVisaBookingsList from "@/components/AgentVisaBookingsList";

const SERVICES = [
  { key: "umrah", label: "Umrah Packages", icon: "🕌", accent: "#5CB85C" },
  { key: "group_ticket", label: "Group Flights", icon: "✈️", accent: "#D4A843" },
  { key: "insurance", label: "Insurance", icon: "🛡️", accent: "#A78BFA" },
  { key: "world_tour", label: "World Tour", icon: "🌍", accent: "#E8A94A" },
  { key: "visa", label: "Visa Services", icon: "📄", accent: "#4A9EDB" },
] as const;

const TITLES: Record<string, { title: React.ReactNode; subtitle: string; detailLabel: string }> = {
  umrah: { title: <>Umrah <span>Bookings</span></>, subtitle: "Your Umrah package bookings", detailLabel: "Package" },
  group_ticket: { title: <>Group <span>Tickets</span></>, subtitle: "Your group flight bookings", detailLabel: "Flight" },
  insurance: { title: <>Insurance <span>Bookings</span></>, subtitle: "Your travel insurance bookings", detailLabel: "Plan" },
  world_tour: { title: <>World <span>Tour Bookings</span></>, subtitle: "Your world tour package bookings", detailLabel: "Package" },
};

function BookingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const service = searchParams.get("service") ?? "umrah";

  function selectService(key: string) {
    router.replace(`/agent/bookings?service=${key}`, { scroll: false });
  }

  return (
    <>
      <div className="ap-ph">
        <div><h2>My <span>Bookings</span></h2><p>Everything you&apos;ve booked, across every service, in one place</p></div>
      </div>

      {/* Service selector — one page, multiple selectable options, instead
          of five separate sidebar links to five separate pages. */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {SERVICES.map((s) => (
          <button
            key={s.key}
            onClick={() => selectService(s.key)}
            className="ap-service-pill"
            style={{
              borderColor: service === s.key ? s.accent : "var(--bdr)",
              background: service === s.key ? `${s.accent}1A` : "var(--white)",
              color: service === s.key ? s.accent : "var(--text)",
            }}
          >
            <span aria-hidden>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {service === "visa" ? (
        <AgentVisaBookingsList />
      ) : (
        <AgentBookingsByType
          category={service as "umrah" | "group_ticket" | "insurance" | "world_tour"}
          title={TITLES[service]?.title ?? "Bookings"}
          subtitle={TITLES[service]?.subtitle ?? ""}
          detailLabel={TITLES[service]?.detailLabel ?? "Detail"}
        />
      )}
    </>
  );
}

export default function AgentBookingsPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <Suspense fallback={null}>
          <BookingsInner />
        </Suspense>
      </AgentShell>
    </AgentGuard>
  );
}
