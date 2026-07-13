import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getVisas() {
  try {
    return await prisma.visaService.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, country: true, type: true,
        price: true, priceAdult: true,
        validity: true, maxStay: true, processingTime: true,
        requirements: true, countryFlag: true, countryImage: true,
      },
    });
  } catch {
    return [];
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

export default async function VisaPage() {
  const visas = await getVisas();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-10">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">
          Visa Services
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Visa Assistance <span className="italic text-gold">Made Easy</span>
        </h1>
        <p className="text-white/70 max-w-xl mx-auto mb-4">
          95% approval rate — we handle all paperwork for you
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <p className="text-white/50">
            <Link href="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <span>Visa Services</span>
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="font-display text-3xl font-semibold text-gold">{s.value}</p>
            <p className="text-muted text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </section>

      {/* FILTER TABS — cosmetic, mirrors VisaService.type values */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap gap-2 justify-center mb-10 text-sm">
          <span className="rounded-full bg-gold text-black font-semibold px-4 py-1.5">All Visas</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">Tourist</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">Umrah</span>
          <span className="rounded-full border border-border px-4 py-1.5 text-muted">Business</span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        {visas.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white border border-border rounded-2xl p-10">
            <p className="text-4xl mb-4">🛂</p>
            <h3 className="font-display text-xl font-semibold mb-2">No Visa Services Listed</h3>
            <p className="text-muted text-sm mb-6">
              Tell us your destination and we&apos;ll confirm requirements and pricing directly.
            </p>
            <a
              href={waLink("Assalam o Alaikum! I'd like details about visa services.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              Ask on WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visas.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative h-36 bg-surface">
                  {v.countryImage && (
                    <Image src={v.countryImage} alt={v.country} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {v.countryFlag && <span className="text-xl">{v.countryFlag}</span>}
                    <h3 className="font-semibold text-lg">{v.title}</h3>
                  </div>
                  <p className="text-muted text-sm mb-2 capitalize">
                    {v.country} · {v.type} visa
                  </p>
                  {v.processingTime && (
                    <p className="text-sm mb-1"><span className="font-semibold">Processing: </span>{v.processingTime}</p>
                  )}
                  {v.validity && (
                    <p className="text-sm mb-1"><span className="font-semibold">Validity: </span>{v.validity}</p>
                  )}
                  {v.maxStay && (
                    <p className="text-sm mb-1"><span className="font-semibold">Max stay: </span>{v.maxStay}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="font-display text-xl font-semibold text-gold">
                      {v.priceAdult != null ? `PKR ${v.priceAdult.toLocaleString()}` : (v.price ?? "Enquire")}
                    </span>
                    <Link
                      href={`/visa/${v.id}`}
                      className="text-sm font-bold bg-gold text-black px-4 py-1.5 rounded-lg hover:bg-gold-light transition-colors"
                    >
                      View &amp; Apply
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[var(--surface)] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3 text-center">Process</p>
          <h2 className="font-display text-3xl font-semibold mb-12 text-center">
            How It <span className="italic text-gold">Works</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gold text-black font-bold flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-muted text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
