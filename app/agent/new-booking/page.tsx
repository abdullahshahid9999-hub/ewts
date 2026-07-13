import Link from "next/link";
import AgentGuard from "@/components/AgentGuard";
import AgentShell from "@/components/AgentShell";

const SERVICES = [
  {
    key: "visa",
    label: "Visa Services",
    arabic: "خدمات التأشيرة",
    description: "Apply for tourist, business, Umrah & work visas for 50+ countries.",
    cta: "Apply Now",
    href: "/agent/bookings/new?service=visa_services",
    icon: "📄",
    bg: "from-[#1a3a5c] to-[#0f2240]",
    accent: "#4A9EDB",
    image: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=80",
    imageAlt: "Dubai skyline – Visa Services",
    badge: "50+ Countries",
  },
  {
    key: "group_ticket",
    label: "Group Flights",
    arabic: "تذاكر المجموعة",
    description: "Confirmed seat allocations on all major airlines — economy & business class.",
    cta: "Book Now",
    href: "/agent/bookings/new?service=group_ticket",
    icon: "✈️",
    bg: "from-[#1c2e4a] to-[#0d1b2e]",
    accent: "#D4A843",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
    imageAlt: "Airplane in flight – Group Tickets",
    badge: "Instant Issuance",
  },
  {
    key: "umrah",
    label: "Umrah Packages",
    arabic: "باقات العمرة",
    description: "Economy to premium Umrah packages with hotels, flights & ziyarat included.",
    cta: "Book Slot",
    href: "/agent/umrah",
    icon: "🕌",
    bg: "from-[#1a2e1a] to-[#0e1e0e]",
    accent: "#5CB85C",
    image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80",
    imageAlt: "Masjid al-Haram Makkah – Umrah Packages",
    badge: "Season 2025",
  },
  {
    key: "insurance",
    label: "Travel Insurance",
    arabic: "تأمين السفر",
    description: "Comprehensive travel insurance — medical, cancellation & baggage cover.",
    cta: "Get Insured",
    href: "/agent/bookings/new?service=insurance",
    icon: "🛡️",
    bg: "from-[#2e1a3a] to-[#1a0d24]",
    accent: "#A78BFA",
    image: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=600&q=80",
    imageAlt: "Canada travel – Insurance Services",
    badge: "All Destinations",
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
                  <span className="nb-card-badge" style={{ background: s.accent + "22", color: s.accent, border: `1px solid ${s.accent}44` }}>
                    {s.badge}
                  </span>
                  <span className="nb-card-icon">{s.icon}</span>
                </div>

                {/* Body */}
                <div className="nb-card-body">
                  <div>
                    <p className="nb-card-arabic">{s.arabic}</p>
                    <h2 className="nb-card-label">{s.label}</h2>
                    <p className="nb-card-desc">{s.description}</p>
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
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .nb-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.13);
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
            transition: transform 0.3s ease;
          }
          .nb-card:hover .nb-card-img {
            transform: scale(1.05);
          }
          .nb-card-img-overlay {
            position: absolute;
            inset: 0;
            opacity: 0.55;
          }
          .nb-card-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 20px;
            backdrop-filter: blur(4px);
          }
          .nb-card-icon {
            position: absolute;
            bottom: 10px;
            right: 12px;
            font-size: 28px;
            line-height: 1;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
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
          .nb-card-arabic {
            font-size: 10px;
            color: var(--gray, #9ca3af);
            margin-bottom: 3px;
            font-family: 'Amiri', serif;
            direction: rtl;
          }
          .nb-card-label {
            font-family: var(--font-display, Georgia, serif);
            font-size: 16px;
            font-weight: 700;
            color: var(--navy, #0A1930);
            margin: 0 0 6px;
            line-height: 1.2;
          }
          .nb-card-desc {
            font-size: 12px;
            color: var(--gray, #6b7280);
            line-height: 1.55;
            margin: 0;
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
