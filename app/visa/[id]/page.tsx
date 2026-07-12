import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import VisaApplyFlow from "./VisaApplyFlow";

export const revalidate = 60;

async function getVisa(id: string) {
  try {
    return await prisma.visaService.findUnique({
      where: { id, status: "active" },
      include: {
        requiredDocuments: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    });
  } catch {
    return null;
  }
}

export default async function VisaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visa = await getVisa(id);
  if (!visa) notFound();

  const hasPricing = visa.priceAdult !== null;
  const waMsg = `Assalam o Alaikum! I'd like to apply for the ${visa.country} ${visa.type} visa (${visa.title}).`;

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative bg-[var(--navy)] text-white overflow-hidden">
        {visa.countryImage && (
          <Image src={visa.countryImage} alt={visa.country} fill className="object-cover opacity-20" />
        )}
        <div className="relative z-10 text-center px-6 pt-16 pb-12">
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
            <Link href="/visa" className="hover:underline">Visa Services</Link> / {visa.country}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
            {visa.countryFlag && <span className="mr-3">{visa.countryFlag}</span>}
            {visa.title}
          </h1>
          <p className="text-white/60 capitalize">{visa.country} · {visa.type} visa</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT: Details + Requirements (read first) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick Facts */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold mb-5">Visa Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {visa.processingTime && <Fact label="Processing Time" value={visa.processingTime} />}
              {visa.validity && <Fact label="Validity" value={visa.validity} />}
              {visa.maxStay && <Fact label="Max Stay" value={visa.maxStay} />}
              {visa.days && <Fact label="Duration" value={visa.days} />}
              <Fact label="Visa Type" value={visa.type.charAt(0).toUpperCase() + visa.type.slice(1)} />
              <Fact label="Country" value={visa.country} />
            </div>
          </div>

          {/* Pricing */}
          {hasPricing && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-5">Pricing (PKR)</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <PriceCard label="Adult" amount={visa.priceAdult!} />
                <PriceCard label="Child" amount={visa.priceChild!} />
                <PriceCard label="Infant" amount={visa.priceInfant!} />
              </div>
              <p className="text-muted text-xs mt-4">
                * Per person. Total computed at submission based on traveler counts.
              </p>
            </div>
          )}

          {/* Required Documents — the "read first" section */}
          {visa.requiredDocuments.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-2">Required Documents</h2>
              <p className="text-muted text-sm mb-5">Please prepare all required documents before applying.</p>
              <div className="space-y-3">
                {visa.requiredDocuments.map((doc) => (
                  <div key={doc.id} className="flex gap-3 p-3 rounded-xl border border-border bg-surface">
                    <span className="text-lg mt-0.5">{doc.isRequired ? "📄" : "📎"}</span>
                    <div>
                      <div className="font-semibold text-sm">
                        {doc.name}
                        {!doc.isRequired && <span className="ml-2 text-xs text-muted font-normal">(optional)</span>}
                      </div>
                      {doc.description && (
                        <p className="text-muted text-xs mt-0.5">{doc.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy free-text requirements fallback */}
          {visa.requirements && visa.requiredDocuments.length === 0 && (
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Requirements</h2>
              <p className="text-sm text-muted whitespace-pre-wrap">{visa.requirements}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Sticky CTA + Apply Flow */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5 sticky top-6">
            {hasPricing ? (
              <>
                <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-1">Starting from</p>
                <p className="font-display text-3xl font-semibold text-gold mb-1">
                  PKR {(visa.priceAdult ?? 0).toLocaleString()}
                </p>
                <p className="text-muted text-xs mb-4">per adult</p>
              </>
            ) : visa.price ? (
              <>
                <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-1">Price</p>
                <p className="font-display text-3xl font-semibold text-gold mb-4">{visa.price}</p>
              </>
            ) : null}

            <VisaApplyFlow visa={{
              id: visa.id,
              title: visa.title,
              country: visa.country,
              type: visa.type,
              priceAdult: visa.priceAdult,
              priceChild: visa.priceChild,
              priceInfant: visa.priceInfant,
              requiredDocuments: visa.requiredDocuments.map((d) => ({
                id: d.id,
                name: d.name,
                description: d.description,
                isRequired: d.isRequired,
              })),
            }} />

            <div className="mt-4 pt-4 border-t border-border">
              <a
                href={waLink(waMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                <span>💬</span> Ask on WhatsApp
              </a>
            </div>
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

function PriceCard({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="bg-surface rounded-xl p-4">
      <p className="text-xs text-muted uppercase font-semibold mb-1">{label}</p>
      <p className="font-display text-xl font-semibold text-gold">
        {amount > 0 ? `PKR ${amount.toLocaleString()}` : "Free"}
      </p>
    </div>
  );
}
