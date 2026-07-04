import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 120;

async function getFlights() {
  try {
    return await prisma.groupFlight.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function GroupTicketsPage() {
  const flights = await getFlights();

  return (
    <>
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-6">
        <p className="text-gold font-semibold tracking-widest text-xs uppercase mb-3">
          Group Air Tickets
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
          Wholesale group fares, <span className="italic text-gold">updated in real time.</span>
        </h1>
        <p className="text-muted max-w-2xl">
          Seat counts reflect current availability. WhatsApp us to hold seats
          before they&apos;re gone.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        {flights.length === 0 ? (
          <p className="text-muted">
            No group flights are listed right now — WhatsApp us for current
            availability.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {flights.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow p-5 flex gap-4"
              >
                <div className="relative w-16 h-16 shrink-0 bg-surface rounded-lg overflow-hidden">
                  {f.airlineLogoUrl && (
                    <Image src={f.airlineLogoUrl} alt={f.airline} fill className="object-contain" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-lg">{f.airline}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        f.seats > 0 ? "bg-gold/10 text-gold" : "bg-muted/20 text-muted"
                      }`}
                    >
                      {f.seats > 0 ? `${f.seats} seats left` : "Sold out"}
                    </span>
                  </div>
                  <p className="text-muted text-sm mb-1">{f.route}</p>
                  <p className="text-muted text-sm mb-1">
                    {f.depDate} {f.depTime ? `· ${f.depTime}` : ""} {f.arrDate ? `→ ${f.arrDate}` : ""}
                  </p>
                  {f.baggage && <p className="text-muted text-xs mb-1">Baggage: {f.baggage}</p>}
                  {f.meal && <p className="text-muted text-xs mb-2">Meal: {f.meal}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-display text-xl font-semibold text-gold">{f.price}</span>
                    <a
                      href={waLink(`Assalam o Alaikum! I'm interested in the ${f.airline} group flight on route ${f.route}.`)}
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
