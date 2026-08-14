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

function seatsDisplay(pkg: UmrahCardV2Package) {
  if (!pkg.totalSeats) return null;
  const remaining = pkg.totalSeats - pkg.seatsBooked;
  return { remaining: Math.max(0, remaining), total: pkg.totalSeats };
}

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
  const seats = seatsDisplay(pkg);
  const href = detailHref
    ? isAgent
      ? detailHref
      : `${detailHref}${paxQS ? `?${paxQS}` : ""}`
    : null;

  const lowestPrice = pkg.roomTypes.length
    ? Math.min(...pkg.roomTypes.map((r) => r.pricePerPersonPkr))
    : null;
  const displayPrice = lowestPrice
    ? `PKR ${lowestPrice.toLocaleString("en-PK")}`
    : pkg.price;

  const includesList = pkg.includes
    ? pkg.includes
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        {/* Category badge */}
        <span className="text-[10px] font-bold tracking-wider uppercase bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">
          Umrah Package
        </span>
        {/* Seats remaining badge */}
        {seats && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
            🎟️ {seats.remaining} / {seats.total} Seats Remaining
          </span>
        )}
        {pkg.tier && !seats && (
          <span className="text-[10px] font-bold tracking-wider uppercase bg-[var(--lp-brass)]/10 text-[var(--lp-brass)] px-2.5 py-1 rounded-full">
            {pkg.tier}
          </span>
        )}
      </div>

      {/* ── TITLE ── */}
      <div className="px-5 pt-2 pb-3 border-b border-border/50">
        <h3 className="font-display text-[22px] font-bold uppercase tracking-tight text-[var(--lp-ink)] leading-tight">
          {pkg.name}
        </h3>
        {includesList && (
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mt-0.5 line-clamp-1">
            {includesList}
          </p>
        )}
      </div>

      {/* ── DETAIL PILLS ROW ── */}
      <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Duration */}
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-0.5">Duration</p>
          <p className="font-bold text-sm text-[var(--lp-ink)]">{pkg.duration ?? "—"}</p>
        </div>
        {/* Makkah Hotel */}
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-0.5">Makkah Hotel</p>
          <p className="font-bold text-xs text-[var(--lp-ink)] uppercase leading-tight line-clamp-2">
            {pkg.makkahHotel ?? pkg.airline ?? "—"}
          </p>
          {pkg.makkahHotelDistance && (
            <p className="text-[9px] text-green-600 font-semibold mt-0.5">({pkg.makkahHotelDistance})</p>
          )}
        </div>
        {/* Madinah Hotel */}
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-0.5">Madinah Hotel</p>
          <p className="font-bold text-xs text-[var(--lp-ink)] uppercase leading-tight line-clamp-2">
            {pkg.madinahHotel ?? "—"}
          </p>
          {pkg.madinahHotelDistance && (
            <p className="text-[9px] text-green-600 font-semibold mt-0.5">({pkg.madinahHotelDistance})</p>
          )}
        </div>
        {/* Airline */}
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-0.5">Airline Partner</p>
          <p className="font-bold text-xs text-[var(--lp-ink)] uppercase">{pkg.airline ?? "—"}</p>
          {pkg.route && (
            <p className="text-[9px] text-[var(--lp-brass)] font-bold mt-0.5">{pkg.route}</p>
          )}
        </div>
      </div>

      {/* ── HOTEL PHOTO CARDS ── */}
      {(pkg.makkahHotelImg || pkg.madinahHotelImg) && (
        <div className="px-5 pb-3 grid grid-cols-2 gap-3">
          {/* Makkah */}
          <div className="rounded-xl overflow-hidden border border-border/50 relative">
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                🏨 Makkah Hotel
              </span>
              {pkg.makkahHotelDistance && (
                <span className="text-[9px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  📍 {pkg.makkahHotelDistance}
                </span>
              )}
            </div>
            <div className="px-2.5 pb-1">
              <p className="font-bold text-sm uppercase">{pkg.makkahHotel ?? "—"}</p>
              <p className="text-[10px] text-muted">Accommodation near Al-Masjid Al-Haram</p>
            </div>
            {pkg.makkahHotelImg && (
              <div className="relative h-28 mx-2.5 mb-2.5 rounded-lg overflow-hidden">
                <Image src={pkg.makkahHotelImg} alt={pkg.makkahHotel ?? "Makkah Hotel"} fill className="object-cover" />
              </div>
            )}
          </div>
          {/* Madinah */}
          <div className="rounded-xl overflow-hidden border border-border/50">
            <div className="flex items-center gap-1.5 px-2.5 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                🕌 Madinah Hotel
              </span>
              {pkg.madinahHotelDistance && (
                <span className="text-[9px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  📍 {pkg.madinahHotelDistance}
                </span>
              )}
            </div>
            <div className="px-2.5 pb-1">
              <p className="font-bold text-sm uppercase">{pkg.madinahHotel ?? "—"}</p>
              <p className="text-[10px] text-muted">Peaceful stay near Al-Masjid An-Nabawi</p>
            </div>
            {pkg.madinahHotelImg && (
              <div className="relative h-28 mx-2.5 mb-2.5 rounded-lg overflow-hidden">
                <Image src={pkg.madinahHotelImg} alt={pkg.madinahHotel ?? "Madinah Hotel"} fill className="object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SPECS BLOCK ── */}
      <div className="mx-5 mb-4 rounded-xl border border-border/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-border/50">
          <span className="font-bold text-xs uppercase tracking-wide">What&apos;s Included &amp; Specifications</span>
          {pkg.airline && (
            <span className="text-xs font-bold text-[var(--lp-brass)]">{pkg.airline}</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-3 text-xs">
          {pkg.airline && (
            <div className="flex items-center gap-2">
              <span>✈️</span>
              <span className="text-muted">Airline:</span>
              <span className="font-bold">{pkg.airline}</span>
            </div>
          )}
          {pkg.flightType && (
            <div className="flex items-center gap-2">
              <span>🔀</span>
              <span className="text-muted">Flight Type:</span>
              <span className="font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px]">
                ✈ {pkg.flightType}
              </span>
            </div>
          )}
          {pkg.route && (
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="text-muted">Route:</span>
              <span className="font-bold">{pkg.route}</span>
            </div>
          )}
          {pkg.luggage && (
            <div className="flex items-center gap-2">
              <span>🧳</span>
              <span className="text-muted">Luggage:</span>
              <span className="font-bold">{pkg.luggage}</span>
            </div>
          )}
          {pkg.transportType && (
            <div className="flex items-center gap-2">
              <span>🚌</span>
              <span className="text-muted">Transport:</span>
              <span className="font-bold">{pkg.transportType}</span>
            </div>
          )}
          {pkg.makkahHotel && (
            <div className="flex items-start gap-2 sm:col-span-1">
              <span>🏨</span>
              <span className="text-muted">Makkah Hotel:</span>
              <span className="font-bold">
                {pkg.makkahHotel}
                {pkg.makkahHotelNights && ` (${pkg.makkahHotelNights} Nights`}
                {pkg.makkahHotelDistance && ` • ${pkg.makkahHotelDistance}`}
                {pkg.makkahHotelNights && ")"}
              </span>
            </div>
          )}
          {pkg.madinahHotel && (
            <div className="flex items-start gap-2 sm:col-span-1">
              <span>🕌</span>
              <span className="text-muted">Madinah Hotel:</span>
              <span className="font-bold">
                {pkg.madinahHotel}
                {pkg.madinahHotelNights && ` (${pkg.madinahHotelNights} Nights`}
                {pkg.madinahHotelDistance && ` • ${pkg.madinahHotelDistance}`}
                {pkg.madinahHotelNights && ")"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span className="text-muted font-medium">Saudi Tourist / Umrah Visa Processing</span>
          </div>
        </div>
      </div>

      {/* ── PRICE + CTA ── */}
      <div className="px-5 pb-5 pt-1 border-t border-border/50 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">Starting From</p>
          <span className="font-display text-2xl font-bold text-[var(--lp-brass)]">{displayPrice ?? "—"}</span>
          {displayPrice && !displayPrice.includes("PKR") && !displayPrice.includes("Rs") && (
            <span className="text-muted text-xs ml-1">PKR</span>
          )}
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-xs font-bold text-white bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] px-5 py-3 rounded-xl transition-colors"
          >
            View Details &amp; Reserve →
          </Link>
        ) : (
          <a
            href={waLink(`Assalam o Alaikum! I'm interested in "${pkg.name}". Please share details.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-5 py-3 rounded-xl transition-colors"
          >
            📲 Book Now
          </a>
        )}
      </div>
    </div>
  );
}
