import { waLink } from "@/lib/whatsapp";
import Image from "next/image";
import Link from "next/link";

export type UmrahCardV2Package = {
  id: string;
  name: string;
  slug: string | null;
  includes: string | null;
  duration: string | null;
  airline: string | null;
  route: string | null;
  flightType: string | null;
  luggage: string | null;
  transportType: string | null;
  totalSeats: number | null;
  seatsBooked: number;
  makkahHotel: string | null;
  makkahHotelDistance: string | null;
  makkahHotelNights: number | null;
  makkahHotelImg: string | null;
  madinahHotel: string | null;
  madinahHotelDistance: string | null;
  madinahHotelNights: number | null;
  madinahHotelImg: string | null;
  price: string | null;
  tier: string | null;
  roomTypes: { pricePerPersonPkr: number; availableSlots: number | null }[];
};

export default function UmrahCardV2({
  pkg,
  detailHref,
  paxQS,
  isAgent = false,
}: {
  pkg: UmrahCardV2Package;
  detailHref: string | null;
  paxQS?: string;
  isAgent?: boolean;
}) {
  const remaining = pkg.totalSeats != null ? Math.max(0, pkg.totalSeats - pkg.seatsBooked) : null;

  const href = detailHref
    ? isAgent
      ? detailHref
      : `${detailHref}${paxQS ? `?${paxQS}` : ""}`
    : null;

  const lowestPrice = pkg.roomTypes.length
    ? Math.min(...pkg.roomTypes.map((r) => r.pricePerPersonPkr))
    : null;

  const displayPrice = lowestPrice != null
    ? lowestPrice.toLocaleString("en-PK")
    : pkg.price ?? null;

  // Specs rows — only render if value exists
  const specs: { icon: string; label: string; value: string }[] = [
    pkg.airline      && { icon: "✈️", label: "Airline",    value: pkg.airline },
    pkg.flightType   && { icon: "🔀", label: "Flight",     value: pkg.flightType },
    pkg.route        && { icon: "📍", label: "Route",      value: pkg.route },
    pkg.luggage      && { icon: "🧳", label: "Luggage",    value: pkg.luggage },
    pkg.transportType && { icon: "🚌", label: "Transport", value: pkg.transportType },
    pkg.makkahHotel  && {
      icon: "🏨", label: "Makkah",
      value: [pkg.makkahHotel, pkg.makkahHotelNights && `${pkg.makkahHotelNights}N`, pkg.makkahHotelDistance].filter(Boolean).join(" • "),
    },
    pkg.madinahHotel && {
      icon: "🕌", label: "Madinah",
      value: [pkg.madinahHotel, pkg.madinahHotelNights && `${pkg.madinahHotelNights}N`, pkg.madinahHotelDistance].filter(Boolean).join(" • "),
    },
    { icon: "📋", label: "Visa", value: "Saudi Tourist / Umrah Visa" },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <div className="bg-white border border-[var(--lp-border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">

      {/* ── HEADER BAR ── */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[var(--lp-border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-widest uppercase bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">
            Umrah Package
          </span>
          {pkg.tier && (
            <span className="text-[10px] font-bold tracking-widest uppercase bg-[var(--lp-brass)]/10 text-[var(--lp-brass)] px-2.5 py-1 rounded-full">
              {pkg.tier}
            </span>
          )}
          {pkg.duration && (
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              ⏱ {pkg.duration}
            </span>
          )}
        </div>
        {remaining != null && pkg.totalSeats && (
          <span className={`shrink-0 text-[11px] font-bold px-3 py-1 rounded-full border ${
            remaining <= 3
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}>
            🎟 {remaining}/{pkg.totalSeats} seats left
          </span>
        )}
      </div>

      {/* ── PACKAGE NAME ── */}
      <div className="px-5 pt-3 pb-2">
        <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[var(--lp-ink)] leading-snug">
          {pkg.name}
        </h3>
        {pkg.airline && pkg.route && (
          <p className="text-xs text-[var(--lp-muted)] mt-0.5 font-medium">
            {pkg.airline} · {pkg.route}
          </p>
        )}
      </div>

      {/* ── HOTEL PHOTO CARDS ── */}
      {(pkg.makkahHotelImg || pkg.madinahHotelImg) && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-3">
          {/* Makkah */}
          <div className="rounded-xl overflow-hidden border border-[var(--lp-border)]">
            {pkg.makkahHotelImg ? (
              <div className="relative h-32 w-full">
                <Image
                  src={pkg.makkahHotelImg}
                  alt={pkg.makkahHotel ?? "Makkah Hotel"}
                  fill
                  className="object-cover"
                />
                {/* Overlay label */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                  <p className="text-white text-[10px] font-bold uppercase leading-tight line-clamp-1">
                    {pkg.makkahHotel ?? "Makkah Hotel"}
                  </p>
                  {pkg.makkahHotelDistance && (
                    <p className="text-white/80 text-[9px]">📍 {pkg.makkahHotelDistance}</p>
                  )}
                </div>
                <span className="absolute top-2 left-2 text-[9px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Makkah {pkg.makkahHotelNights ? `· ${pkg.makkahHotelNights}N` : ""}
                </span>
              </div>
            ) : (
              <div className="bg-orange-50 px-3 py-3">
                <span className="text-[9px] font-bold uppercase text-orange-600 block mb-1">🏨 Makkah</span>
                <p className="font-bold text-xs text-[var(--lp-ink)] uppercase leading-tight">{pkg.makkahHotel}</p>
                {pkg.makkahHotelDistance && <p className="text-[9px] text-green-700 mt-0.5">📍 {pkg.makkahHotelDistance}</p>}
              </div>
            )}
          </div>
          {/* Madinah */}
          <div className="rounded-xl overflow-hidden border border-[var(--lp-border)]">
            {pkg.madinahHotelImg ? (
              <div className="relative h-32 w-full">
                <Image
                  src={pkg.madinahHotelImg}
                  alt={pkg.madinahHotel ?? "Madinah Hotel"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                  <p className="text-white text-[10px] font-bold uppercase leading-tight line-clamp-1">
                    {pkg.madinahHotel ?? "Madinah Hotel"}
                  </p>
                  {pkg.madinahHotelDistance && (
                    <p className="text-white/80 text-[9px]">📍 {pkg.madinahHotelDistance}</p>
                  )}
                </div>
                <span className="absolute top-2 left-2 text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Madinah {pkg.madinahHotelNights ? `· ${pkg.madinahHotelNights}N` : ""}
                </span>
              </div>
            ) : (
              <div className="bg-blue-50 px-3 py-3">
                <span className="text-[9px] font-bold uppercase text-blue-600 block mb-1">🕌 Madinah</span>
                <p className="font-bold text-xs text-[var(--lp-ink)] uppercase leading-tight">{pkg.madinahHotel}</p>
                {pkg.madinahHotelDistance && <p className="text-[9px] text-green-700 mt-0.5">📍 {pkg.madinahHotelDistance}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SPECS ── */}
      <div className="mx-5 mb-4 rounded-xl border border-[var(--lp-border)] overflow-hidden">
        <div className="bg-[var(--lp-ink)] px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">What&apos;s Included</span>
        </div>
        <div className="divide-y divide-[var(--lp-border)]">
          {specs.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2 px-4 py-2">
              <span className="text-sm shrink-0 w-5">{s.icon}</span>
              <span className="text-[10px] font-semibold text-[var(--lp-muted)] uppercase tracking-wide w-16 shrink-0">{s.label}</span>
              <span className="text-xs font-semibold text-[var(--lp-ink)] leading-snug">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICE + CTA ── */}
      <div className="px-5 pb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--lp-muted)] font-semibold mb-0.5">Starting From</p>
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] font-bold text-[var(--lp-muted)]">PKR</span>
            <span className="font-display text-2xl font-bold text-[var(--lp-brass)]">
              {displayPrice ?? "—"}
            </span>
          </div>
          <p className="text-[9px] text-[var(--lp-muted)]">per person</p>
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-xs font-bold text-white bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] px-5 py-3 rounded-xl transition-colors text-center"
          >
            View Details →
          </Link>
        ) : (
          <a
            href={waLink(`Assalam o Alaikum! I'm interested in "${pkg.name}". Please share details.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-5 py-3 rounded-xl transition-colors"
          >
            📲 Enquire
          </a>
        )}
      </div>
    </div>
  );
}
