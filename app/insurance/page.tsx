import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";
import InsuranceCalculator from "@/components/InsuranceCalculator";
import SearchResultsNotice from "@/components/SearchResultsNotice";

export const revalidate = 120;

async function getCompanies(q?: string) {
  try {
    return await prisma.insuranceCompany.findMany({
      where: q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { plans: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      } : undefined,
      orderBy: { name: "asc" },
      include: {
        plans: {
          orderBy: { name: "asc" },
          include: { rates: { orderBy: { pricePkr: "asc" } } },
        },
      },
    });
  } catch {
    return [];
  }
}

const BADGES = ["All Destinations", "Trusted Coverage", "Buy on WhatsApp", "Instant Quote"];

export default async function InsurancePage({ searchParams }: { searchParams: Promise<{ q?: string; travellers?: string }> }) {
  const { q, travellers } = await searchParams;
  const companies = await getCompanies(q);

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section id="calcSection" className="bg-[var(--navy)] text-white text-center px-6 pt-16 pb-10">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-4">Travel Insurance</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          Travel with <span className="italic text-gold">Complete Peace of Mind</span>
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto mb-6">
          Compare insurance plans for Umrah, Hajj, Europe, USA and worldwide travel. Get your
          quote in seconds — purchase via WhatsApp in minutes.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          {BADGES.map((b) => (
            <span key={b} className="rounded-full border border-white/20 px-3 py-1">{b}</span>
          ))}
        </div>
        <p className="text-white/50 text-sm mt-6">
          <Link href="/" className="hover:text-gold">Home</Link>
          <span className="mx-2">/</span>
          <span>Travel Insurance</span>
        </p>
      </section>

      {/* QUOTE CALCULATOR */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <InsuranceCalculator initialDestination={q} initialTravellers={travellers} />
      </section>

      {/* AVAILABLE PLANS */}
      <section className="max-w-6xl mx-auto px-6 pb-16 space-y-14">
        <h2 className="font-display text-2xl font-semibold text-center mb-2">
          Available <span className="italic text-gold">Plans</span>
        </h2>
        <p className="text-muted text-xs text-center max-w-xl mx-auto -mt-8 mb-8">
          Prices are estimates. Final premium confirmed on WhatsApp. Coverage terms apply.
          East &amp; West Travel Services acts as an agent.
        </p>

        <SearchResultsNotice q={q} basePath="/insurance" />
        {companies.length === 0 ? (
          <p className="text-muted text-center">
            {q ? `No insurer or plan matches "${q}" — WhatsApp us for details.` : "No insurance plans are listed right now — WhatsApp us for details."}
          </p>
        ) : (
          companies.map((company) => (
            <div key={company.id}>
              <div className="flex items-center gap-3 mb-6">
                {company.logoUrl && (
                  <div className="relative w-10 h-10 bg-surface rounded-lg overflow-hidden shrink-0">
                    <Image src={company.logoUrl} alt={company.name} fill className="object-contain" />
                  </div>
                )}
                <h3 className="font-display text-2xl font-semibold">{company.name}</h3>
              </div>
              {company.description && (
                <p className="text-muted text-sm mb-6 max-w-2xl">{company.description}</p>
              )}
              {company.plans.length === 0 ? (
                <p className="text-muted text-sm">No plans listed for this insurer yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {company.plans.map((plan) => (
                    <div key={plan.id} className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold text-lg mb-1">{plan.name}</h4>
                      {plan.description && <p className="text-muted text-sm mb-3">{plan.description}</p>}
                      {plan.rates.length === 0 ? (
                        <p className="text-muted text-xs">Rates coming soon.</p>
                      ) : (
                        <ul className="space-y-2 mb-3">
                          {plan.rates.map((rate) => (
                            <li key={rate.id} className="flex items-center justify-between border-t border-border pt-2 first:border-t-0 first:pt-0">
                              <span className="text-muted text-sm">{rate.coverageDetails ?? "Standard coverage"}</span>
                              <span className="font-display font-semibold text-gold">PKR {rate.pricePkr.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <a
                        href={waLink(`Assalam o Alaikum! I'd like details about the ${company.name} - ${plan.name} insurance plan.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gold hover:underline"
                      >
                        Enquire →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>

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
