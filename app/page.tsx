import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustpilotBadge from "@/components/TrustpilotBadge";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getFeaturedPackages() {
  try {
    return await prisma.package.findMany({
      where: { status: "active" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
    });
  } catch {
    return [];
  }
}

const HERO_STATS = [
  { value: "5,000+", label: "Travelers Served" },
  { value: "20+", label: "Years in Business" },
  { value: "15+", label: "Destinations" },
  { value: "500+", label: "Umrah Pilgrims" },
];

const WHY_CARDS = [
  {
    title: "Zero Hidden Charges",
    desc: "What we quote is what you pay. No surprise fees. No fine print. Complete transparency from day one.",
  },
  {
    title: "100% Halal Travel",
    desc: "Every package is designed with Islamic values in mind — halal food, prayer times, family-friendly accommodations.",
  },
  {
    title: "24/7 On-Ground Support",
    desc: "From Faisalabad airport to your hotel abroad — our team is reachable around the clock, every day.",
  },
  {
    title: "Licensed & Trusted",
    desc: "Officially licensed, Umrah Ministry approved, and trusted by 5,000+ Pakistani families over 8 years.",
  },
];

const WHY_STATS = [
  { value: "5,000+", label: "Travelers Served" },
  { value: "500+", label: "Umrah Pilgrims" },
  { value: "15+", label: "Destinations" },
  { value: "8+", label: "Years Experience" },
  { value: "4.9★", label: "Average Rating" },
];

const TESTIMONIALS = [
  {
    name: "Muhammad Asif",
    location: "Faisalabad",
    trip: "Umrah 2024",
    quote:
      "The Umrah package was exceptional. Hotel was right next to Haram, meals were great, and the team was available whenever we needed. Will definitely book again for my parents.",
  },
  {
    name: "Fatima Khalid",
    location: "Lahore",
    trip: "Dubai Tour 2024",
    quote:
      "Booked the Dubai tour for my family — visa, flights, hotel, everything handled. Not a single problem throughout the trip. These people are genuine professionals.",
  },
  {
    name: "Haji Zubair Ahmed",
    location: "Faisalabad",
    trip: "Umrah 2023",
    quote:
      "14-night Umrah was the most peaceful experience of my life. Abdullah bhai personally made sure everything was perfect. Jazakallah khair to the whole team.",
  },
];

const FAQS = [
  {
    q: "How much advance payment is required to confirm a booking?",
    a: "50% advance per person is required to confirm your booking. The remaining balance is due 15 days before departure. Bank account details are provided after booking confirmation.",
  },
  {
    q: "What documents are needed for Umrah visa?",
    a: "Valid passport (minimum 6 months validity), 2 passport-size photos, and CNIC copy. We handle the entire visa application process — normally takes 7–15 working days.",
  },
  {
    q: "Can I book from outside Faisalabad?",
    a: "Absolutely. We serve clients from all across Pakistan. Everything — documents, payments, confirmations — can be handled online through WhatsApp and email.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellations 30+ days before departure: 70% refund. 15–30 days: 50% refund. Less than 15 days: no refund. Unexpected airline fare changes remain the passenger's responsibility.",
  },
  {
    q: "Are halal meals guaranteed on international tours?",
    a: "Yes. We specifically partner with halal-certified hotels and restaurants on all our international tours including Dubai, Thailand, and Bali.",
  },
];

const DEST_CHIPS = [
  "Umrah & Hajj", "Makkah & Madinah", "Dubai UAE", "Thailand",
  "Bali Indonesia", "Family Packages", "Visa Services",
];

function HeroImg({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <Image src={src} alt={label} fill className="object-cover" />
      <span className="absolute bottom-3 left-3 z-10 text-xs font-semibold text-white bg-black/50 px-2.5 py-1 rounded">
        {label}
      </span>
    </div>
  );
}

export default async function Home() {
  const packages = await getFeaturedPackages();

  return (
    <>
      <Navbar />

      {/* HERO — dark navy, two-column (text left, image collage right), matches live site */}
      <section className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-gold text-xs font-semibold tracking-wide uppercase bg-white/5 border border-gold/30 rounded-full px-4 py-2 mb-6">
              📍 Faisalabad&apos;s Trusted Travel Partner
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-semibold leading-tight mb-6">
              Your Journey<br />
              <span className="italic text-gold">Starts Here</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg">
              From the sacred lands of Makkah to the shores of Bali — we craft
              every journey with care, trust, and 20+ years of experience. No
              shortcuts. No hidden charges.
            </p>
            <div className="flex items-center gap-4 flex-wrap mb-10">
              <a
                href={waLink("Assalam o Alaikum! I'd like to explore your travel services.")}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
              >
                Explore Services
              </a>
              <a
                href={waLink("Assalam o Alaikum!")}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/20 hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
            <TrustpilotBadge className="mb-6" />
            <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-semibold">{s.value}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-4 h-[420px]">
            <HeroImg src="/images/makarem_1.jpeg" label="Makarem Ajyad Makkah" className="row-span-2" />
            <HeroImg src="/images/pullman_1.jpeg" label="Madinah" />
            <HeroImg src="/images/makarem_2.jpeg" label="Premium Rooms" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:-left-4 bg-gold text-black rounded-xl px-4 py-3 shadow-lg text-center">
              <div className="font-display text-lg font-bold leading-none">4.9★</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide">Customer Rating</div>
            </div>
          </div>
        </div>

        {/* Destination chip strip */}
        <div className="border-t border-white/10 py-5">
          <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-3 justify-center">
            {DEST_CHIPS.map((chip) => (
              <span
                key={chip}
                className="text-xs font-semibold px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PACKAGES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
            Hand-Picked For You
          </p>
          <h2 className="font-display text-3xl font-semibold">
            Featured <span className="italic text-gold">Packages</span>
          </h2>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border rounded-2xl">
            <p className="text-muted mb-4">
              No packages available right now. WhatsApp us for custom quotes!
            </p>
            <a
              href={waLink("Assalam o Alaikum! I'd like a custom travel quote.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative h-44 bg-surface">
                  {pkg.imageUrl && (
                    <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-1">{pkg.name}</h3>
                  <p className="text-muted text-sm mb-3">
                    {pkg.duration} {pkg.destination ? `· ${pkg.destination}` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl font-semibold text-gold">{pkg.price}</span>
                    {pkg.slug ? (
                      <Link href={`/${pkg.category}/${pkg.slug}`} className="text-sm font-semibold text-gold hover:underline">
                        View Details →
                      </Link>
                    ) : (
                      <a
                        href={waLink(`Assalam o Alaikum! I'm interested in the "${pkg.name}" package.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gold hover:underline"
                      >
                        Enquire →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-surface py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">Why Choose Us</p>
            <h2 className="font-display text-3xl font-semibold mb-3">
              We Do Things <span className="italic text-gold">Differently</span>
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Eight years of building trust — one journey at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {WHY_CARDS.map((c) => (
              <div key={c.title} className="bg-white border border-border rounded-2xl p-6">
                <h3 className="font-display text-lg font-semibold mb-2">{c.title}</h3>
                <p className="text-muted text-sm">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
            {WHY_STATS.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl font-semibold text-gold">{s.value}</div>
                <div className="text-xs text-muted uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">Real Reviews</p>
          <h2 className="font-display text-3xl font-semibold">
            Words from Our <span className="italic text-gold">Travelers</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <div className="text-gold mb-3">★★★★★</div>
              <p className="text-text2 text-sm mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold-bg text-gold font-bold flex items-center justify-center text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted">{t.location} · {t.trip}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">FAQ</p>
            <h2 className="font-display text-3xl font-semibold">
              Common <span className="italic text-gold">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-white border border-border rounded-xl p-5 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  {f.q}
                  <span className="text-gold group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-muted text-sm mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-4xl font-semibold mb-4">
          Ready to Plan Your <span className="italic text-gold">Next Journey?</span>
        </h2>
        <p className="text-muted mb-8">
          Talk to us today — no obligation, just honest advice about the best package for you.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
          <a
            href={waLink("Assalam o Alaikum! I'd like to book a tour.")}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
          >
            Book a Tour
          </a>
          <a
            href={waLink("Assalam o Alaikum!")}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            WhatsApp
          </a>
        </div>
        <p className="text-xs text-muted">
          Questions? We reply instantly on WhatsApp —{" "}
          <a href={waLink("Assalam o Alaikum!")} className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">
            Chat on WhatsApp
          </a>
        </p>
      </section>

      <Footer />
    </>
  );
}
