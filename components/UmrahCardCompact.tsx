"use client";

import Image from "next/image";
import Link from "next/link";
import { waLink } from "@/lib/whatsapp";
import type { UmrahCardV2Package } from "./UmrahCardV2";

export default function UmrahCardCompact({
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
  const href = detailHref
    ? isAgent
      ? detailHref
      : `${detailHref}${paxQS ? `?${paxQS}` : ""}`
    : null;

  // Prices sorted low → high
  const sortedPrices = pkg.roomTypes
    .slice()
    .sort((a, b) => a.pricePerPersonPkr - b.pricePerPersonPkr);

  const lowestPrice = sortedPrices.length ? sortedPrices[0].pricePerPersonPkr : null;
  const highestPrice = sortedPrices.length > 1 ? sortedPrices[sortedPrices.length - 1].pricePerPersonPkr : null;

  const displayLowest = lowestPrice != null
    ? lowestPrice.toLocaleString("en-PK")
    : pkg.price ?? "—";

  const displayHighest = highestPrice != null
    ? highestPrice.toLocaleString("en-PK")
    : null;

  const remaining =
    pkg.totalSeats != null ? Math.max(0, pkg.totalSeats - pkg.seatsBooked) : null;

  const routeLabel = pkg.route ?? "LHE-JED-LHE";
  const airlineLabel = pkg.airline ?? "Saudi Airlines";

  const hasMakkah = !!(pkg.makkahHotel || pkg.makkahHotelImg);
  const hasMadinah = !!(pkg.madinahHotel || pkg.madinahHotelImg);
  const hasHotels = hasMakkah || hasMadinah;

  return (
    <div className="bg-white border border-[var(--lp-border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">

      {/* ── HEADER: route + airline + seats ── */}
      <div className="flex items-center justify-between gap-2 bg-[var(--lp-ink)] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 text-white text-sm">
            ✈
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{routeLabel}</p>
            <p className="text-white/60 text-[11px] truncate">{airlineLabel}</p>
          </div>
        </div>
        {remaining != null && (
          <span className={`shrink-0 text-[11px] font-bold px-3 py-1 rounded-full border ${
            remaining <= 5
              ? "bg-red-500/20 text-red-300 border-red-400/30"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
          }`}>
            {remaining} seats left
          </span>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="p-4 flex flex-col gap-3.5 flex-1">

        {/* Badges + name */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {pkg.duration && (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {pkg.duration}
              </span>
            )}
            {pkg.tier && (
              <span className="text-[10px] font-bold bg-[var(--lp-brass)]/10 text-[var(--lp-brass)] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {pkg.tier}
              </span>
            )}
            <span className="text-[10px] font-bold bg-orange-50 text-orange-500 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              Sharing Basis
            </span>
          </div>
          <h3 className="font-display text-[15px] font-bold text-[var(--lp-ink)] leading-snug line-clamp-2">
            {pkg.name}
          </h3>
        </div>

        {/* 3-pill info strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Depart</p>
            <p className="text-[11px] font-bold text-[var(--lp-ink)] mt-0.5 leading-tight">Sept<br/>2026</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Duration</p>
            <p className="text-[11px] font-bold text-[var(--lp-ink)] mt-0.5 leading-tight">{pkg.duration ?? "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Basis</p>
            <p className="text-[11px] font-bold text-[var(--lp-ink)] mt-0.5 leading-tight">Sharing</p>
          </div>
        </div>

        {/* Hotel photos */}
        {hasHotels && (
          <div className={`grid gap-2.5 ${hasMakkah && hasMadinah ? "grid-cols-2" : "grid-cols-1"}`}>
            {hasMakkah && (
              <div className="rounded-xl overflow-hidden border border-[var(--lp-border)]">
                {pkg.makkahHotelImg ? (
                  <div className="relative h-24 w-full">
                    <Image src={pkg.makkahHotelImg} alt={pkg.makkahHotel ?? "Makkah Hotel"} fill className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                      <p className="text-white text-[9px] font-bold uppercase leading-tight line-clamp-1">{pkg.makkahHotel}</p>
                      {pkg.makkahHotelDistance && <p className="text-white/70 text-[8px]">📍 {pkg.makkahHotelDistance}</p>}
                    </div>
                    <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                      Makkah{pkg.makkahHotelNights ? ` · ${pkg.makkahHotelNights}N` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="bg-orange-50 px-3 py-3 h-24 flex flex-col justify-center">
                    <span className="text-[9px] font-bold uppercase text-orange-500 block mb-1">🏨 Makkah</span>
                    <p className="font-bold text-[11px] text-[var(--lp-ink)] uppercase leading-tight line-clamp-2">{pkg.makkahHotel}</p>
                    {pkg.makkahHotelDistance && <p className="text-[9px] text-green-700 mt-1">📍 {pkg.makkahHotelDistance}</p>}
                  </div>
                )}
              </div>
            )}
            {hasMadinah && (
              <div className="rounded-xl overflow-hidden border border-[var(--lp-border)]">
                {pkg.madinahHotelImg ? (
                  <div className="relative h-24 w-full">
                    <Image src={pkg.madinahHotelImg} alt={pkg.madinahHotel ?? "Madinah Hotel"} fill className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
                      <p className="text-white text-[9px] font-bold uppercase leading-tight line-clamp-1">{pkg.madinahHotel}</p>
                      {pkg.madinahHotelDistance && <p className="text-white/70 text-[8px]">📍 {pkg.madinahHotelDistance}</p>}
                    </div>
                    <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                      Madinah{pkg.madinahHotelNights ? ` · ${pkg.madinahHotelNights}N` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="bg-blue-50 px-3 py-3 h-24 flex flex-col justify-center">
                    <span className="text-[9px] font-bold uppercase text-blue-500 block mb-1">🕌 Madinah</span>
                    <p className="font-bold text-[11px] text-[var(--lp-ink)] uppercase leading-tight line-clamp-2">{pkg.madinahHotel}</p>
                    {pkg.madinahHotelDistance && <p className="text-[9px] text-green-700 mt-1">📍 {pkg.madinahHotelDistance}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transport tag */}
        {pkg.transportType && (
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold border border-[var(--lp-brass)]/30 bg-[var(--lp-brass)]/5 text-[var(--lp-brass)] px-3 py-1.5 rounded-full">
              🚌 {pkg.transportType}
            </span>
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto pt-3 border-t border-[var(--lp-border)] flex items-end justify-between gap-3">
          <div className="flex gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Shared</p>
              <p className="text-[13px] font-bold text-[var(--lp-ink)] leading-tight">
                PKR <span className="text-[var(--lp-brass)]">{displayLowest}</span>
              </p>
            </div>
            {displayHighest && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Double</p>
                <p className="text-[13px] font-bold text-[var(--lp-ink)] leading-tight">
                  PKR {displayHighest}
                </p>
              </div>
            )}
          </div>

          {href ? (
            <Link
              href={href}
              className="shrink-0 text-[11px] font-bold text-white bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              View Details →
            </Link>
          ) : (
            <a
              href={waLink(`Assalam o Alaikum! I'm interested in "${pkg.name}". Please share details.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              📲 Enquire
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
