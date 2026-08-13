import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 60;

async function getVisa(id: string) {
  try {
    return await prisma.visaService.findUnique({
      where: { id, status: "active" },
      include: {
        requiredDocuments: { orderBy: [{ sortOrder: "asc" }] },
      },
    });
  } catch {
    return null;
  }
}

export default async function VisaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ adults?: string; children?: string; infants?: string }> }) {
  const sp = await searchParams;
  const adults = sp.adults ? Math.max(1, parseInt(sp.adults, 10) || 1) : 1;
  const children = sp.children ? Math.max(0, parseInt(sp.children, 10) || 0) : 0;
  const infants = sp.infants ? Math.max(0, parseInt(sp.infants, 10) || 0) : 0;
  const { id } = await params;
  const visa = await getVisa(id);
  if (!visa) notFound();

  const hasPricing = visa.priceAdult !== null;
  const priceAdult = visa.priceAdult ?? 0;
  const priceChild = visa.priceChild ?? 0;
  const priceInfant = visa.priceInfant ?? 0;
  const totalPrice = priceAdult * adults + priceChild * children + priceInfant * infants;
  const waMsg = `Assalam o Alaikum! I'd like to apply for the ${visa.country} ${visa.type} visa (${visa.title}).`;

  const applyHref = `/visa/${visa.id}/apply?adults=${adults}&children=${children}&infants=${infants}`;

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative bg-[var(--lp-ink)] text-white overflow-hidden">
        {visa.countryImage && (
          <Image src={visa.countryImage} alt={visa.country} fill className="object-cover opacity-20" />
        )}
        <div className="relative z-10 text-center px-6 pt-14 pb-10">
          <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-3">
            <Link href="/visa" className="hover:underline">Visa Services</Link> / {visa.country}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-3">
            {visa.countryFlag && <span className="mr-3">{visa.countryFlag}</span>}
            {visa.title}
          </h1>
          {visa.entryType && visa.processingTime && (
            <p className="text-white/60 text-sm">
              {visa.entryType.charAt(0).toUpperCase() + visa.entryType.slice(1)} Entry
              <span className="mx-2">·</span>
              Processing <span className="text-[var(--lp-brass)] font-semibold">{visa.processingTime}</span>
            </p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT — Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Facts */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold mb-5">Visa Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {visa.processingTime && <Fact label="Processing Time" value={visa.processingTime} />}
              {visa.validity && <Fact label="Validity" value={visa.validity} />}
              {visa.maxStay && <Fact label="Max Stay" value={visa.maxStay} />}
              {visa.days && <Fact label="Duration" value={visa.days} />}
              <Fact label="Visa Type" value={visa.type.charAt(0).toUpperCase() + visa.type.slice(1)} />
              <Fact label="Country" value={visa.country} />
            </div>
          </div>

          {/* Services provided — show as bullet list */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold mb-4">Services Included</h2>
            <ul className="space-y-2">
              {["Professional Visa Guidance and Consultancy", "Complete File Preparation", "Application Submission & Tracking", "Expert Document Review"].map(s => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[var(--gold-bg)] border border-[var(--gold-bd)] text-[var(--lp-brass)] flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Required Documents */}
          {visa.requiredDocuments.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-2">Documents Required</h2>
              <p className="text-muted text-sm mb-5">Please prepare all required documents before applying.</p>
              <div className="space-y-3">
                {visa.requiredDocuments.map((doc: { id: string; name: string; description: string | null; isRequired: boolean; icon?: string | null }) => (
                  <div key={doc.id} className="flex gap-3 p-3 rounded-xl border border-border bg-surface">
                    <span className="text-lg mt-0.5">{(doc as { icon?: string | null }).icon || (doc.isRequired ? "📄" : "📎")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {doc.name}
                        {doc.isRequired ? <span className="ml-2 text-xs text-red-500 font-bold">*required</span> : <span className="ml-2 text-xs text-muted">(optional)</span>}
                      </p>
                      {doc.description && <p className="text-xs text-muted mt-0.5">{doc.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy requirements */}
          {visa.requirements && visa.requiredDocuments.length === 0 && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Requirements</h2>
              <p className="text-sm text-muted whitespace-pre-wrap">{visa.requirements}</p>
            </div>
          )}

          {/* Terms */}
          {visa.termsAndConditions && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Terms &amp; Conditions</h2>
              <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed">{visa.termsAndConditions}</p>
            </div>
          )}

          {/* Refund */}
          {visa.refundPolicy && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-4">⚠️ Refund &amp; Cancellation Policy</h2>
              <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">{visa.refundPolicy}</p>
            </div>
          )}
        </div>

        {/* RIGHT — Mosafir-style Fare Card */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl overflow-hidden sticky top-6 shadow-md">

            {/* Header */}
            <div className="bg-[var(--lp-ink)] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 uppercase tracking-widest font-semibold mb-0.5">Fare Details</p>
                <p className="text-xs text-[var(--lp-brass)] font-semibold">Service charges included</p>
              </div>
              <span className="text-2xl">{visa.countryFlag ?? "🛂"}</span>
            </div>

            {/* Pricing breakdown — Mosafir style */}
            {hasPricing ? (
              <div className="p-5 space-y-0 divide-y divide-border">
                {adults > 0 && (
                  <FareRow
                    label="Adult Price"
                    detail={`PKR ${priceAdult.toLocaleString()} × ${adults}`}
                    amount={priceAdult * adults}
                  />
                )}
                {children > 0 && (
                  <FareRow
                    label="Child Price"
                    detail={`PKR ${priceChild.toLocaleString()} × ${children}`}
                    amount={priceChild * children}
                  />
                )}
                {infants > 0 && (
                  <FareRow
                    label="Infant Price"
                    detail={`PKR ${priceInfant.toLocaleString()} × ${infants}`}
                    amount={priceInfant * infants}
                  />
                )}
                <FareRow label="Service Charges" detail="" amount={0} isFree />
              </div>
            ) : visa.price ? (
              <div className="p-5">
                <p className="text-xs text-muted uppercase font-semibold mb-1">Price</p>
                <p className="font-display text-2xl font-semibold text-[var(--lp-brass)]">{visa.price}</p>
              </div>
            ) : null}

            {/* Total bar */}
            {hasPricing && (
              <div className="bg-[var(--lp-ink)] text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-0.5">Total</p>
                  <p className="font-display text-2xl font-bold">PKR {totalPrice.toLocaleString()}</p>
                  <p className="text-xs text-white/50">{adults + children + infants} Person(s)</p>
                </div>
                <Link
                  href={applyHref}
                  className="bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Apply Now →
                </Link>
              </div>
            )}

            {!hasPricing && (
              <div className="px-5 pb-5">
                <Link href={applyHref}
                  className="block w-full text-center bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold py-3 rounded-xl text-sm transition-colors">
                  Apply Now →
                </Link>
              </div>
            )}

            {/* WhatsApp */}
            <div className="px-5 pb-5">
              <a
                href={waLink(waMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                <span>💬</span> Ask on WhatsApp
              </a>
            </div>

            {/* Pricing tiers */}
            {hasPricing && (
              <div className="border-t border-border px-5 py-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Per Person (PKR)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniPrice label="Adult" amount={priceAdult} />
                  <MiniPrice label="Child" amount={priceChild} />
                  <MiniPrice label="Infant" amount={priceInfant} />
                </div>
                <p className="text-muted text-[10px] mt-3 leading-relaxed">
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
      <p className="text-xs text-muted uppercase tracking-wide font-semibold mb-0.5">{label}</p>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  );
}

function FareRow({ label, detail, amount, isFree }: { label: string; detail: string; amount: number; isFree?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {detail && <p className="text-xs text-muted">{detail}</p>}
      </div>
      <span className="font-semibold text-sm tabular-nums">
        {isFree ? <span className="text-green-600 font-bold">Included</span> : `PKR ${amount.toLocaleString()}`}
      </span>
    </div>
  );
}

function MiniPrice({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="bg-surface rounded-lg p-2">
      <p className="text-[10px] text-muted uppercase font-semibold mb-0.5">{label}</p>
      <p className="font-semibold text-xs text-[var(--lp-brass)]">
        {amount > 0 ? `${amount.toLocaleString()}` : "Free"}
      </p>
    </div>
  );
}
