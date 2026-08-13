import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import SearchResultsNotice from "@/components/SearchResultsNotice";
import { paxQueryString } from "@/lib/searchState";
import { getUmrahFacets, parseMulti } from "@/lib/filterFacets";
import FilterSidebar from "@/components/FilterSidebar";
import UmrahSearchBar from "@/components/UmrahSearchBar";
import CopyBtn from "@/components/CopyBtn";

export const metadata = {
  title: "Umrah & Hajj Packages | East & West Travel Services",
  description: "Affordable Umrah & Hajj packages from Faisalabad. IATA certified, 500+ pilgrims served.",
  alternates: { canonical: "https://eastwestpk.com/umrah" },
  openGraph: { title: "Umrah & Hajj Packages | East & West Travel Services", description: "Affordable Umrah & Hajj packages from Faisalabad.", url: "https://eastwestpk.com/umrah", type: "website" },
};

export const revalidate = 120;

async function getPackages(q?: string, tier?: string, airline?: string, duration?: string, featured?: string, departureCity?: string) {
  const tiers = parseMulti(tier);
  const airlines = parseMulti(airline);
  const durations = parseMulti(duration);
  try {
    return await prisma.package.findMany({
      where: {
        category: "umrah",
        status: "active",
        ...(tiers.length ? { tier: { in: tiers } } : {}),
        ...(airlines.length ? { airline: { in: airlines } } : {}),
        ...(durations.length ? { duration: { in: durations } } : {}),
        ...(featured === "1" ? { featured: true } : {}),
        ...(departureCity ? { departureCity: { contains: departureCity, mode: "insensitive" } } : {}),
        ...(q ? { OR: [
          { name: { contains: q, mode: "insensitive" } },
          { destination: { contains: q, mode: "insensitive" } },
        ] } : {}),
      },
      include: { roomTypes: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  } catch { return []; }
}

async function getDepartureCities() {
  try {
    const rows = await prisma.package.findMany({ where: { category: "umrah", status: "active" }, select: { departureCity: true } });
    return Array.from(new Set(rows.map(r => r.departureCity).filter(Boolean) as string[])).sort();
  } catch { return []; }
}

export default async function UmrahPage({ searchParams }: { searchParams: Promise<{ q?: string; tier?: string; airline?: string; duration?: string; featured?: string; adults?: string; children?: string; infants?: string; departureCity?: string }> }) {
  const sp = await searchParams;
  const { q, tier, airline, duration, featured, departureCity } = sp;
  const adults = parseInt(sp.adults ?? "1") || 1;
  const [packages, facets, departureCities] = await Promise.all([
    getPackages(q, tier, airline, duration, featured, departureCity),
    getUmrahFacets(),
    getDepartureCities(),
  ]);
  const paxQS = paxQueryString(sp);

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-14 pb-10">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-3">Spiritual Journeys</p>
        <h1 className="font-display text-3xl md:text-5xl font-semibold mb-3">
          Umrah &amp; Hajj <span className="italic text-[var(--lp-brass)]">Packages</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-1 text-sm md:text-base">
          Perform your sacred duty with comfort and complete peace of mind
        </p>
        <p className="text-white/50 text-xs mb-6">
          <Link href="/" className="hover:text-[var(--lp-brass)]">Home</Link>
          <span className="mx-2">/</span>
          <span>Umrah &amp; Hajj</span>
        </p>
        {/* Search bar */}
        <UmrahSearchBar
          durations={facets.durations}
          departureCities={departureCities}
          initialDuration={duration ?? ""}
          initialTravellers={adults}
          initialDepartureCity={departureCity ?? ""}
        />
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <SearchResultsNotice q={q} basePath="/umrah" />
        <div className="flex gap-8 items-start">
          <Suspense fallback={null}>
            <FilterSidebar
              groups={[
                { key: "tier", label: "Package Type", options: facets.tiers },
                { key: "airline", label: "Airline", options: facets.airlines },
                { key: "duration", label: "Duration", options: facets.durations },
              ]}
              booleanToggle={{ key: "featured", label: "Featured Only ⭐" }}
            />
          </Suspense>

          <div className="flex-1 min-w-0">
            {packages.length === 0 ? (
              <div className="max-w-sm mx-auto text-center bg-white border border-border rounded-2xl p-8 shadow-sm">
                <p className="text-5xl mb-4">🕌</p>
                <h3 className="font-display text-xl font-semibold mb-2">{q ? "No Matching Packages" : "No Packages Found"}</h3>
                <p className="text-muted text-sm mb-6 leading-relaxed">
                  {q ? `No package matched "${q}". ` : ""}Contact us for custom Umrah &amp; Hajj quotes.
                </p>
                <a href={waLink("Assalam o Alaikum! Please share Umrah package details.")} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold px-5 py-3 rounded-lg shadow-md transition-colors text-sm">
                  Ask on WhatsApp
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {packages.map((pkg) => {
                  // gallery preview — up to 3 thumbs shown as strip
                  const gallery: string[] = Array.isArray(pkg.galleryUrls) ? (pkg.galleryUrls as string[]) : [];
                  const allImgs = [pkg.imageUrl, ...gallery].filter(Boolean) as string[];
                  const detailHref = pkg.slug ? `/umrah/${pkg.slug}${paxQS ? `?${paxQS}` : ""}` : null;

                  return (
                    <div key={pkg.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
                      {/* IMAGE */}
                      {detailHref ? (
                        <Link href={detailHref} className="relative h-48 bg-surface block overflow-hidden">
                          {allImgs[0] ? <Image src={allImgs[0]} alt={pkg.name} fill className="object-cover transition duration-300 hover:scale-105" /> : <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">🕌</div>}
                          {/* Top badges */}
                          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                            {pkg.duration && <span className="bg-[var(--lp-ink)] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{pkg.duration.toUpperCase()}</span>}
                            {pkg.tier && <span className="bg-[var(--lp-brass)] text-black text-[11px] font-bold px-2.5 py-1 rounded-full">{pkg.tier.toUpperCase()}</span>}
                          </div>
                          {/* Available seats */}
                          {(() => {
                            const totalSlots = pkg.roomTypes.reduce((s, r) => s + (r.availableSlots ?? 0), 0);
                            const hasSlots = pkg.roomTypes.some(r => r.availableSlots != null);
                            if (!hasSlots) return null;
                            return (
                              <div className="absolute bottom-3 left-3 bg-green-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                🟢 {totalSlots} / {totalSlots} Seats Available
                              </div>
                            );
                          })()}
                          {allImgs.length > 1 && <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">+{allImgs.length - 1} photos</div>}
                        </Link>
                      ) : (
                        <div className="relative h-48 bg-surface overflow-hidden">
                          {allImgs[0] ? <Image src={allImgs[0]} alt={pkg.name} fill className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">🕌</div>}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            {pkg.duration && <span className="bg-[var(--lp-ink)] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{pkg.duration.toUpperCase()}</span>}
                            {pkg.tier && <span className="bg-[var(--lp-brass)] text-black text-[11px] font-bold px-2.5 py-1 rounded-full">{pkg.tier.toUpperCase()}</span>}
                          </div>
                        </div>
                      )}

                      {/* Body */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Package name + includes subtitle */}
                        <h3 className="font-bold text-base uppercase tracking-tight mb-0.5">{pkg.name}</h3>
                        {pkg.includes && <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3 line-clamp-1">{pkg.includes.split("\n").join(", ")}</p>}

                        {/* Key details grid */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5 text-xs">
                          {pkg.airline && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted w-4">✈️</span>
                              <span className="font-semibold">{pkg.airline}</span>
                            </div>
                          )}
                          {pkg.duration && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted w-4">🕐</span>
                              <span>{pkg.duration}</span>
                              {pkg.depDate && pkg.retDate && (
                                <span className="text-[var(--lp-brass)] font-semibold ml-auto">{pkg.depDate} – {pkg.retDate}</span>
                              )}
                            </div>
                          )}
                          {pkg.route && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-muted w-4">🗺️</span>
                              <span>{pkg.route}</span>
                              {pkg.flightSectors && Array.isArray(pkg.flightSectors) && (pkg.flightSectors as {type:string;city:string}[]).length > 0 && (
                                <span className="text-[10px] text-muted ml-auto">Direct Flight (Round Trip)</span>
                              )}
                            </div>
                          )}
                          {/* Sector badges */}
                          {pkg.flightSectors && Array.isArray(pkg.flightSectors) && (pkg.flightSectors as {type:string;city:string}[]).length > 0 && (
                            <div className="flex gap-1.5 flex-wrap pt-0.5">
                              {(pkg.flightSectors as {type:string;city:string}[]).slice(0,4).map((s, i) => (
                                <span key={i} className="bg-gray-200 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded">{s.city}</span>
                              ))}
                            </div>
                          )}
                          {pkg.hotels && (
                            <div className="flex items-start gap-2 pt-0.5">
                              <span className="text-muted w-4 mt-0.5">🏨</span>
                              <span className="text-gray-700 leading-snug line-clamp-2">{pkg.hotels}</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          {pkg.copyEnabled && <CopyBtn href={detailHref ? `https://eastwestpk.com${detailHref}` : ""} />}
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${pkg.groupTicketEnabled ? "border-gray-300 text-gray-600 hover:bg-gray-50" : "border-gray-100 text-gray-300 cursor-not-allowed"}`}>✈️ Group Ticket{!pkg.groupTicketEnabled && " 🔒"}</span>
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${pkg.visaEnabled ? "border-gray-300 text-gray-600 hover:bg-gray-50" : "border-gray-100 text-gray-300 cursor-not-allowed"}`}>🛂 Visa{!pkg.visaEnabled && " 🔒"}</span>
                        </div>

                        {/* Price + CTA */}
                        <div className="mt-auto pt-3 border-t border-border/50">
                          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-0.5">Starting From</p>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-display text-xl font-bold text-[var(--lp-brass)]">{pkg.price}</span>
                              {!pkg.price?.includes("PKR") && !pkg.price?.includes("Rs") && <span className="text-muted text-xs ml-1">PKR</span>}
                            </div>
                            {detailHref ? (
                              <Link href={detailHref} className="shrink-0 text-xs font-bold text-white bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] px-4 py-2.5 rounded-xl transition-colors">
                                View Details &amp; Reserve →
                              </Link>
                            ) : (
                              <a href={waLink(`Assalam o Alaikum! I'm interested in "${pkg.name}". Please share details.`)} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-4 py-2.5 rounded-xl transition-colors">
                                📲 Book Now
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] text-center py-14 px-6">
        <p className="font-semibold mb-4">Questions? We reply instantly on WhatsApp</p>
        <a href={waLink("Assalam o Alaikum! I have a question.")} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors">
          Chat on WhatsApp
        </a>
      </section>

      <Footer />
    </>
  );
}

