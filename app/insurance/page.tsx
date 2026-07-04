import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getCompanies() {
  try {
    return await prisma.insuranceCompany.findMany({
      orderBy: { name: "asc" },
      include: {
        plans: {
          orderBy: { name: "asc" },
          include: {
            rates: { orderBy: { pricePkr: "asc" } },
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function InsurancePage() {
  const companies = await getCompanies();

  return (
    <>
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-6">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
          Travel Insurance
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
          Coverage for every <span className="italic text-gold">trip abroad.</span>
        </h1>
        <p className="text-muted max-w-2xl">
          Compare plans across our partner insurers, ordered from most
          affordable to most comprehensive.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 space-y-14">
        {companies.length === 0 ? (
          <p className="text-muted">
            No insurance plans are listed right now — WhatsApp us for details.
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
                <h2 className="font-display text-2xl font-semibold">{company.name}</h2>
              </div>
              {company.description && (
                <p className="text-muted text-sm mb-6 max-w-2xl">{company.description}</p>
              )}
              {company.plans.length === 0 ? (
                <p className="text-muted text-sm">No plans listed for this insurer yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {company.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-muted text-sm mb-3">{plan.description}</p>
                      )}
                      {plan.rates.length === 0 ? (
                        <p className="text-muted text-xs">Rates coming soon.</p>
                      ) : (
                        <ul className="space-y-2 mb-3">
                          {plan.rates.map((rate) => (
                            <li
                              key={rate.id}
                              className="flex items-center justify-between border-t border-border pt-2 first:border-t-0 first:pt-0"
                            >
                              <span className="text-muted text-sm">
                                {rate.coverageDetails ?? "Standard coverage"}
                              </span>
                              <span className="font-display font-semibold text-gold">
                                PKR {rate.pricePkr.toLocaleString()}
                              </span>
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
      <Footer />
    </>
  );
}
