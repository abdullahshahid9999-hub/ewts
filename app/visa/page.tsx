import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import SearchResultsNotice from "@/components/SearchResultsNotice";
import { paxQueryString } from "@/lib/searchState";
import { getVisaFacets, parseMulti } from "@/lib/filterFacets";
import FilterSidebar from "@/components/FilterSidebar";
import VisaSearchBar from "@/components/VisaSearchBar";
import VisaStoriesSection from "@/components/VisaStoriesSection";

export const metadata = {
  title: "Visa Services | East & West Travel Services Faisalabad",
  description: "Fast & reliable visa consultancy for UAE, Thailand, Malaysia, UK, Schengen and more. IATA certified agents, Faisalabad.",
  alternates: { canonical: "https://eastwestpk.com/visa" },
  openGraph: { title: "Visa Services | East & West Travel Services Faisalabad", description: "Fast & reliable visa consultancy for UAE, Thailand, Malaysia, UK, Schengen and more. IATA certified agents, Faisalabad.", url: "https://eastwestpk.com/visa", type: "website" },
};


export const revalidate = 120;

async function getVisas(q?: string, type?: string, processingTime?: string) {
  const types = parseMulti(type);
  const processingTimes = parseMulti(processingTime);
  try {
    return await prisma.visaService.findMany({
      where: {
        status: "active",
        ...(types.length ? { type: { in: types } } : {}),
        ...(processingTimes.length ? { processingTime: { in: processingTimes } } : {}),
        ...(q ? { OR: [
          { title: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
        ] } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, country: true, type: true,
        price: true, priceAdult: true, priceChild: true, priceInfant: true,
        validity: true, maxStay: true, processingTime: true,
        requirements: true, countryFlag: true, countryImage: true,
      },
    });
  } catch {
    return [] as { id: string; title: string; country: string; type: string; price: string | null; priceAdult: number | null; priceChild?: number | null; priceInfant?: number | null; validity: string | null; maxStay: string | null; processingTime: string | null; requirements: string | null; countryFlag: string | null; countryImage: string | null }[];
  }
}

const STATS = [
  { value: "95%", label: "Approval Rate" },
  { value: "20+", label: "Countries" },
  { value: "500+", label: "Visas This Year" },
  { value: "7–15", label: "Working Days" },
];

const STEPS = [
  { step: "1", title: "WhatsApp Us", desc: "Click Apply on any visa — we reply within 1 hour" },
  { step: "2", title: "Submit Documents", desc: "We guide you through exactly what paperwork is needed" },
  { step: "3", title: "We Process", desc: "We submit and track your application at the embassy" },
  { step: "4", title: "Visa Ready!", desc: "Collect your visa or receive it digitally" },
];

export default async function VisaPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; processingTime?: string; adults?: string; children?: string; infants?: string; occupation?: string }> }) {
  const sp = await searchParams;
  const { q, type, processingTime, occupation } = sp;
  const [visas, facets] = await Promise.all([getVisas(q, type, processingTime), getVisaFacets()]);
  const paxQS = paxQueryString(sp);
  const adults = sp.adults ? Math.max(1, parseInt(sp.adults, 10) || 1) : 1;
  const children = sp.children ? Math.max(0, parseInt(sp.children, 10) || 0) : 0;
  const infants = sp.infants ? Math.max(0, parseInt(sp.infants, 10) || 0) : 0;

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--lp-ink)] text-white text-center px-6 pt-16 pb-14">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-4">
          Visa Services
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Visa Assistance <span className="italic text-[var(--lp-brass)]">Made Easy</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-8">
          95% approval rate — we handle all paperwork for you
        </p>
        {/* Search bar */}
        <VisaSearchBar
          defaultCountry={q ?? ""}
          defaultCategory={type ?? ""}
          defaultOccupation={occupation ?? ""}
          defaultAdults={adults}
          defaultChildren={children}
          defaultInfants={infants}
          dbCountries={facets.countries}
          countryTypeMap={facets.countryTypeMap}
        />
      </section>

      {/* STATS BAR */}
      <section className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="font-display text-3xl font-semibold text-[var(--lp-brass)]">{s.value}</p>
            <p className="text-muted text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* FILTER TABS — cosmetic, mirrors VisaService.type values */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap gap-2 justify-center mb-10 text-sm">
          <span className="rounded-full bg-[var(--lp-brass)] text-black font-semibold px-4 py-1.5">All Visas</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">Tourist</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">Umrah</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">Business</span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <SearchResultsNotice q={q} basePath="/visa" />
        {/* Mobile filter button */}
        <div className="flex items-center justify-between mb-4 sm:hidden">
          <p className="text-sm text-muted font-medium">{visas.length} visa{visas.length !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex gap-6 items-start">
          <Suspense fallback={null}>
            <FilterSidebar groups={[
              { key: "type", label: "Visa Type", options: facets.types },
              { key: "processingTime", label: "Processing Time", options: facets.processingTimes },
            ]} />
          </Suspense>
          <div className="flex-1 min-w-0">
        {visas.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white border border-border rounded-2xl p-10">
            <p className="text-4xl mb-4">🛂</p>
            <h3 className="font-display text-xl font-semibold mb-2">{q ? "No Matching Visas" : "No Visa Services Listed"}</h3>
            <p className="text-muted text-sm mb-6">
              {q ? `We couldn't find a visa service matching "${q}". ` : ""}Tell us your destination and we&apos;ll confirm requirements and pricing directly.
            </p>
            <a
              href={waLink("Assalam o Alaikum! I'd like details about visa services.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              Ask on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {visas.map((v: { id: string; title: string; country: string; type: string; price: string | null; priceAdult: number | null; validity: string | null; maxStay: string | null; processingTime: string | null; requirements: string | null; countryFlag: string | null; countryImage: string | null }) => (
              <div
                key={v.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative h-48 bg-surface">
                  {v.countryImage && (
                    <Image src={v.countryImage} alt={v.country} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    {v.countryFlag && <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{v.countryFlag}</span>}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base leading-tight text-gray-900">
                        {/* Strip trailing country name if duplicated at end of title */}
                        {v.title.replace(new RegExp(`\\s*${v.country}\\s*$`, "i"), "").trim() || v.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">{v.type}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{v.country}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-gray-500 mb-4">
                    {v.processingTime && <p className="flex items-center gap-1.5"><span className="text-base">⏱</span> {v.processingTime}</p>}
                    {v.validity && <p className="flex items-center gap-1.5"><span className="text-base">📅</span> {v.validity}</p>}
                    {v.maxStay && <p className="flex items-center gap-1.5"><span className="text-base">🏨</span> Max stay: {v.maxStay}</p>}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Starting from</p>
                      <span className="font-display text-xl font-semibold" style={{ color: "var(--lp-brass)" }}>
                        {v.priceAdult != null ? `PKR ${v.priceAdult.toLocaleString()}` : (v.price ?? "Enquire")}
                      </span>
                    </div>
                    <Link href={`/visa/${v.id}?adults=${adults}&children=${children}&infants=${infants}${occupation ? `&occupation=${occupation}` : ""}`}
                      className="text-sm font-bold text-black px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                      style={{ background: "var(--lp-brass)" }}>
                      View &amp; Apply →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[var(--surface)] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-3 text-center">Process</p>
          <h2 className="font-display text-3xl font-semibold mb-12 text-center">
            How It <span className="italic text-[var(--lp-brass)]">Works</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--lp-brass)] text-black font-bold flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-muted text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <VisaStoriesSection />

      <Footer />
    </>
  );
}
