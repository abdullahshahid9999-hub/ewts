import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";

const SERVICES = [
  {
    key: "visa",
    label: "Visa Services",
    cta: "Apply Now",
    href: "/agent/visa",
    bg: "from-[#1a3a5c] to-[#0f2240]",
    accent: "#4A9EDB",
    image: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=80",
    imageAlt: "Dubai skyline – Visa Services",
  },
  {
    key: "group_ticket",
    label: "Group Flights",
    cta: "Book Now",
    href: "/agent/group-flights",
    bg: "from-[#1c2e4a] to-[#0d1b2e]",
    accent: "#D4A843",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
    imageAlt: "Airplane in flight – Group Tickets",
  },
  {
    key: "umrah",
    label: "Umrah Packages",
    cta: "Book Slot",
    href: "/agent/umrah",
    bg: "from-[#1a2e1a] to-[#0e1e0e]",
    accent: "#5CB85C",
    image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80",
    imageAlt: "Masjid al-Haram Makkah – Umrah Packages",
  },
  {
    key: "insurance",
    label: "Travel Insurance",
    cta: "Get Insured",
    href: "/agent/insurance",
    bg: "from-[#2e1a3a] to-[#1a0d24]",
    accent: "#A78BFA",
    image: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=600&q=80",
    imageAlt: "Canada travel – Insurance Services",
  },
  {
    key: "tours",
    label: "World Tours",
    cta: "Book Now",
    href: "/agent/tours",
    bg: "from-[#3a2a1a] to-[#241a0d]",
    accent: "#E8A94A",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
    imageAlt: "World tour destinations",
  },
];

export default function NewBookingPage() {
  return (
    <AgentGuard>
      <AgentShell>
        <div className="nb-wrap">
          {/* Header */}
          <div className="nb-header">
            <div>
              <p className="nb-eyebrow">Agent Portal</p>
              <h1 className="nb-title">New Booking</h1>
              <p className="nb-sub">Select a service below to begin a new booking for your client.</p>
            </div>
          </div>

          {/* 4 Service Cards */}
          <div className="nb-grid">
            {SERVICES.map((s) => (
              <Link key={s.key} href={s.href} className="nb-card">
                {/* Image */}
                <div className="nb-card-img-wrap">
                  <img src={s.image} alt={s.imageAlt} className="nb-card-img" />
                  <div className={`nb-card-img-overlay bg-gradient-to-b ${s.bg}`} />
                </div>

                {/* Body */}
                <div className="nb-card-body">
                  <div>
                    <h2 className="nb-card-label">{s.label}</h2>
                  </div>
                  <div className="nb-card-cta" style={{ background: s.accent }}>
                    {s.cta} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <style>{`
          .nb-wrap {
            padding: 28px 28px 48px;
            max-width: 1100px;
          }

          .nb-header {
            margin-bottom: 28px;
          }
          .nb-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--gold);
            margin-bottom: 4px;
          }
          .nb-title {
            font-family: var(--font-display, Georgia, serif);
            font-size: 28px;
            font-weight: 700;
            color: var(--navy, #0A1930);
            letter-spacing: -0.02em;
            margin: 0 0 6px;
          }
          .nb-sub {
            font-size: 13px;
            color: var(--gray, #6b7280);
          }

          /* Grid */
          .nb-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }

          /* Card */
          .nb-card {
            display: flex;
            flex-direction: column;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--border, #e5e7eb);
            background: #fff;
            text-decoration: none;
            transition: transform 0.22s ease, box-shadow 0.22s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .nb-card:hover {
            transform: translateY(-6px) scale(1.035);
            box-shadow: 0 16px 36px rgba(0,0,0,0.16);
            z-index: 1;
          }

          /* Image area */
          .nb-card-img-wrap {
            position: relative;
            height: 160px;
            overflow: hidden;
          }
          .nb-card-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.35s ease;
          }
          .nb-card:hover .nb-card-img {
            transform: scale(1.1);
          }
          .nb-card-img-overlay {
            position: absolute;
            inset: 0;
            opacity: 0.55;
          }

          /* Body */
          .nb-card-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: 1;
            gap: 14px;
          }
          .nb-card-label {
            font-family: var(--font-display, Georgia, serif);
            font-size: 17px;
            font-weight: 700;
            color: var(--navy, #0A1930);
            margin: 0;
            line-height: 1.2;
          }
          .nb-card-cta {
            display: block;
            text-align: center;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            padding: 9px 14px;
            border-radius: 8px;
            letter-spacing: 0.02em;
            transition: opacity 0.15s;
          }
          .nb-card:hover .nb-card-cta {
            opacity: 0.88;
          }

          /* Responsive */
          @media (max-width: 900px) {
            .nb-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 520px) {
            .nb-wrap { padding: 18px 14px 36px; }
            .nb-grid { grid-template-columns: 1fr; }
            .nb-card-img-wrap { height: 130px; }
          }
        `}</style>
      </AgentShell>
    </AgentGuard>
  );
}
