import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import Link from "next/link";
import HeroSlideshow from "@/components/HeroSlideshow";
import Reveal, { RevealStagger, RevealItem } from "@/components/Reveal";

const HERO_IMAGES = [
  { src: "/images/makarem_1.jpeg", alt: "East & West Travel Services office" },
  { src: "/images/pullman_1.jpeg", alt: "East & West Travel Services" },
];

const OFFICE_STRIP = [
  { src: "/images/makarem_2.jpeg", alt: "Reception" },
  { src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&q=80", alt: "Team at work" },
  { src: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=500&q=80", alt: "Certificates wall" },
  { src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&q=80", alt: "Team meeting" },
];

const CREDENTIAL_CHECKS = ["IATA Accredited", "DTS Lic. Gov. 3281", "PRA & FBR Registered", "Top 10 Faisalabad Agent"];

const STATS = [
  { value: "20+", label: "Years in Business" },
  { value: "50K+", label: "Happy Travellers" },
  { value: "10+", label: "Industry Awards" },
  { value: "B2B", label: "Trusted by Agencies" },
];

type TimelineEntry = { year: string; icon: string; color: string; title: string; desc: React.ReactNode; big?: boolean };

const TIMELINE: TimelineEntry[] = [
  { year: "2004", icon: "🚩", color: "#D4A843", title: "The Beginning", desc: <>Founded <strong>East &amp; West Travel Services</strong>. Registered the firm, obtained Government <strong>DTS License No. 3281</strong>. Two dedicated partners embarked on this journey together in Faisalabad.</> },
  { year: "2006", icon: "🎫", color: "#EC4899", title: "First Certifications & Bangkok Tour", desc: <>Received the prestigious <strong>Galileo certification</strong>. <strong>Cathay Pacific</strong> recognized our excellence and sponsored a complimentary FAM tour to Bangkok — a proud milestone for the team.</> },
  { year: "2008", icon: "🕌", color: "#22C55E", title: "Corporate & Umrah Expertise", desc: <>Expanded into <strong>corporate clients</strong>. Became specialists in <strong>customised and group Umrah packages</strong> — laying the foundation for our pilgrimage leadership.</> },
  { year: "2011", icon: "🏛️", color: "#8B5CF6", title: "IATA Application & B2B Trust", desc: <>Applied for <strong>IATA accreditation</strong>. Gained the deep trust of numerous B2B agencies across Pakistan, widening our professional network significantly.</> },
  { year: "2013", icon: "🏆", color: "#D4A843", title: "IATA Accreditation — Alhamdulillah!", desc: <>By the grace of Allah Almighty, we became a fully <strong>IATA Accredited Agent</strong> — a defining milestone that elevated our standing in the global travel industry.</>, big: true },
  { year: "2014", icon: "✈️", color: "#F97316", title: "Airline Stock & Rapid Sales Growth", desc: <>Acquired <strong>airline stock</strong>. B2B and B2C ticketing sales increased rapidly, cementing our position as a high-volume, trusted ticketing partner.</> },
  { year: "2016", icon: "🏅", color: "#14B8A6", title: "Top 10 Agent — Faisalabad", desc: <>Achieved the prestigious rank of <strong>Top 10 Travel Agent in Faisalabad</strong> — a testament to consistent quality and high volume of business.</> },
  { year: "2018", icon: "🎖️", color: "#EAB308", title: "Meezab Group — Best Umrah Award", desc: <>Honoured by the <strong>Meezab Group</strong> with an award for <strong>Best Performance in Umrah Season</strong> — recognising our dedication to pilgrimage services.</> },
  { year: "2019", icon: "⭐", color: "#3B82F6", title: "Top 10 Retained & Travelport Award", desc: <>Maintained the <strong>Top 10 ranking</strong> in Faisalabad and received a prestigious <strong>Travelport Award</strong> for outstanding contribution to travel industry performance.</> },
  { year: "2020", icon: "🩺", color: "#EF4444", title: "COVID-19 & New Chapter", desc: <>The global pandemic severely hit sales. In a decisive move, <strong>Shahid Mahmood S/O Yousaf Ali</strong> acquired full ownership and steered the company forward with renewed vision.</> },
  { year: "2021", icon: "🕐", color: "#A16207", title: "KSA Expansion Venture", desc: <>Launched a company in the <strong>Kingdom of Saudi Arabia</strong> with partners for Umrah visa issuance. Later closed due to unforeseen challenges — enriching our KSA expertise nonetheless.</> },
  { year: "2024", icon: "🤲", color: "#EF4444", title: "Alhamdulillah — Full Recovery", desc: <>After years of pandemic hardship, <strong>Alhamdulillah</strong>, the company fully regained its standard sales and team morale — stronger, wiser, and more determined than ever before.</> },
  { year: "2026", icon: "🏅", color: "#B8862E", title: "Air Arabia & Fly Jinnah Award", desc: <>Awarded by <strong>Air Arabia | Fly Jinnah</strong> for <strong>Best Performance</strong> — the latest milestone in our ever-growing legacy of travel excellence across Pakistan.</> },
];

const CERTIFICATIONS = [
  { title: "DTS License", sub: "No. 3281", color: "#B8862E", icon: "📜" },
  { title: "IATA Accreditation", sub: "Since 2013", color: "#3B82F6", icon: "🎫" },
  { title: "PHA Certificate", sub: "Punjab Revenue Authority", color: "#22C55E", icon: "📋" },
  { title: "FBR Certificate", sub: "Federal Board of Revenue", color: "#8B5CF6", icon: "📄" },
];

const AWARDS_GALLERY = [
  "Galileo Certification", "Government Certificate", "Travelport Trophy",
  "GGI Gold Shield", "Air Arabia Fly Jinnah Stage Award", "322B Recognition Plaque",
];

const SERVICES = [
  { title: "Umrah Packages", icon: "🕋", color: "#D4A843", img: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&q=80", desc: "Expertly curated Umrah packages — economy, standard & luxury — with visa, flights, hotel, and ground transport. Trusted by thousands since 2008." },
  { title: "Hajj Packages", icon: "🏔️", color: "#22C55E", img: "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=500&q=80", desc: "Complete Hajj solutions for individuals and groups — government & private quotas, full documentation, accommodation in Mina & Azizia, and spiritual guidance." },
  { title: "Air Ticketing", icon: "✈️", color: "#3B82F6", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80", desc: "IATA-accredited ticketing for 200+ airlines worldwide. Best fares for economy, business & first class — domestic and international, B2B & B2C." },
  { title: "Group Tours", icon: "👨‍👩‍👧", color: "#8B5CF6", img: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=500&q=80", desc: "Tailor-made group tour packages for families, corporates & institutions — from Europe to Asia, managed end-to-end with expert tour managers." },
  { title: "Domestic Packages", icon: "⛰️", color: "#22C55E", img: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=500&q=80", desc: "Explore Pakistan's breathtaking beauty — Hunza, Swat, Naran, Murree, Lahore & more. Weekend getaways, honeymoon specials & family holidays." },
  { title: "Hotel Bookings", icon: "🏨", color: "#A16207", img: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500&q=80", desc: "Best-rate hotel reservations worldwide — budget to 5-star luxury. Makkah, Madinah, Istanbul, Dubai, Bangkok & beyond at unbeatable rates." },
  { title: "Visa Consultancy", icon: "🛂", color: "#8B5CF6", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80", desc: "Expert visa guidance for tourist, business, student, family & Umrah visas. We navigate requirements for 50+ countries with a high approval rate." },
  { title: "Travel Insurance", icon: "🛡️", color: "#EC4899", img: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=500&q=80", desc: "Comprehensive travel insurance with ICI — medical cover, trip cancellation, baggage loss & Umrah/Hajj-specific policies for complete protection." },
  { title: "Corporate Travel", icon: "💼", color: "#0E2A26", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80", desc: "Dedicated corporate travel management — bulk ticketing, account management, meeting & conference travel, priority handling for your business teams." },
];

const WHY_US = [
  { icon: "⏱️", color: "#D4A843", title: "20+ Years Experience", desc: "Two decades of expertise across every facet of travel — from sacred pilgrimages to international corporate journeys." },
  { icon: "🌐", color: "#3B82F6", title: "IATA Accredited", desc: "Fully accredited by IATA — your assurance of globally recognised ticketing standards and unmatched professional reliability." },
  { icon: "🤝", color: "#22C55E", title: "Sincere Service", desc: "We treat every client like family. Available around the clock for support, guidance, and assistance throughout your journey." },
  { icon: "🏅", color: "#8B5CF6", title: "Award-Winning", desc: "Multiple awards from Travelport, Air Arabia, Fly Jinnah, ICI Insurance & Meezab Group — validating our consistent excellence." },
];

function CertShield({ caption }: { caption: string }) {
  return (
    <div className="h-40 rounded-t-2xl flex items-center justify-center bg-gradient-to-br from-[var(--lp-ink)] to-[#1a2b45]">
      <span className="text-white/60 text-xs font-medium px-3 text-center">{caption}</span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative text-white text-left px-6 pt-24 pb-16 overflow-hidden min-h-[520px] flex items-end">
        <HeroSlideshow images={HERO_IMAGES} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(14,42,38,0.88) 0%, rgba(14,42,38,0.55) 60%, rgba(14,42,38,0.3) 100%)" }} />
        <div className="relative max-w-3xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase px-4 py-2 rounded-full mb-6" style={{ color: "var(--lp-brass-light,#D4A94F)", background: "rgba(255,253,248,0.08)", border: "1px solid rgba(212,169,79,0.35)" }}>
              ★ Since 2004 · Faisalabad, Pakistan
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-5">
              Your Trusted <span className="italic" style={{ color: "var(--lp-brass-light,#D4A94F)" }}>Travel</span> Partner
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-white/75 mb-8 max-w-xl">
              Two decades of excellence in Hajj, Umrah, air ticketing &amp; global travel — from the heart of Faisalabad.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex items-center gap-4">
              <a href="#journey" className="bg-[var(--lp-brass,#B8862E)] hover:brightness-110 text-black font-bold px-6 py-3 rounded-lg shadow-md transition">
                🕐 Our Journey
              </a>
              <Link href="/#services" className="border border-white/30 hover:border-[var(--lp-brass,#B8862E)] px-6 py-3 rounded-lg font-semibold transition-colors">
                📦 Our Services
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* OFFICE STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {OFFICE_STRIP.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={img.src} alt={img.alt} className="w-full h-28 md:h-36 object-cover" />
        ))}
      </div>

      {/* TWO DECADES OF TRUST & EXCELLENCE */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <Reveal>
          <p className="lp-eyebrow mb-3">Who We Are</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-5" style={{ color: "var(--lp-ink,#0E2A26)" }}>
            Two Decades of <span className="italic" style={{ color: "var(--lp-brass,#B8862E)" }}>Trust &amp; Excellence</span>
          </h2>
          <p className="text-muted mb-4">
            Founded in <strong>2004</strong> in the heart of <strong>Faisalabad, Pakistan</strong>, East &amp; West
            Travel Services has grown from a two-partner startup into one of the region&apos;s most respected
            IATA-accredited travel agencies — holding Government <strong>DTS License No. 3281</strong>.
          </p>
          <p className="text-muted mb-6">
            Under the stewardship of <strong>Shahid Mahmood S/O Yousaf Ali</strong>, we navigated the global
            pandemic and emerged stronger — maintaining our reputation as a trusted name in Hajj &amp; Umrah
            management, corporate travel, airline ticketing, group tours, and visa consultancy.
          </p>
          <blockquote className="border-l-4 pl-4 italic text-lg mb-6" style={{ borderColor: "var(--lp-brass,#B8862E)" }}>
            &quot;Serve with sincerity, travel with trust.&quot;
          </blockquote>
          <div className="grid grid-cols-2 gap-3">
            {CREDENTIAL_CHECKS.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm">
                <span style={{ color: "var(--lp-brass,#B8862E)" }}>✓</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="relative">
            <div className="h-80 rounded-2xl overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80"
                alt="East & West Travel Services director's office"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-4 right-4 bg-white rounded-xl px-4 py-2 shadow-lg text-xs">
              <p className="font-bold" style={{ color: "var(--lp-ink,#0E2A26)" }}>IATA</p>
              <p className="text-muted">Accredited · Since 2013</p>
            </div>
            <div className="absolute -bottom-4 left-6 rounded-xl px-5 py-3 shadow-lg text-center" style={{ background: "var(--lp-brass,#B8862E)" }}>
              <p className="font-display text-lg font-bold leading-none text-black">20+</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-black/80">Years of Service</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* STATS BAR */}
      <RevealStagger className="text-white py-14 px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center" style={{ background: "var(--lp-ink,#0E2A26)" }}>
        {STATS.map((s) => (
          <RevealItem key={s.label}>
            <p className="font-display text-3xl font-bold mb-1" style={{ color: "var(--lp-brass-light,#D4A94F)" }}>{s.value}</p>
            <p className="text-xs uppercase tracking-wide text-white/60">{s.label}</p>
          </RevealItem>
        ))}
      </RevealStagger>

      {/* MILESTONES & ACHIEVEMENTS — vertical zigzag timeline */}
      <section id="journey" className="lp max-w-4xl mx-auto px-6 py-20">
        <Reveal>
          <p className="lp-eyebrow text-center mb-3">Our Journey</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-center" style={{ color: "var(--lp-ink,#0E2A26)" }}>
            Milestones &amp; <span className="italic" style={{ color: "var(--lp-brass,#B8862E)" }}>Achievements</span>
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: "var(--lp-muted,#5B6B65)" }}>
            From a humble two-partner firm to an award-winning agency — two decades of growth, resilience, and divine blessing.
          </p>
        </Reveal>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 hidden sm:block" style={{ background: "var(--lp-border,rgba(14,42,38,.12))" }} />
          <div className="flex flex-col gap-8">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={0.03} className="relative grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full hidden sm:block z-10"
                  style={{ width: t.big ? 20 : 12, height: t.big ? 20 : 12, background: t.color, boxShadow: "0 0 0 5px var(--lp-sand,#F7F2E6)" }}
                />
                {i % 2 === 0 ? (
                  <>
                    <div className="sm:text-right sm:pr-10"><TimelineCard t={t} /></div>
                    <div />
                  </>
                ) : (
                  <>
                    <div className="hidden sm:block" />
                    <div className="sm:pl-10"><TimelineCard t={t} /></div>
                  </>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center lp-eyebrow mb-3">Official Credentials</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3 text-center" style={{ color: "var(--lp-ink,#0E2A26)" }}>
              Our <span className="italic" style={{ color: "var(--lp-brass,#B8862E)" }}>Certifications</span>
            </h2>
            <p className="text-muted text-center max-w-xl mx-auto mb-12">
              Hover over each certificate to reveal the full story. Every credential reflects our uncompromising commitment to professionalism.
            </p>
          </Reveal>
          <RevealStagger className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {CERTIFICATIONS.map((c) => (
              <RevealItem key={c.title} className="rounded-2xl overflow-hidden border border-border hover-lift group">
                <CertShield caption={`${c.title} — replace with real scan`} />
                <div className="p-4 relative">
                  <span className="absolute -top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: c.color }}>
                    {c.icon} {c.title}
                  </span>
                  <p className="text-xs text-muted mt-3">{c.sub}</p>
                  <p className="text-[10px] text-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Hover to read more →</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* AWARDS & ACHIEVEMENTS */}
      <section className="py-20 px-6" style={{ background: "var(--lp-ink,#0E2A26)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center lp-eyebrow mb-3">Recognition &amp; Honour</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3 text-center text-white">
              Awards &amp; <span className="italic" style={{ color: "var(--lp-brass-light,#D4A94F)" }}>Achievements</span>
            </h2>
            <p className="text-center max-w-xl mx-auto mb-12 text-white/60">
              Hover over any award to reveal its story. Every shield is a chapter of our excellence.
            </p>
          </Reveal>
          <RevealStagger className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {AWARDS_GALLERY.map((a) => (
              <RevealItem key={a} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover-lift">
                <div className="h-36 flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
                  <span className="text-white/50 text-xs text-center px-3">{a} — replace with real photo</span>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* OUR SERVICES */}
      <section id="services" className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center lp-eyebrow mb-3">What We Offer</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3 text-center" style={{ color: "var(--lp-ink,#0E2A26)" }}>
              Our <span className="italic" style={{ color: "var(--lp-brass,#B8862E)" }}>Services</span>
            </h2>
            <p className="text-muted text-center max-w-xl mx-auto mb-12">
              From sacred pilgrimages to global adventures — we handle every detail so you travel with complete peace of mind.
            </p>
          </Reveal>
          <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <RevealItem key={s.title} className="rounded-2xl overflow-hidden border border-border hover-lift">
                <div className="relative h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 relative">
                  <span className="absolute -top-5 left-5 w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-md" style={{ background: s.color }}>
                    {s.icon}
                  </span>
                  <h3 className="font-display text-lg font-semibold mb-2 mt-2" style={{ color: "var(--lp-ink,#0E2A26)" }}>{s.title}</h3>
                  <p className="text-muted text-sm mb-3">{s.desc}</p>
                  <a href={waLink(`Assalam o Alaikum! I'd like details about ${s.title}.`)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold" style={{ color: "var(--lp-brass,#B8862E)" }}>
                    Learn more →
                  </a>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 px-6" style={{ background: "var(--lp-sand,#F7F2E6)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-center lp-eyebrow mb-3">Why Choose Us</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-12 text-center" style={{ color: "var(--lp-ink,#0E2A26)" }}>
              The <span className="italic" style={{ color: "var(--lp-brass,#B8862E)" }}>East &amp; West</span> Difference
            </h2>
          </Reveal>
          <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {WHY_US.map((w) => (
              <RevealItem key={w.title}>
                <span className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4" style={{ background: w.color }}>{w.icon}</span>
                <h3 className="font-semibold mb-2" style={{ color: "var(--lp-ink,#0E2A26)" }}>{w.title}</h3>
                <p className="text-xs text-muted">{w.desc}</p>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* FINAL CTA */}
      <Reveal className="text-center py-20 px-6" style={{ background: "var(--lp-ink,#0E2A26)" }}>
        <p className="text-3xl mb-3">📦</p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-white">
          Ready to Plan Your <span className="italic" style={{ color: "var(--lp-brass-light,#D4A94F)" }}>Next Journey?</span>
        </h2>
        <p className="text-white/60 mb-8 max-w-xl mx-auto">
          Whether it&apos;s a sacred Umrah, a family holiday, or a business trip — East &amp; West Travel Services is here to make every journey seamless, memorable, and blessed.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href={waLink("Assalam o Alaikum!")} target="_blank" rel="noopener noreferrer" className="bg-[var(--lp-brass,#B8862E)] hover:brightness-110 text-black font-bold px-6 py-3 rounded-lg shadow-md transition">
            📞 Call Us Now
          </a>
          <Link href="/" className="border border-white/30 hover:border-[var(--lp-brass,#B8862E)] px-6 py-3 rounded-lg font-semibold text-white transition-colors">
            🌐 Visit Website
          </Link>
        </div>
      </Reveal>

      <Footer />
    </>
  );
}

function TimelineCard({ t }: { t: TimelineEntry }) {
  return (
    <div className="inline-block text-left bg-white border rounded-2xl p-5 relative" style={{ borderColor: "var(--lp-border,rgba(14,42,38,.12))", boxShadow: "0 4px 16px rgba(14,42,38,0.06)" }}>
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-white mb-2" style={{ background: t.color }}>
        {t.icon} {t.year}
      </span>
      <p className="font-semibold text-sm mb-1" style={{ color: "var(--lp-ink,#0E2A26)" }}>{t.title}</p>
      <p className="text-xs text-muted">{t.desc}</p>
    </div>
  );
}
