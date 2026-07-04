import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getPackages() {
  try {
    return await prisma.package.findMany({
      where: { category: "tours", status: "active" },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function ToursPage() {
  const packages = await getPackages();

  return (
    <>
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-6">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
          Tours
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
          Curated tours, <span className="italic text-gold">wherever you want to go.</span>
        </h1>
        <p className="text-muted max-w-2xl">
          Domestic and international tour packages — flights, hotels and
          sightseeing bundled together. WhatsApp us for the latest
          availability and pricing.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        {packages.length === 0 ? (
          <p className="text-muted">
            No tour packages are listed right now — WhatsApp us for current
            availability.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative h-44 bg-surface">
                  {pkg.imageUrl && (
                    <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg mb-1">{pkg.name}</h3>
                  <p className="text-muted text-sm mb-2">
                    {pkg.duration} {pkg.destination ? `· ${pkg.destination}` : ""}
                  </p>
                  {pkg.hotels && (
                    <p className="text-muted text-sm mb-2">Hotels: {pkg.hotels}</p>
                  )}
                  {pkg.includes && (
                    <p className="text-sm mb-3">
                      <span className="font-semibold">Includes: </span>
                      {pkg.includes}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-display text-xl font-semibold text-gold">
                      {pkg.price}
                      {pkg.priceNote && (
                        <span className="text-muted text-xs font-sans font-normal ml-1">
                          {pkg.priceNote}
                        </span>
                      )}
                    </span>
                    <a
                      href={waLink(`Assalam o Alaikum! I'm interested in the "${pkg.name}" tour package.`)}
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
