"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";
import AgentBookingsByType from "@/components/AgentBookingsByType";
import AgentVisaBookingsList from "@/components/AgentVisaBookingsList";

const SERVICES = [
  {
    key: "visa",
    label: "Visa Services",
    bg: "from-[#1a3a5c] to-[#0f2240]",
    accent: "#4A9EDB",
    image: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=80",
    imageAlt: "Dubai skyline – Visa Services",
  },
  {
    key: "group_ticket",
    label: "Group Flights",
    bg: "from-[#1c2e4a] to-[#0d1b2e]",
    accent: "#D4A843",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
    imageAlt: "Airplane in flight – Group Tickets",
  },
  {
    key: "umrah",
    label: "Umrah Packages",
    bg: "from-[#1a2e1a] to-[#0e1e0e]",
    accent: "#5CB85C",
    image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80",
    imageAlt: "Masjid al-Haram Makkah – Umrah Packages",
  },
  {
    key: "insurance",
    label: "Travel Insurance",
    bg: "from-[#2e1a3a] to-[#1a0d24]",
    accent: "#A78BFA",
    image: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=600&q=80",
    imageAlt: "Canada travel – Insurance Services",
  },
  {
    key: "world_tour",
    label: "World Tours",
    bg: "from-[#3a2a1a] to-[#241a0d]",
    accent: "#E8A94A",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    imageAlt: "World tour destinations",
  },
];

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
    <div className="mb-wrap">
      <div className="mb-header">
        <p className="mb-eyebrow">Agent Portal</p>
        <h1 className="mb-title">My Bookings</h1>
        <p className="mb-sub">Everything you&apos;ve booked, across every service — select one below.</p>
      </div>

      {/* Same visual language as New Booking — but these select a filter
          inline instead of navigating away. Active card gets a glowing
          ring + checkmark. */}
      <div className="mb-grid">
        {SERVICES.map((s) => (
          <button
            key={s.key}
            onClick={() => selectService(s.key)}
            className={`mb-card${service === s.key ? " active" : ""}`}
            style={service === s.key ? { boxShadow: `0 0 0 3px ${s.accent}, 0 16px 36px rgba(0,0,0,0.16)` } : undefined}
          >
            <div className="mb-card-img-wrap">
              <img src={s.image} alt={s.imageAlt} className="mb-card-img" />
              <div className={`mb-card-img-overlay bg-gradient-to-b ${s.bg}`} />
              {service === s.key && (
                <span className="mb-card-check" style={{ background: s.accent }}>✓</span>
              )}
            </div>
            <div className="mb-card-body">
              <h2 className="mb-card-label">{s.label}</h2>
            </div>
          </button>
        ))}
      </div>

      <div className="mb-content">
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
      </div>

      <style>{`
        .mb-wrap { padding: 0 0 48px; max-width: 1100px; }
        .mb-header { margin-bottom: 24px; }
        .mb-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 4px; }
        .mb-title { font-family: var(--font-display, Georgia, serif); font-size: 28px; font-weight: 700; color: var(--text, #0A1930); letter-spacing: -0.02em; margin: 0 0 6px; }
        .mb-sub { font-size: 13px; color: var(--muted, #6b7280); }

        .mb-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 32px; }
        .mb-card {
          display: flex; flex-direction: column; border-radius: 16px; overflow: hidden;
          border: 1px solid var(--bdr, #e5e7eb); background: var(--white, #fff);
          cursor: pointer; text-align: left; padding: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .mb-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.14); }
        .mb-card-img-wrap { position: relative; height: 100px; overflow: hidden; }
        .mb-card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
        .mb-card:hover .mb-card-img { transform: scale(1.08); }
        .mb-card-img-overlay { position: absolute; inset: 0; opacity: 0.6; }
        .mb-card-check {
          position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 999px;
          color: #fff; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center;
        }
        .mb-card-body { padding: 10px 12px; }
        .mb-card-label { font-family: var(--font-display, Georgia, serif); font-size: 13px; font-weight: 700; color: var(--text, #0A1930); margin: 0; line-height: 1.25; }

        @media (max-width: 900px) { .mb-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 560px) { .mb-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
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
