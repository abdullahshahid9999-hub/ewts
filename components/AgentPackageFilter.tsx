"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import UmrahCardV2, { type UmrahCardV2Package } from "@/components/UmrahCardV2";
import UmrahCardCompact from "@/components/UmrahCardCompact";

type PkgRow = {
  id: string;
  name: string;
  slug: string | null;
  cardVersion: string | null;
  tier: string | null;
  duration: string | null;
  destination: string | null;
  departureCity: string | null;
  airline: string | null;
  price: string | null;
  imageUrl: string | null;
  featured: boolean;
  depDate: string | null;
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
  includes: string | null;
  roomTypes: { pricePerPersonPkr: number; availableSlots: number | null }[];
};

export default function AgentPackageFilter({ packages }: { packages: PkgRow[] }) {
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  // Unique tiers
  const tiers = useMemo(() => {
    const t = new Set(packages.map((p) => p.tier?.toLowerCase()).filter(Boolean) as string[]);
    return Array.from(t);
  }, [packages]);

  const filtered = useMemo(() => {
    let list = packages.filter((p) => {
      const search = q.toLowerCase();
      if (search) {
        const haystack = [p.name, p.tier, p.duration, p.destination, p.departureCity, p.airline, p.makkahHotel, p.madinahHotel].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (tierFilter !== "all" && p.tier?.toLowerCase() !== tierFilter) return false;
      return true;
    });

    if (sortBy === "featured") {
      list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => {
        const pa = a.roomTypes[0]?.pricePerPersonPkr ?? 999999999;
        const pb = b.roomTypes[0]?.pricePerPersonPkr ?? 999999999;
        return pa - pb;
      });
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => {
        const pa = a.roomTypes[0]?.pricePerPersonPkr ?? 0;
        const pb = b.roomTypes[0]?.pricePerPersonPkr ?? 0;
        return pb - pa;
      });
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [packages, q, tierFilter, sortBy]);

  return (
    <div>
      {/* FILTER BAR */}
      <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search packages…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
          />
        </div>
        {tiers.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTierFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${tierFilter === "all" ? "bg-[var(--navy)] text-white border-[var(--navy)]" : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--navy)]"}`}
            >All</button>
            {tiers.map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize ${tierFilter === t ? "bg-[var(--navy)] text-white border-[var(--navy)]" : "bg-white text-[var(--muted)] border-[var(--border)] hover:border-[var(--navy)]"}`}
              >{t}</button>
            ))}
          </div>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="ml-auto px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-white text-[var(--text)] focus:outline-none"
        >
          <option value="featured">Sort: Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name">Name A–Z</option>
        </select>
        <span className="text-xs text-[var(--muted)]">{filtered.length} package{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* RESULTS */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-[var(--muted)] py-12">No packages match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6 pb-8">
          {filtered.map((pkg) => {
            const detailHref = pkg.slug ? `/agent/umrah/${pkg.slug}` : null;

            if (pkg.cardVersion === "v2") {
              return (
                <div key={pkg.id} className="col-span-1">
                  <UmrahCardCompact
                    pkg={pkg as unknown as UmrahCardV2Package}
                    detailHref={detailHref}
                    isAgent={true}
                  />
                </div>
              );
            }

            return (
              <Link
                key={pkg.id}
                href={detailHref ?? "#"}
                className="ap-card"
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div className="relative h-36 bg-surface">
                  {pkg.imageUrl ? (
                    <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[#1a2b45] text-white/50 text-xs">
                      {pkg.name}
                    </div>
                  )}
                  {pkg.featured && (
                    <span className="absolute top-2 left-2 bg-gold text-black text-[10px] font-bold px-2 py-0.5 rounded">Featured</span>
                  )}
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{pkg.name}</p>
                  {pkg.tier && (
                    <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 mb-1">{pkg.tier}</span>
                  )}
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {pkg.duration} {pkg.destination ? `· ${pkg.destination}` : ""}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginTop: 6 }}>{pkg.price}</p>
                  {!pkg.slug && (
                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>No slug set — ask admin to add one.</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
