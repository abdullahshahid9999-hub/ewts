import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120; // re-fetch featured content every 2 minutes

async function getFeaturedPackages() {
  try {
    return await prisma.package.findMany({
      where: { featured: true, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await getFeaturedPackages();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
          IATA / DTS Certified &middot; Since 2003
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold leading-tight mb-6">
          Your journey, <span className="italic text-gold">handled with care.</span>
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto mb-8">
          Umrah packages, tours, group air tickets, visa services, and travel
          insurance — from a Faisalabad-based agency trusted by families for
          over two decades.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href={waLink("Assalam o Alaikum! I am interested in your travel services. Please share details.")}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
          >
            WhatsApp Us
          </a>
          <Link
            href="/umrah"
            className="border border-border hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Explore Umrah Packages
          </Link>
        </div>
      </section>

      {/* FEATURED PACKAGES */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="font-display text-3xl font-semibold mb-8">
            Featured <span className="italic text-gold">Packages</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="relative h-44 bg-surface">
                  {pkg.imageUrl && (
                    <Image
                      src={pkg.imageUrl}
                      alt={pkg.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-1">{pkg.name}</h3>
                  <p className="text-muted text-sm mb-3">
                    {pkg.duration} {pkg.destination ? `· ${pkg.destination}` : ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl font-semibold text-gold">
                      {pkg.price}
                    </span>
                    <a
                      href={waLink(`Assalam o Alaikum! I'm interested in the "${pkg.name}" package.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gold hover:underline"
                    >
                      Enquire →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SERVICE CATEGORIES */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { href: "/umrah", title: "Umrah Packages", desc: "Guided, all-inclusive Umrah packages for individuals and families." },
          { href: "/group-tickets", title: "Group Air Tickets", desc: "Wholesale group fares on major routes, seats update in real time." },
          { href: "/visa", title: "Visa Services", desc: "Tourist, business, work and Umrah visa processing for dozens of countries." },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block bg-surface border border-border rounded-2xl p-6 hover:border-gold transition-colors"
          >
            <h3 className="font-display text-xl font-semibold mb-2">{c.title}</h3>
            <p className="text-muted text-sm">{c.desc}</p>
          </Link>
        ))}
      </section>

      <Footer />
    </>
  );
}
