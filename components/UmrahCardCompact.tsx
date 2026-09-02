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

  const lowestPrice = pkg.roomTypes.length
    ? Math.min(...pkg.roomTypes.map((r) => r.pricePerPersonPkr))
    : null;

  const displayPrice = lowestPrice != null
    ? lowestPrice.toLocaleString("en-PK")
    : pkg.price ?? null;

  const remaining =
    pkg.totalSeats != null ? Math.max(0, pkg.totalSeats - pkg.seatsBooked) : null;

  // Parse sector from route like "LHE-JED-LHE"
  const routeLabel = pkg.route ?? "LHE-JED-LHE";

  // Flight info from airline
  const airlineLabel = pkg.airline ?? "";

  return (
    <div className="bg-white border border-[var(--lp-border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">

      {/* ── TOP HEADER — route + seats ── */}
      <div className="flex items-center justify-between gap-2 bg-[var(--lp-ink)] px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Airline logo placeholder circle */}
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-white">
            ✈
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{routeLabel}</p>
            <p className="text-white/60 text-[10px] font-medium truncate">{airlineLabel}</p>
          </div>
        </div>
        {remaining != null && (
          <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
            remaining <= 5
              ? "bg-red-500/20 text-red-300 border border-red-400/30"
              : "bg-green-500/20 text-green-300 border border-green-400/30"
          }`}>
            {remaining} seats left
          </span>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Package name + badges */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {pkg.duration && (
              <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {pkg.duration}
              </span>
            )}
            {pkg.tier && (
              <span className="text-[9px] font-bold bg-[var(--lp-brass)]/10 text-[var(--lp-brass)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                {pkg.tier}
              </span>
            )}
            <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Sharing Basis
            </span>
          </div>
          <h3 className="font-display text-base font-bold text-[var(--lp-ink)] leading-snug line-clamp-1">
            {pkg.name}
          </h3>
        </div>

        {/* 3 info pills row: Depart / Duration / Basis */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-xl px-2 py-2">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)] mb-0.5">Depart</p>
            <p className="text-[10px] font-bold text-[var(--lp-ink)] leading-tight">Sept 2026</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-2 py-2">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)] mb-0.5">Duration</p>
            <p className="text-[10px] font-bold text-[var(--lp-ink)] leading-tight">{pkg.duration ?? "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-2 py-2">
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)] mb-0.5">Basis</p>
            <p className="text-[10px] font-bold text-[var(--lp-ink)] leading-tight">Sharing</p>
          </div>
        </div>

        {/* Hotel photos side by side */}
        {(pkg.makkahHotelImg || pkg.madinahHotelImg || pkg.makkahHotel || pkg.madinahHotel) && (
          <div className="grid grid-cols-2 gap-2">
            {/* Makkah */}
            <div className="rounded-xl overflow-hidden border border-[var(--lp-border)]">
              {pkg.makkahHotelImg ? (
                <div className="relative h-[72px] w-full">
                  <Image
                    src={pkg.makkahHotelImg}
                    alt={pkg.makkahHotel ?? "Makkah Hotel"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                    <p className="text-white text-[8px] font-bold uppercase leading-tight line-clamp-1">
                      {pkg.makkahHotel}
                    </p>
                    {pkg.makkahHotelDistance && (
                      <p className="text-white/70 text-[7px]">📍 {pkg.makkahHotelDistance}</p>
                    )}
                  </div>
                  <span className="absolute top-1 left-1 text-[7px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                    Makkah {pkg.makkahHotelNights ? `· ${pkg.makkahHotelNights}N` : ""}
                  </span>
                </div>
              ) : (
                <div className="bg-orange-50 px-2 py-2 h-[72px] flex flex-col justify-center">
                  <span className="text-[8px] font-bold uppercase text-orange-500 block mb-0.5">🏨 Makkah</span>
                  <p className="font-bold text-[10px] text-[var(--lp-ink)] uppercase leading-tight line-clamp-2">{pkg.makkahHotel ?? "—"}</p>
                  {pkg.makkahHotelDistance && <p className="text-[8px] text-green-700 mt-0.5">📍 {pkg.makkahHotelDistance}</p>}
                </div>
              )}
            </div>
            {/* Madinah */}
            <div className="rounded-xl overflow-hidden border border-[var(--lp-border)]">
              {pkg.madinahHotelImg ? (
                <div className="relative h-[72px] w-full">
                  <Image
                    src={pkg.madinahHotelImg}
                    alt={pkg.madinahHotel ?? "Madinah Hotel"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                    <p className="text-white text-[8px] font-bold uppercase leading-tight line-clamp-1">
                      {pkg.madinahHotel}
                    </p>
                    {pkg.madinahHotelDistance && (
                      <p className="text-white/70 text-[7px]">📍 {pkg.madinahHotelDistance}</p>
                    )}
                  </div>
                  <span className="absolute top-1 left-1 text-[7px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                    Madinah {pkg.madinahHotelNights ? `· ${pkg.madinahHotelNights}N` : ""}
                  </span>
                </div>
              ) : (
                <div className="bg-blue-50 px-2 py-2 h-[72px] flex flex-col justify-center">
                  <span className="text-[8px] font-bold uppercase text-blue-500 block mb-0.5">🕌 Madinah</span>
                  <p className="font-bold text-[10px] text-[var(--lp-ink)] uppercase leading-tight line-clamp-2">{pkg.madinahHotel ?? "—"}</p>
                  {pkg.madinahHotelDistance && <p className="text-[8px] text-green-700 mt-0.5">📍 {pkg.madinahHotelDistance}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transport badge */}
        {pkg.transportType && (
          <div className="flex">
            <span className="text-[9px] font-bold border border-[var(--lp-brass)]/30 bg-[var(--lp-brass)]/5 text-[var(--lp-brass)] px-2.5 py-1 rounded-full">
              🚌 {pkg.transportType}
            </span>
          </div>
        )}

        {/* Price row + CTA */}
        <div className="mt-auto pt-2 border-t border-[var(--lp-border)] flex items-center justify-between gap-3">
          {/* Prices grid — shared / double */}
          <div className="flex gap-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Shared</p>
              <p className="text-sm font-bold text-[var(--lp-ink)]">
                PKR <span className="text-[var(--lp-brass)]">{displayPrice ?? "—"}</span>
              </p>
            </div>
            {/* Show double if second room type exists */}
            {pkg.roomTypes.length > 1 && (
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--lp-muted)]">Double</p>
                <p className="text-sm font-bold text-[var(--lp-ink)]">
                  PKR{" "}
                  <span className="text-[var(--lp-ink)]">
                    {pkg.roomTypes
                      .slice()
                      .sort((a, b) => b.pricePerPersonPkr - a.pricePerPersonPkr)[0]
                      .pricePerPersonPkr.toLocaleString("en-PK")}
                  </span>
                </p>
              </div>
            )}
          </div>

          {href ? (
            <Link
              href={href}
              className="shrink-0 text-[11px] font-bold text-white bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] px-4 py-2.5 rounded-xl transition-colors text-center"
            >
              View Details →
            </Link>
          ) : (
            <a
              href={waLink(`Assalam o Alaikum! I'm interested in "${pkg.name}". Please share details.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-4 py-2.5 rounded-xl transition-colors"
            >
              📲 Enquire
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
