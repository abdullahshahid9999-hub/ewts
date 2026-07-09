import Image from "next/image";
import Link from "next/link";
import PackageBookingWidget from "@/components/PackageBookingWidget";

type ItineraryStep = { title: string; details: string[]; images?: string[] };

type PackageWithRoomTypes = {
  id: string;
  category: string;
  name: string;
  duration: string | null;
  destination: string | null;
  departureCity: string | null;
  tier: string | null;
  hotels: string | null;
  includes: string | null;
  excludes: string | null;
  itinerary: unknown;
  imageUrl: string | null;
  roomTypes: {
    id: string;
    roomType: string;
    pricePerPersonPkr: number;
    pricePerInfantPkr: number;
    maxAdults: number;
    maxInfants: number;
    minAdultsRequired: number | null;
  }[];
};

function tierPillClass(tier: string) {
  const t = tier.toLowerCase();
  if (t === "gold") return "bg-gold text-black";
  if (t === "platinum") return "bg-[var(--navy)] text-white";
  if (t === "silver") return "bg-gray-200 text-gray-700";
  return "bg-gold/20 text-[var(--navy)]";
}

function parseList(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function parseItinerary(raw: unknown): ItineraryStep[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (step): step is ItineraryStep =>
      step && typeof step === "object" && typeof (step as ItineraryStep).title === "string"
  );
}

export default function PackageDetailView({ pkg }: { pkg: PackageWithRoomTypes }) {
  const includes = parseList(pkg.includes);
  const excludes = parseList(pkg.excludes);
  const itinerary = parseItinerary(pkg.itinerary);
  const backHref = pkg.category === "umrah" ? "/umrah" : "/tours";

  return (
    <>
      {/* HEADER */}
      <section className="bg-[var(--navy)] text-white px-6 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link href={backHref} className="hover:text-gold capitalize">{pkg.category}</Link>
            <span className="mx-2">/</span>
            <span>{pkg.name}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {pkg.tier && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tierPillClass(pkg.tier)}`}>
                {pkg.tier}
              </span>
            )}
            {pkg.duration && <span className="text-white/70 text-sm">{pkg.duration}</span>}
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-semibold mb-3">{pkg.name}</h1>
          {pkg.departureCity && (
            <p className="text-white/70 text-sm">Departing from {pkg.departureCity}</p>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* IMAGE */}
        <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-surface mb-12">
          {pkg.imageUrl ? (
            <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[#1a2b45] text-white/50 text-sm">
              {pkg.name}
            </div>
          )}
        </div>

        {/* DESCRIPTION: INCLUDED / NOT INCLUDED */}
        {(includes.length > 0 || excludes.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {includes.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">What&apos;s Included</h2>
                <ul className="space-y-2">
                  {includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {excludes.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">Not Included</h2>
                <ul className="space-y-2">
                  {excludes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ITINERARY */}
        {itinerary.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-xl font-semibold mb-6">Itinerary</h2>
            <div className="space-y-6">
              {itinerary.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gold text-black font-bold flex items-center justify-center text-sm shrink-0">
                      {i + 1}
                    </div>
                    {i < itinerary.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-6">
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    {step.details?.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {step.details.map((d, j) => (
                          <li key={j} className="text-muted text-sm">• {d}</li>
                        ))}
                      </ul>
                    )}
                    {step.images && step.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {step.images.map((src, k) => (
                          <div key={k} className="relative w-24 h-24 rounded-lg overflow-hidden bg-surface">
                            <Image src={src} alt={`${step.title} ${k + 1}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKING WIDGET */}
        <PackageBookingWidget packageId={pkg.id} roomTypes={pkg.roomTypes} packageName={pkg.name} />
      </div>
    </>
  );
}
