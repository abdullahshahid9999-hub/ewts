import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import { paxQueryString } from "@/lib/searchState";
import { getVisaFacets, parseMulti } from "@/lib/filterFacets";
import VisaSearchBar from "@/components/VisaSearchBar";
import VisaPageClient from "@/components/VisaPageClient";

export const metadata = {
  title: "Apply Visit Visa Online from Pakistan | East & West Travel Services",
  description: "Apply for UAE, Thailand, Malaysia, UK, Schengen & Saudi Arabia visit visa from Pakistan. IATA certified agents in Faisalabad. 95% approval rate.",
  alternates: { canonical: "https://eastwestpk.com/visa" },
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
        price: true, priceAdult: true,
        validity: true, maxStay: true, processingTime: true,
        countryFlag: true, countryImage: true,
      },
    });
  } catch { return []; }
}

const TRENDING = [
  { label: "UAE", sub: "Visit Visa (30 Days)", flag: "🇦🇪", q: "UAE" },
  { label: "Saudi Arabia", sub: "Visit Visa", flag: "🇸🇦", q: "Saudi Arabia" },
  { label: "Malaysia", sub: "Tourist Visa", flag: "🇲🇾", q: "Malaysia" },
  { label: "Thailand", sub: "Tourist Visa", flag: "🇹🇭", q: "Thailand" },
  { label: "Turkey", sub: "Tourist Visa", flag: "🇹🇷", q: "Turkey" },
  { label: "UK", sub: "Visit Visa", flag: "🇬🇧", q: "UK" },
  { label: "Schengen", sub: "Visit Visa", flag: "🇪🇺", q: "Schengen" },
  { label: "Canada", sub: "Visit Visa", flag: "🇨🇦", q: "Canada" },
];

const STATS = [
  { value: "95%", label: "Approval Rate" },
  { value: "20+", label: "Countries" },
  { value: "500+", label: "Visas This Year" },
  { value: "7–15", label: "Working Days" },
];

const FAQS = [
  { q: "What documents are required for visit visa?", a: "Generally: valid passport (6+ months), photographs, bank statement (3-6 months), confirmed return flight, hotel reservation, CNIC copy. Requirements vary by country." },
  { q: "How long does visit visa processing take?", a: "UAE: 3-5 working days, Turkey: 7-10 days, UK/Schengen: 10-15 days. We track your application throughout." },
  { q: "What is the fee for Dubai visit visa?", a: "Dubai 30-day visit visa starts from PKR 18,000-25,000. Prices vary based on visa type, urgency, and service charges. Contact us for exact pricing." },
  { q: "Can I apply for visit visa online?", a: "Yes — we handle the entire online application process for you. Just share your documents via WhatsApp and we do the rest." },
  { q: "How long can I stay on a tourist visa?", a: "UAE: 30 or 60 days, Turkey: 30-90 days, Schengen: up to 90 days in 180-day period, UK: up to 6 months." },
  { q: "Can I extend my visit visa?", a: "Extension policies vary by country. UAE allows extensions inside the country. Contact us before your visa expires to discuss options." },
];

