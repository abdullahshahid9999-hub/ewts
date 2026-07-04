import Image from "next/image";
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
    });
  } catch {
    return [];
  }
}

export default async function VisaPage() {
  const visas = await getVisas();

  return (
    <>
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-6">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
          Visa Services
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
          Visa processing, <span className="italic text-gold">done right the first time.</span>
        </h1>
        <p className="text-muted max-w-2xl">
          Tourist, business, work and Umrah visas for dozens of countries.
          WhatsApp us with your destination for exact requirements.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        {visas.length === 0 ? (
          <p className="text-muted">
            No visa services are listed right now — WhatsApp us for details.
          </p>
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
                    <p className="text-sm mb-1">
                      <span className="font-semibold">Processing: </span>
                      {v.processingTime}
                    </p>
                  )}
                  {v.validity && (
                    <p className="text-sm mb-1">
                      <span className="font-semibold">Validity: </span>
                      {v.validity}
                    </p>
                  )}
                  {v.maxStay && (
                    <p className="text-sm mb-1">
                      <span className="font-semibold">Max stay: </span>
                      {v.maxStay}
                    </p>
                  )}
                  {v.requirements && (
                    <p className="text-muted text-xs mb-3 line-clamp-3">{v.requirements}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-display text-xl font-semibold text-gold">
                      {v.price ?? "Enquire"}
                    </span>
                    <a
                      href={waLink(`Assalam o Alaikum! I'd like details about the ${v.country} ${v.type} visa.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gold hover:underline"
                    >
                      Enquire →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
