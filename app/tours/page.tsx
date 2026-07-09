import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getPackages() {
  try {
    return await prisma.package.findMany({
      where: { category: "tours", status: "active" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function ToursPage() {
  const packages = await getPackages();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-14">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
          International Travel
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          World <span className="italic text-gold">Tours</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-4">
          &quot;Explore Dubai, Thailand, Bali, Malaysia and beyond&quot;
        </p>
        <p className="text-white/50 text-sm">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <span>World Tours</span>
        </p>
      </section>

      {/* FILTER TABS — cosmetic; Package model has no Family subtype field */}
      <section className="max-w-6xl mx-auto px-6 pt-10">
        <div className="flex flex-wrap gap-2 justify-center mb-10 text-sm">
          <span className="rounded-full bg-gold text-black font-semibold px-4 py-1.5">All</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">World Tour</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">Family</span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        {packages.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white border border-border rounded-2xl p-10">
            <p className="text-4xl mb-4">🕌</p>
            <h3 className="font-display text-xl font-semibold mb-2">No Packages Available</h3>
            <p className="text-muted text-sm mb-6">
              Our team is preparing amazing World Tours. Contact us for custom quotes.
            </p>
            <a
              href={waLink("Assalam o Alaikum! I want to inquire about World Tours. Please share details.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              WhatsApp for a Quote
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative h-44 bg-surface">
                  {pkg.imageUrl && (
                    <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
                  )}
                  {pkg.featured && (
                    <span className="absolute top-3 left-3 bg-gold text-black text-xs font-semibold px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg mb-1">{pkg.name}</h3>
                  <p className="text-muted text-sm mb-2">
                    {pkg.duration} {pkg.destination ? `· ${pkg.destination}` : ""}
                  </p>
                  {pkg.includes && (
                    <p className="text-sm mb-3">
                      <span className="font-semibold">What&apos;s Included: </span>
                      {pkg.includes}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-display text-xl font-semibold text-gold">
                      {pkg.price}
                      {pkg.priceNote && (
                        <span className="text-muted text-xs font-sans font-normal ml-1">{pkg.priceNote}</span>
                      )}
                    </span>
                    {pkg.slug ? (
                      <Link href={`/tours/${pkg.slug}`} className="text-sm font-semibold text-gold hover:underline">
                        View Details →
                      </Link>
                    ) : (
                      <a
                        href={waLink(`Assalam o Alaikum! I'm interested in the "${pkg.name}" package.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gold hover:underline"
                      >
                        Enquire on WhatsApp →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Note: the live site shows a "Sign in / Continue as guest" panel
          here, left over from its legacy Supabase auth. This rebuild is
          deliberately WhatsApp-first with no public-site accounts, so that
          panel is intentionally not reproduced — see repo brief. */}

      <section className="bg-[var(--surface)] text-center py-16 px-6">
        <p className="font-semibold mb-4">Questions? We reply instantly on WhatsApp</p>
        <a
          href={waLink("Assalam o Alaikum! I have a question.")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
        >
          Chat on WhatsApp
        </a>
      </section>

      <Footer />
    </>
  );
}
