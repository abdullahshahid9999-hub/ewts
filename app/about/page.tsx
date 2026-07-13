import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import Link from "next/link";
import TrustpilotBadge from "@/components/TrustpilotBadge";

const PARTNERS = [
  { name: "Pullman Hotels & Resorts", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Pullman_Hotels_logo.svg/320px-Pullman_Hotels_logo.svg.png" },
  { name: "Emirates", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/320px-Emirates_logo.svg.png" },
  { name: "Saudia", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Saudi_Arabian_Airlines_logo.svg/320px-Saudi_Arabian_Airlines_logo.svg.png" },
  { name: "Haramain High Speed Rail", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Haramain_High_Speed_Railway_logo.svg/320px-Haramain_High_Speed_Railway_logo.svg.png" },
  { name: "Al Massa", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Al_Massa_Hotel_logo.svg/320px-Al_Massa_Hotel_logo.svg.png" },
  { name: "Scoot", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Scoot_airlines_logo.svg/320px-Scoot_airlines_logo.svg.png" },
  { name: "Garuda Indonesia", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Garuda_Indonesia_logo.svg/320px-Garuda_Indonesia_logo.svg.png" },
  { name: "Oman Air", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Oman_Air_Logo.svg/320px-Oman_Air_Logo.svg.png" },
];

const STATS = [
  { value: "20+ Years", label: "of Experience", desc: "For more than a decade, we have been accompanying Allah's guests. Every trip we organise with love, because we know it's not just a trip — it's a calling." },
  { value: "5,000+", label: "Happy Travellers", desc: "Thousands of pilgrims have attested to the ease and convenience of our services. Now it's your turn to experience an unforgettable spiritual journey with us." },
  { value: "100%", label: "Depart", desc: "No doubts, no delays. We make sure every pilgrim departs on schedule, because your trust is an act of worship that we take care of with all our souls." },
  { value: "4.8 ★", label: "Rating", desc: "This high score is not just a number — it's a reflection of the satisfied hearts, genuine smiles, and prayers of gratitude we receive from every pilgrim who returns home in peace." },
];

const CREDENTIALS = [
  "IATA Certified — International Standard",
  "FBR Registered — Trusted & Legal",
  "95% Visa Success Rate",
  "24/7 Dedicated Support",
];

const WHAT_WE_DO = [
  { title: "Umrah & Hajj Specialists", desc: "Curated Umrah packages with top-rated hotels near Haram, full Ziyarat tours, and 24/7 dedicated support throughout your spiritual journey." },
  { title: "International Holiday Tours", desc: "Dubai, Thailand, Bali, Malaysia and more — premium holiday experiences with flights, hotels, visas, and guided tours all in one package." },
  { title: "Complete Travel Solutions", desc: "Air ticketing, visa assistance, hotel bookings — we handle every detail so you focus on creating memories, not managing paperwork." },
];

const TIMELINE = [
  { year: "2004", icon: "🏢", label: "Founded", desc: "Established in Faisalabad" },
  { year: "2006", icon: "✈️", label: "Air Ticketing", desc: "Full domestic & international ticketing" },
  { year: "2009", icon: "🕌", label: "Umrah Division", desc: "Dedicated Umrah & Hajj packages" },
  { year: "2013", icon: "🏆", label: "IATA Certified", desc: "International certification achieved" },
  { year: "2015", icon: "🌍", label: "Holiday Tours", desc: "Dubai, Thailand, Bali launched" },
  { year: "2016", icon: "🛂", label: "Visa Services", desc: "95% success rate" },
  { year: "2017", icon: "🏨", label: "Hotel Division", desc: "3★ to 5★ worldwide" },
  { year: "2018", icon: "🥇", label: "Top 10 Award", desc: "Top agents in Faisalabad" },
  { year: "2022", icon: "💻", label: "Digital Launch", desc: "Online platform nationwide" },
  { year: "2025", icon: "🚀", label: "New Era", desc: "eastwestpk.com — 5,000+ travelers!" },
];

const SERVICES = [
  { title: "Umrah Packages", desc: "Economy to premium Umrah packages with Makkah & Madinah hotels, Ziyarat, transfers and full support." },
  { title: "Air Ticketing", desc: "Best-price tickets for all airlines — economy, business, domestic and international. Instant e-ticket delivery." },
  { title: "Holiday Tours", desc: "Dubai, Thailand, Bali, Malaysia — complete packages with flights, hotels, visa and guided tours." },
  { title: "Visa Assistance", desc: "UAE, Saudi Arabia, Thailand, Bali visas with 95% success rate and expert documentation support." },
  { title: "Hotel Booking", desc: "3★ to 5★ hotels worldwide — Haram-view hotels, luxury resorts, family suites at best rates." },
  { title: "Group & Corporate Travel", desc: "Special group rates for families, corporate delegations, and religious group Umrah tours." },
];

const TEAM = [
  { name: "Muhammad Usman Rana", role: "Accounts Manager" },
  { name: "Shahid Mahmood", role: "Managing Partner" },
  { name: "Abdullah Shahid", role: "Marketing Team Leader" },
  { name: "Bilal Maqbool", role: "Recovery Officer" },
];

const CERTIFICATIONS = [
  { title: "IATA Certified", desc: "International Air Transport Association" },
  { title: "DTS Certified", desc: "Department of Tourist Services" },
  { title: "FBR Registered", desc: "Federal Board of Revenue, Pakistan" },
  { title: "PTDC Member", desc: "Pakistan Tourism Development Corporation" },
];

const AWARDS = [
  { icon: "🥇", year: "2018", title: "Top 10 Travel Agents", desc: "Recognized among Top 10 Travel Agents in Faisalabad by the regional travel association." },
  { icon: "🏆", year: "2013", title: "IATA Certification", desc: "Achieved IATA certification — a globally recognized standard of excellence in travel services." },
  { icon: "⭐", year: "2022", title: "Customer Excellence", desc: "4.9/5 customer satisfaction rating maintained across 500+ bookings per year." },
];

// Placeholder for images not available in this repo — the live site uses
// its own hosted photography (office photo, team headshots, cert badge
// scans) that we don't have direct access to. Styled gradient block with
// the real caption text stands in until the owner supplies these assets.
function ImagePlaceholder({ caption, className = "" }: { caption: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[#1a2b45] text-center px-4 ${className}`}
    >
      <span className="text-white/70 text-xs font-medium">{caption}</span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-20 pb-24">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
          Pakistan&apos;s Trusted Travel Partner Since 2004
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold mb-8">
          EAST &amp; WEST
        </h1>
        <div className="flex items-center justify-center gap-4">
          <a
            href={waLink("Hi, I want to know more about your travel services.")}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
          >
            Contact Us
          </a>
          <a href="#about-intro" className="border border-white/30 hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors">
            Explore
          </a>
        </div>
        <TrustpilotBadge className="mt-5" />
      </section>

      {/* STATS ROW */}
      <section id="about-intro" className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="font-display text-3xl font-semibold text-gold mb-1">{s.value}</p>
            <p className="font-semibold mb-2">{s.label}</p>
            <p className="text-muted text-sm">{s.desc}</p>
          </div>
        ))}
      </section>

      {/* OUR TRAVEL PARTNER (logo strip) */}
      <section className="bg-[var(--surface)] py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold mb-2">Our Travel Partner</h2>
          <p className="text-muted mb-10">
            Together with the best partners, we present a more comfortable and reliable worship experience.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-80">
            {PARTNERS.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.name} src={p.logo} alt={p.name} title={p.name} className="h-8 md:h-10 object-contain grayscale" />
            ))}
          </div>
        </div>
      </section>

      {/* BEYOND TRAVEL: A SACRED COMMITMENT */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <ImagePlaceholder caption="East & West Travel Services Office" className="h-80 rounded-2xl" />
        <div>
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">Who We Are</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
            Beyond Travel: <span className="italic text-gold">A Sacred Commitment</span>
          </h2>
          <p className="text-muted mb-4">
            East &amp; West Travel Services was founded in 2004 on one simple principle — every
            traveler deserves a journey as meaningful as the destination itself.
          </p>
          <p className="text-muted mb-6">
            From the sacred lands of Makkah to the shores of Bali, we craft every journey with
            care, trust, and 20+ years of expertise. We are not just a travel agency — we are
            your travel partner.
          </p>
          <blockquote className="border-l-4 border-gold pl-4 italic text-lg mb-6">
            &quot;We don&apos;t just book tickets; we build memories that last a lifetime.&quot;
          </blockquote>
          <ul className="space-y-2">
            {CREDENTIALS.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm">
                <span className="text-gold mt-0.5">—</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="bg-[var(--surface)] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3 text-center">What We Do</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-center">
            More Than Just a <span className="italic text-gold">Travel Agency</span>
          </h2>
          <p className="text-muted text-center max-w-2xl mx-auto mb-12">
            Full-service travel — from Umrah pilgrimages to exotic honeymoons, visa processing to air ticketing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHAT_WE_DO.map((w) => (
              <div key={w.title} className="bg-white border border-border rounded-2xl p-6">
                <h3 className="font-display text-xl font-semibold mb-2">{w.title}</h3>
                <p className="text-muted text-sm">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 20 YEARS TIMELINE */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3 text-center">Our Journey</p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 text-center">
          20 Years of Serving <span className="italic text-gold">Pakistan</span>
        </h2>
        <p className="text-muted text-center max-w-2xl mx-auto mb-12">
          From a small office in Faisalabad to one of the city&apos;s most trusted travel agencies.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {TIMELINE.map((t) => (
            <div key={t.year} className="bg-white border border-border rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">{t.icon}</p>
              <p className="font-display text-lg font-semibold text-gold mb-1">{t.year}</p>
              <p className="font-semibold text-sm mb-1">{t.label}</p>
              <p className="text-muted text-xs">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EVERYTHING YOU NEED TO TRAVEL */}
      <section className="bg-[var(--navy)] text-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3 text-center">Our Services</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-12 text-center">
            Everything You Need to <span className="italic text-gold">Travel</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-white/70 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3 text-center">Our Expertise Team</p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-12 text-center">
          The People Behind Your <span className="italic text-gold">Journey</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TEAM.map((t) => (
            <div key={t.name} className="text-center">
              <ImagePlaceholder caption={t.name} className="h-32 w-32 mx-auto rounded-full mb-3" />
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-muted text-xs">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section className="bg-[var(--surface)] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3 text-center">Certifications</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-12 text-center">
            Certified, Trusted, <span className="italic text-gold">Professional</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CERTIFICATIONS.map((c) => (
              <div key={c.title} className="bg-white border border-border rounded-2xl p-6 text-center">
                <p className="font-semibold mb-1">{c.title}</p>
                <p className="text-muted text-xs">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AWARDS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3 text-center">Awards &amp; Recognition</p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-12 text-center">
          Recognized for <span className="italic text-gold">Excellence</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {AWARDS.map((a) => (
            <div key={a.title} className="bg-white border border-border rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">{a.icon}</p>
              <p className="text-gold font-semibold text-sm mb-1">{a.year}</p>
              <p className="font-semibold mb-2">{a.title}</p>
              <p className="text-muted text-xs">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--navy)] text-white text-center py-20 px-6">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">Ready to Travel?</p>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
          Start Your Journey with Us <span className="italic text-gold">Today</span>
        </h2>
        <p className="text-white/70 mb-8">Join 5,000+ satisfied travelers who trust East &amp; West Travel Services.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/umrah" className="bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors">
            Explore Umrah Packages
          </Link>
          <a
            href={waLink("Assalam o Alaikum!")}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/30 hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            WhatsApp Us
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
