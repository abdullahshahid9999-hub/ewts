import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import SearchResultsNotice from "@/components/SearchResultsNotice";
import { paxQueryString } from "@/lib/searchState";
import { getToursFacets, parseMulti } from "@/lib/filterFacets";
import FilterSidebar from "@/components/FilterSidebar";

export const revalidate = 120;

async function getPackages(q?: string, tier?: string, airline?: string, duration?: string) {
  const tiers = parseMulti(tier);
  const airlines = parseMulti(airline);
  const durations = parseMulti(duration);
  try {
    return await prisma.package.findMany({
      where: {
        category: "tours",
        status: "active",
        ...(tiers.length ? { tier: { in: tiers } } : {}),
        ...(airlines.length ? { airline: { in: airlines } } : {}),
        ...(durations.length ? { duration: { in: durations } } : {}),
        ...(q ? { OR: [
          { name: { contains: q, mode: "insensitive" } },
          { destination: { contains: q, mode: "insensitive" } },
        ] } : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function ToursPage({ searchParams }: { searchParams: Promise<{ q?: string; tier?: string; airline?: string; duration?: string; adults?: string; children?: string; infants?: string }> }) {
  const sp = await searchParams;
  const { q, tier, airline, duration } = sp;
  const [packages, facets] = await Promise.all([getPackages(q, tier, airline, duration), getToursFacets()]);
  const paxQS = paxQueryString(sp);

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-14">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
          World Tours
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          World <span className="italic text-gold">Tour Packages</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-4">
          Explore the world with curated, all-inclusive tour packages
        </p>
        <p className="text-white/50 text-sm">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <span>World Tours</span>
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <SearchResultsNotice q={q} basePath="/tours" />
        <div className="flex gap-8 items-start">
          <Suspense fallback={null}>
            <FilterSidebar
              groups={[
                { key: "tier", label: "Package Type", options: facets.tiers },
                { key: "airline", label: "Airline", options: facets.airlines },
                { key: "duration", label: "Duration", options: facets.durations },
              ]}
            />
          </Suspense>

          <div className="flex-1 min-w-0">
            {packages.length === 0 ? (
              <div className="max-w-md mx-auto text-center bg-white border border-border rounded-2xl p-10">
                <p className="text-4xl mb-4">🌍</p>
                <h3 className="font-display text-xl font-semibold mb-2">{q ? "No Matching Packages" : "No Packages Available"}</h3>
                <p className="text-muted text-sm mb-6">
                  {q ? `We couldn't find a package matching "${q}". ` : ""}Our team is preparing amazing World Tours, or try clearing a filter.
                </p>
                <a
                  href={waLink("Assalam o Alaikum! Please share World Tour package details.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
                >
                  Ask on WhatsApp
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
                  >
                    <div className="relative h-44 bg-surface">
                      {pkg.imageUrl && (
                        <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-[var(--navy)] text-white text-xs font-semibold px-2 py-1 rounded">Tour</span>
                        {pkg.featured && (
                          <span className="bg-gold text-black text-xs font-semibold px-2 py-1 rounded">Featured</span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-semibold text-lg mb-1">{pkg.name}</h3>
                      <p className="text-muted text-sm mb-2">
                        {pkg.duration} {pkg.destination ? `· ${pkg.destination}` : ""}
                      </p>
                      {pkg.hotels && <p className="text-muted text-sm mb-2">Hotels: {pkg.hotels}</p>}
                      {pkg.includes && (
                        <p className="text-sm mb-3">
                          <span className="font-semibold">What&apos;s Included: </span>
                          {pkg.includes}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="font-display text-xl font-semibold text-gold">
                          {pkg.price}
                          <span className="text-muted text-xs font-sans font-normal ml-1">per person</span>
                        </span>
                        {pkg.slug ? (
                          <Link href={`/tours/${pkg.slug}${paxQS ? `?${paxQS}` : ""}`} className="text-sm font-semibold text-gold hover:underline">
                            View Details →
                          </Link>
                        ) : (
                          <a
                            href={waLink(`Assalam o Alaikum! I'm interested in the "${pkg.name}" package.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-gold hover:underline"
                          >
                            Book This Package on WhatsApp →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
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