export default async function VisaPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; processingTime?: string; adults?: string; children?: string; infants?: string; occupation?: string }> }) {
  const sp = await searchParams;
  const { q, type, processingTime, occupation } = sp;
  const [visas, facets] = await Promise.all([getVisas(q, type, processingTime), getVisaFacets()]);
  const adults = sp.adults ? Math.max(1, parseInt(sp.adults, 10) || 1) : 1;
  const children = sp.children ? Math.max(0, parseInt(sp.children, 10) || 0) : 0;
  const infants = sp.infants ? Math.max(0, parseInt(sp.infants, 10) || 0) : 0;

  return (
    <>
      <Navbar />

      {/* HERO — light background like Mosafir */}
      <section className="bg-white border-b border-gray-100 px-4 pt-10 pb-8 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">
          Apply Visit Visa Online — from Pakistan
        </h1>
        <p className="text-gray-500 text-sm mb-6">IATA certified · 95% approval rate · We handle all paperwork</p>
        <div className="max-w-4xl mx-auto">
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
        </div>
        {/* Trending searches */}
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {["UAE","Thailand","Malaysia","Turkey","UK","Saudi Arabia"].map((c) => (
            <Link key={c} href={`/visa?q=${c}`}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${q === c ? "bg-amber-600 text-white border-amber-600" : "border-gray-300 text-gray-600 hover:border-amber-500 hover:text-amber-700"}`}>
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
          {STATS.map((s) => (
            <div key={s.label} className="text-center py-6 px-4">
              <p className="text-2xl font-bold text-amber-700">{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRENDING DESTINATIONS */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Trending Searches</h2>
        <div className="w-12 h-1 bg-amber-600 mb-5 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRENDING.map((t) => (
            <Link key={t.label} href={`/visa?q=${t.q}`}
              className="relative rounded-xl overflow-hidden h-32 bg-gray-200 flex flex-col justify-end group hover:shadow-lg transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
              <div className="absolute inset-0 flex items-center justify-center text-5xl z-0 opacity-40">{t.flag}</div>
              <div className="relative z-20 p-3">
                <p className="text-white font-bold text-sm">{t.label}</p>
                <p className="text-white/75 text-xs">{t.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* VISA CARDS */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        {q && (
          <p className="text-sm text-gray-500 mb-4">
            Showing results for <strong>&ldquo;{q}&rdquo;</strong> —{" "}
            <Link href="/visa" className="text-amber-700 font-semibold hover:underline">Clear search</Link>
          </p>
        )}
        <div className="flex gap-2 flex-wrap mb-6">
          {["All Visas","Tourist","Umrah","Business"].map((tab) => (
            <Link key={tab} href={tab === "All Visas" ? "/visa" : `/visa?type=${tab}`}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${(!type && tab === "All Visas") || type === tab ? "bg-amber-700 text-white border-amber-700" : "border-gray-300 text-gray-600 hover:border-amber-500"}`}>
              {tab}
            </Link>
          ))}
        </div>
        {visas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛂</p>
            <h3 className="font-bold text-lg mb-2">{q ? `No results for "${q}"` : "No visa services listed yet"}</h3>
            <p className="text-gray-500 text-sm mb-5">Tell us your destination — we'll confirm requirements directly.</p>
            <a href={waLink("Assalam o Alaikum! I'd like details about visa services.")} target="_blank" rel="noopener noreferrer"
              className="inline-block bg-amber-700 text-white font-bold px-6 py-3 rounded-lg">Ask on WhatsApp</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visas.map((v) => (
              <div key={v.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="relative h-36 bg-gray-100">
                  {v.countryImage
                    ? <Image src={v.countryImage} alt={v.country} fill className="object-cover" />
                    : <div className="absolute inset-0 flex items-center justify-center text-5xl">{v.countryFlag ?? "🌍"}</div>}
                  <div className="absolute bottom-2 left-2 bg-white/90 text-xs font-bold px-2 py-0.5 rounded capitalize">{v.type}</div>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-sm text-gray-900 mb-1 leading-snug">{v.title}</h3>
                  <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                    {v.processingTime && <p>⏱ {v.processingTime}</p>}
                    {v.validity && <p>📅 {v.validity}</p>}
                    {v.maxStay && <p>🏨 Max stay: {v.maxStay}</p>}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">From</p>
                      <p className="text-base font-bold text-amber-700">
                        {v.priceAdult != null ? `PKR ${v.priceAdult.toLocaleString()}` : (v.price ?? "Enquire")}
                      </p>
                    </div>
                    <Link href={`/visa/${v.id}?adults=${adults}&children=${children}&infants=${infants}${occupation ? `&occupation=${occupation}` : ""}`}
                      className="text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 px-3 py-1.5 rounded-lg transition-colors">
                      Apply →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEO CONTENT — collapsible via client component */}
      <VisaPageClient />

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Frequently Asked Questions</h2>
        <div className="w-12 h-1 bg-amber-600 mb-6 rounded" />
        <div className="grid md:grid-cols-2 gap-3">
          {FAQS.map((f, i) => (
            <details key={i} className="border border-gray-200 rounded-xl p-4 group cursor-pointer">
              <summary className="font-semibold text-sm text-gray-800 flex items-center justify-between list-none">
                {f.q}
                <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
