import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import { filterDocsForApplicant, APPLICANT_CATEGORIES } from "@/lib/visaApplicantCategory";

export const revalidate = 60;

async function getVisa(id: string) {
  try {
    return await prisma.visaService.findUnique({
      where: { id, status: "active" },
      include: { requiredDocuments: { orderBy: [{ sortOrder: "asc" }] } },
    });
  } catch { return null; }
}

export default async function VisaDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adults?: string; children?: string; infants?: string; occupation?: string }>;
}) {
  const sp = await searchParams;
  const adults = sp.adults ? Math.max(1, parseInt(sp.adults, 10) || 1) : 1;
  const children = sp.children ? Math.max(0, parseInt(sp.children, 10) || 0) : 0;
  const infants = sp.infants ? Math.max(0, parseInt(sp.infants, 10) || 0) : 0;
  const occupation = sp.occupation ?? "";
  const { id } = await params;
  const visa = await getVisa(id);
  if (!visa) notFound();

  const hasPricing = visa.priceAdult !== null;
  const priceAdult = visa.priceAdult ?? 0;
  const priceChild = visa.priceChild ?? 0;
  const priceInfant = visa.priceInfant ?? 0;
  const totalPrice = priceAdult * adults + priceChild * children + priceInfant * infants;
  const waMsg = `Assalam o Alaikum! I'd like to apply for the ${visa.country} ${visa.type} visa (${visa.title}).`;
  const applyHref = `/visa/${visa.id}/apply?adults=${adults}&children=${children}&infants=${infants}${occupation ? `&occupation=${occupation}` : ""}`;

  return (
    <>
      <Navbar />

      {/* HERO — full-width with country image */}
      <section className="relative h-56 md:h-72 bg-[var(--lp-ink)] overflow-hidden">
        {visa.countryImage && (
          <Image src={visa.countryImage} alt={visa.country} fill className="object-cover opacity-30" />
        )}
        <div className="relative z-10 h-full flex flex-col items-center justify-end pb-8 px-6 text-white text-center">
          <p className="text-[var(--lp-brass)] text-xs font-bold uppercase tracking-widest mb-2">
            <Link href="/visa" className="hover:underline">Visa Services</Link>
            <span className="mx-1.5">/</span>{visa.country.toUpperCase()}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            {visa.countryFlag && <span className="mr-2">{visa.countryFlag}</span>}{visa.title}
          </h1>
          {visa.entryType && visa.processingTime && (
            <p className="text-white/60 text-sm mt-2">
              {visa.entryType.charAt(0).toUpperCase() + visa.entryType.slice(1)} Entry
              <span className="mx-2">·</span>
              Processing <span className="text-[var(--lp-brass)] font-semibold">{visa.processingTime}</span>
            </p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ── LEFT ── */}
        <div className="space-y-4">

          {/* Visa Details + Services — merged compact card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold mb-4 pb-3 border-b border-gray-100">Visa Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4 mb-4">
              {visa.validity     && <Fact label="Validity"         value={visa.validity} />}
              {visa.maxStay      && <Fact label="Max Stay"         value={visa.maxStay} />}
              {visa.processingTime && <Fact label="Processing"     value={visa.processingTime} />}
              {visa.days         && <Fact label="Duration"         value={visa.days} />}
              <Fact label="Type" value={visa.type.charAt(0).toUpperCase() + visa.type.slice(1)} />
              <Fact label="Country" value={visa.country} />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Services Included</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {["Professional Visa Guidance & Consultancy","Complete File Preparation","Application Submission & Tracking","Expert Document Review"].map(s => (
                  <li key={s} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-[9px]" style={{ background: "var(--gold-bg)", border: "1px solid var(--gold-bd)", color: "var(--lp-brass)" }}>✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Required Documents — filtered by occupation if known */}
          {visa.requiredDocuments.length > 0 && (() => {
            const filtered = occupation
              ? filterDocsForApplicant(visa.requiredDocuments, occupation, "")
              : visa.requiredDocuments.filter((d: { applicantCategory: string | null }) => !d.applicantCategory);
            const hasOccupationDocs = visa.requiredDocuments.some((d: { applicantCategory: string | null }) => d.applicantCategory);
            const occLabel = APPLICANT_CATEGORIES.find(c => c.value === occupation)?.label;
            return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="font-display text-xl font-semibold">Documents Required</h2>
                {occupation && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{occLabel ?? occupation.replace(/_/g, " ")}</span>}
              </div>
              {!occupation && hasOccupationDocs && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                  <span>⚠️</span>
                  <p className="text-xs text-amber-800">Documents vary by occupation. <strong>Select your occupation</strong> in the search bar above to see your exact requirements.</p>
                </div>
              )}
              <p className="text-sm text-gray-400 mb-4">Prepare all required documents before applying.</p>
              <div className="divide-y divide-gray-100">
                {filtered.map((doc: { id: string; name: string; description: string | null; isRequired: boolean; icon?: string | null; applicantCategory?: string | null }) => (
                  <div key={doc.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="text-base mt-0.5 flex-shrink-0">{doc.icon || (doc.isRequired ? "📄" : "📎")}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {doc.name}
                        {doc.isRequired
                          ? <span className="ml-2 text-xs text-red-500 font-bold">*required</span>
                          : <span className="ml-2 text-xs text-gray-400">(optional)</span>}
                      </p>
                      {doc.description && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{doc.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {!occupation && hasOccupationDocs && (
                <p className="text-xs text-gray-400 mt-3">* Additional occupation-specific documents will be shown after you select your occupation.</p>
              )}
            </div>
            );
          })()}

          {/* Legacy text requirements */}
          {visa.requirements && visa.requiredDocuments.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-3">Requirements</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{visa.requirements}</p>
            </div>
          )}

          {visa.termsAndConditions && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold mb-3">Terms &amp; Conditions</h2>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{visa.termsAndConditions}</p>
            </div>
          )}

          {visa.refundPolicy && (
            <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold mb-3">⚠️ Refund Policy</h2>
              <p className="text-xs text-amber-800 whitespace-pre-wrap leading-relaxed">{visa.refundPolicy}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT — Mosafir Fare Card ── */}
        <div className="sticky top-6">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">

            {/* Card header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: "var(--lp-ink)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-0.5">FARE DETAILS</p>
                <p className="text-xs font-semibold" style={{ color: "var(--lp-brass)" }}>Service charges included</p>
              </div>
              <span className="text-3xl">{visa.countryFlag ?? "🛂"}</span>
            </div>

            {/* Fare rows */}
            {hasPricing ? (
              <div className="bg-white divide-y divide-gray-100 px-6">
                {adults > 0 && <FareRow label="Adult Price" detail={`PKR ${priceAdult.toLocaleString()} × ${adults}`} amount={priceAdult * adults} />}
                {children > 0 && <FareRow label="Child Price" detail={`PKR ${priceChild.toLocaleString()} × ${children}`} amount={priceChild * children} />}
                {infants > 0 && <FareRow label="Infant Price" detail={`PKR ${priceInfant.toLocaleString()} × ${infants}`} amount={priceInfant * infants} />}
                <FareRow label="Service Charges" detail="" amount={0} isFree />
              </div>
            ) : visa.price ? (
              <div className="bg-white px-6 py-4">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Starting From</p>
                <p className="font-display text-2xl font-bold" style={{ color: "var(--lp-brass)" }}>{visa.price}</p>
              </div>
            ) : null}

            {/* Total + Apply Now */}
            <div className="px-6 py-5 flex items-center justify-between" style={{ background: "var(--lp-ink)" }}>
              <div>
                <p className="text-white/50 text-xs mb-1">Total</p>
                <p className="font-display text-3xl font-bold text-white leading-none">
                  PKR {totalPrice.toLocaleString()}
                </p>
                <p className="text-white/40 text-xs mt-1">{adults + children + infants} Person(s)</p>
              </div>
              <Link href={applyHref}
                className="font-bold text-sm px-5 py-3 rounded-xl transition-colors"
                style={{ background: "var(--lp-brass)", color: "#000" }}>
                Apply Now →
              </Link>
            </div>

            {/* Processing countdown */}
            {visa.processingTime && (() => {
              const nums = visa.processingTime.match(/\d+/g)?.map(Number) ?? [];
              if (!nums.length) return null;
              const days = Math.max(...nums);
              const date = new Date();
              let added = 0;
              while (added < days) { date.setDate(date.getDate() + 1); const d = date.getDay(); if (d !== 0 && d !== 6) added++; }
              const label = date.toLocaleDateString("en-PK", { day: "numeric", month: "long" });
              return (
                <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: "rgba(212,168,67,0.1)" }}>⏱</div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Estimated Ready By</p>
                    <p className="font-display text-base font-bold" style={{ color: "var(--lp-ink)" }}>{label}</p>
                    <p className="text-[10px] text-gray-400">Based on {visa.processingTime}</p>
                  </div>
                </div>
              );
            })()}

            {/* WhatsApp */}
            <div className="px-6 pb-5 pt-3 bg-white">
              <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "#25D366" }}>
                <span className="text-base">💬</span> Ask on WhatsApp
              </a>
            </div>

            {/* Per-person pricing breakdown */}
            {hasPricing && (
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Per Person (PKR)</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <MiniPrice label="ADULT" amount={priceAdult} />
                  <MiniPrice label="CHILD" amount={priceChild} />
                  <MiniPrice label="INFANT" amount={priceInfant} />
                </div>
                <p className="text-gray-400 text-[10px] mt-3 leading-relaxed">
                  * Per person. Total computed at submission based on traveler counts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className="font-semibold text-sm text-gray-800">{value}</p>
    </div>
  );
}

function FareRow({ label, detail, amount, isFree }: { label: string; detail: string; amount: number; isFree?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="font-semibold text-sm text-gray-800">{label}</p>
        {detail && <p className="text-xs text-gray-400 mt-0.5">{detail}</p>}
      </div>
      <span className="font-bold text-sm tabular-nums">
        {isFree ? <span className="text-green-600 font-bold">Included</span> : `PKR ${amount.toLocaleString()}`}
      </span>
    </div>
  );
}

function MiniPrice({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{label}</p>
      <p className="font-bold text-sm" style={{ color: "var(--lp-brass)" }}>
        {amount > 0 ? amount.toLocaleString() : "Free"}
      </p>
    </div>
  );
}
