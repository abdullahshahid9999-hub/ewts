"use client";
import Image from "next/image";
import Link from "next/link";
import PackageBookingWidget from "@/components/PackageBookingWidget";
import ImageGallery from "@/components/ImageGallery";
import FlightStatusBadge from "@/components/FlightStatusBadge";

type ItineraryStep = { title: string; details: string[]; images?: string[] };

type PackageWithRoomTypes = {
  id: string;
  category: string;
  name: string;
  slug: string | null;
  duration: string | null;
  price: string | null;
  priceNote: string | null;
  destination: string | null;
  departureCity: string | null;
  depDate: string | null;
  retDate: string | null;
  tier: string | null;
  airline: string | null;
  route: string | null;
  hotels: string | null;
  includes: string | null;
  excludes: string | null;
  itinerary: unknown;
  flightSectors: unknown;
  imageUrl: string | null;
  galleryUrls: unknown;
  copyEnabled: boolean;
  groupTicketEnabled: boolean;
  visaEnabled: boolean;
  // V2 fields
  cardVersion: string | null;
  makkahHotel: string | null;
  makkahHotelDistance: string | null;
  makkahHotelNights: number | null;
  makkahHotelImg: string | null;
  madinahHotel: string | null;
  madinahHotelDistance: string | null;
  madinahHotelNights: number | null;
  madinahHotelImg: string | null;
  flightType: string | null;
  luggage: string | null;
  transportType: string | null;
  totalSeats: number | null;
  seatsBooked: number;
  roomTypes: {
    id: string;
    roomType: string;
    pricePerPersonPkr: number;
    pricePerInfantPkr: number;
    pricePerChildPkr: number;
    pricePerChildWithBedPkr: number;
    pricePerChildWithoutBedPkr: number;
    maxAdults: number;
    maxInfants: number;
    minAdultsRequired: number | null;
    availableSlots?: number | null;
  }[];
};

function tierPillClass(tier: string) {
  const t = tier.toLowerCase();
  if (t === "gold") return "bg-[var(--lp-brass)] text-black";
  if (t === "platinum") return "bg-[var(--lp-ink)] text-white";
  if (t === "silver") return "bg-gray-200 text-gray-700";
  return "bg-[var(--lp-brass)]/20 text-[var(--lp-ink)]";
}

function parseList(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

type FlightSector = { type: string; flightNo?: string; airlineIata?: string; airlineName?: string; fromIata?: string; fromName?: string; toIata?: string; toName?: string; city?: string; date: string; time: string };

function parseSectors(raw: unknown): FlightSector[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is FlightSector => s && typeof s === "object" && typeof (s as FlightSector).type === "string"
  );
}

function parseItinerary(raw: unknown): ItineraryStep[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (step): step is ItineraryStep =>
      step && typeof step === "object" && typeof (step as ItineraryStep).title === "string"
  );
}

function HotelCard({ name, distance, nights, img, city }: { name: string; distance?: string | null; nights?: number | null; img?: string | null; city: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-border bg-surface shadow-sm">
      {img ? (
        <div className="relative h-44 w-full">
          <Image src={img} alt={name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">{city}</span>
          {distance && (
            <span className="absolute bottom-3 left-3 bg-[var(--lp-brass)] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">📍 {distance}</span>
          )}
        </div>
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-[var(--lp-ink)] to-[#1a2b45] flex items-center justify-center relative">
          <span className="text-white/50 text-xs">{city}</span>
          {distance && (
            <span className="absolute bottom-3 left-3 bg-[var(--lp-brass)] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">📍 {distance}</span>
          )}
        </div>
      )}
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-[var(--lp-brass)] uppercase tracking-wide mb-0.5">{city} Hotel</p>
        <p className="font-display font-semibold text-base leading-snug">{name}</p>
        {nights && <p className="text-xs text-muted mt-1">🌙 {nights} night{nights > 1 ? "s" : ""}</p>}
      </div>
    </div>
  );
}

export default function PackageDetailView({ pkg, initialAdults, initialChildren, initialInfants }: { pkg: PackageWithRoomTypes; initialAdults?: number; initialChildren?: number; initialInfants?: number }) {
  const isV2 = pkg.cardVersion === "v2";
  const includes = parseList(pkg.includes);
  const excludes = parseList(pkg.excludes);
  const itinerary = parseItinerary(pkg.itinerary);
  const sectors = parseSectors(pkg.flightSectors);
  const backHref = pkg.category === "umrah" ? "/umrah" : "/tours";

  // Build gallery: main cover + hotel images for V2
  const allImgs: string[] = [];
  if (pkg.imageUrl) allImgs.push(pkg.imageUrl);
  if (Array.isArray(pkg.galleryUrls)) allImgs.push(...(pkg.galleryUrls as string[]));
  if (isV2 && pkg.makkahHotelImg) allImgs.push(pkg.makkahHotelImg);
  if (isV2 && pkg.madinahHotelImg) allImgs.push(pkg.madinahHotelImg);

  const hasHotelSection = isV2 && (pkg.makkahHotel || pkg.madinahHotel);

  // V2 specs pills
  const v2Specs: { icon: string; label: string; value: string }[] = [];
  if (isV2) {
    if (pkg.airline) v2Specs.push({ icon: "✈️", label: "Airline", value: pkg.airline });
    if (pkg.flightType) v2Specs.push({ icon: "🛩️", label: "Flight Type", value: pkg.flightType });
    if (pkg.route) v2Specs.push({ icon: "🗺️", label: "Route", value: pkg.route });
    if (pkg.luggage) v2Specs.push({ icon: "🧳", label: "Luggage", value: pkg.luggage });
    if (pkg.transportType) v2Specs.push({ icon: "🚌", label: "Transport", value: pkg.transportType });
    if (pkg.duration) v2Specs.push({ icon: "📅", label: "Duration", value: pkg.duration });
    const totalSeats = pkg.totalSeats;
    if (totalSeats) {
      const rem = Math.max(0, totalSeats - (pkg.seatsBooked ?? 0));
      v2Specs.push({ icon: "💺", label: "Seats Left", value: `${rem} / ${totalSeats}` });
    }
  }

  return (
    <>
      {/* HEADER */}
      <section className="bg-[var(--lp-ink)] text-white px-6 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-[var(--lp-brass)]">Home</Link>
            <span className="mx-2">/</span>
            <Link href={backHref} className="hover:text-[var(--lp-brass)] capitalize">{pkg.category}</Link>
            <span className="mx-2">/</span>
            <span>{pkg.name}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {pkg.tier && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tierPillClass(pkg.tier)}`}>
                {pkg.tier.toUpperCase()}
              </span>
            )}
            {isV2 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/80">UMRAH PACKAGE</span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-semibold mb-3">{pkg.name}</h1>
          {pkg.departureCity && (
            <p className="text-white/70 text-sm">Departing from {pkg.departureCity}</p>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* GALLERY */}
        {allImgs.length > 0 ? (
          <ImageGallery images={allImgs} alt={pkg.name} />
        ) : (
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-surface mb-8 flex items-center justify-center bg-gradient-to-br from-[var(--lp-ink)] to-[#1a2b45] text-white/50 text-sm">
            {pkg.name}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 flex-wrap mb-10">
          {pkg.copyEnabled ? (
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}
              className="flex items-center gap-1.5 text-xs font-semibold border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              📋 Copy Package Link
            </button>
          ) : null}
          {pkg.groupTicketEnabled ? (
            <a href="/group-flights" className="flex items-center gap-1.5 text-xs font-semibold border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              ✈️ Group Ticket
            </a>
          ) : (
            <button type="button" disabled className="flex items-center gap-1.5 text-xs font-semibold border border-gray-200 text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed">
              ✈️ Group Ticket <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Coming Soon</span>
            </button>
          )}
          {pkg.visaEnabled ? (
            <a href="/visa" className="flex items-center gap-1.5 text-xs font-semibold border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              🛂 Visa
            </a>
          ) : (
            <button type="button" disabled className="flex items-center gap-1.5 text-xs font-semibold border border-gray-200 text-gray-300 px-4 py-2 rounded-lg cursor-not-allowed">
              🛂 Visa <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Coming Soon</span>
            </button>
          )}
        </div>

        {/* JOURNEY STEPS — Visa + Ticket flow */}
        <div className="mb-12">
          <h2 className="font-display text-xl font-semibold mb-2">🗺️ Your Journey</h2>
          <p className="text-muted text-sm mb-5">Here&apos;s what&apos;s covered and how the process works</p>
          <div className="relative">
            {/* Connecting line on desktop */}
            <div className="hidden sm:block absolute top-6 left-[calc(10%+12px)] right-[calc(10%+12px)] h-0.5 bg-gradient-to-r from-[var(--lp-brass)] via-[var(--lp-brass)]/40 to-gray-200 z-0" />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 relative z-10">
              {[
                {
                  icon: "📝",
                  label: "Booking",
                  desc: "Select room & confirm travellers",
                  active: true,
                  always: true,
                },
                {
                  icon: "🛂",
                  label: "Visa",
                  desc: pkg.visaEnabled ? "Visa assistance included" : "Arrange independently",
                  active: pkg.visaEnabled,
                  always: true,
                },
                {
                  icon: "✈️",
                  label: "Ticket",
                  desc: pkg.groupTicketEnabled ? "Group flight ticket included" : "Ticket via group flight",
                  active: pkg.groupTicketEnabled,
                  always: true,
                },
                {
                  icon: "🏨",
                  label: "Hotels",
                  desc: isV2 ? `${pkg.makkahHotel ?? "Makkah"} + ${pkg.madinahHotel ?? "Madinah"}` : "Accommodation included",
                  active: true,
                  always: true,
                },
                {
                  icon: "🕋",
                  label: "Departure",
                  desc: pkg.departureCity ? `From ${pkg.departureCity}` : "Ready to travel",
                  active: true,
                  always: true,
                },
              ].map((step, idx) => (
                <div key={idx} className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 flex-1 sm:text-center">
                  {/* Circle */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 border-2 transition-all ${
                    step.active
                      ? "bg-[var(--lp-brass)] border-[var(--lp-brass)] shadow-md"
                      : "bg-white border-gray-200"
                  }`}>
                    {step.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold leading-tight ${step.active ? "text-[var(--lp-ink)]" : "text-gray-400"}`}>{step.label}</p>
                    <p className={`text-[11px] mt-0.5 leading-snug ${step.active ? "text-muted" : "text-gray-300"}`}>{step.desc}</p>
                    {!step.active && (
                      <span className="text-[10px] font-bold text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">Not Included</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* V2 — HOTEL SECTION */}
        {hasHotelSection && (
          <div className="mb-12">
            <h2 className="font-display text-xl font-semibold mb-4">🕌 Hotel Accommodation</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              {pkg.makkahHotel && (
                <HotelCard
                  name={pkg.makkahHotel}
                  distance={pkg.makkahHotelDistance}
                  nights={pkg.makkahHotelNights}
                  img={pkg.makkahHotelImg}
                  city="Makkah"
                />
              )}
              {pkg.madinahHotel && (
                <HotelCard
                  name={pkg.madinahHotel}
                  distance={pkg.madinahHotelDistance}
                  nights={pkg.madinahHotelNights}
                  img={pkg.madinahHotelImg}
                  city="Madinah"
                />
              )}
            </div>
          </div>
        )}

        {/* V2 — SPECS PILLS */}
        {v2Specs.length > 0 && (
          <div className="mb-10 p-5 bg-surface border border-border rounded-2xl">
            <h2 className="font-display text-base font-semibold mb-4">Package Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {v2Specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white border border-border rounded-xl px-3 py-2.5">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <p className="text-[10px] text-muted font-medium uppercase tracking-wide">{s.label}</p>
                    <p className="text-sm font-semibold text-text">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* V1 — INCLUDES / EXCLUDES */}
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

        {/* FLIGHT SECTORS */}
        {sectors.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-xl font-semibold mb-4">✈️ Flight Details</h2>
            <div className="flex flex-col gap-4">
              {sectors.map((sec, i) => {
                const fromIata = sec.fromIata || sec.city || "—";
                const toIata = sec.toIata || "—";
                const fromCity = sec.fromName || fromIata;
                const toCity = sec.toName || toIata;
                const isDep = sec.type === "Departure";
                const isArr = sec.type === "Arrival";
                const typeColor = isDep ? "#16a34a" : isArr ? "#dc2626" : "#7c3aed";
                const typeBg = isDep ? "bg-green-50 border-green-200" : isArr ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200";

                return (
                  <div key={i} className={`rounded-2xl border-2 ${typeBg} overflow-hidden`}>
                    {/* Top bar: type label + flight number + badge */}
                    <div className="flex items-center justify-between px-5 py-2.5 border-b border-current/10 bg-white/60">
                      <div className="flex items-center gap-3">
                        {sec.airlineIata && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://images.kiwi.com/airlines/64/${sec.airlineIata}.png`} alt={sec.airlineName || sec.airlineIata}
                            style={{ height: 20, objectFit: "contain" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: typeColor }}>{sec.type}</span>
                        {sec.airlineName && <span className="text-xs text-muted hidden sm:inline">· {sec.airlineName}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {sec.flightNo && (
                          <span className="text-xs font-mono font-bold bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700">{sec.flightNo}</span>
                        )}
                        {sec.flightNo && <FlightStatusBadge flightIata={sec.flightNo} />}
                      </div>
                    </div>

                    {/* Main content: IATA → IATA with full names */}
                    <div className="px-5 py-4 flex items-center gap-4">
                      {/* FROM */}
                      <div className="flex-1 min-w-0">
                        <p className="text-3xl font-black text-[var(--lp-ink)] leading-none tracking-tight">{fromIata}</p>
                        <p className="text-xs text-muted mt-1 leading-snug line-clamp-2">{fromCity}</p>
                      </div>

                      {/* Arrow */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-16 sm:w-24 h-px bg-gray-300 relative">
                          <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-gray-400 text-base leading-none">›</span>
                        </div>
                        <span className="text-[10px] text-muted font-medium">✈</span>
                      </div>

                      {/* TO */}
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-3xl font-black text-[var(--lp-ink)] leading-none tracking-tight">{toIata}</p>
                        <p className="text-xs text-muted mt-1 leading-snug line-clamp-2">{toCity}</p>
                      </div>
                    </div>

                    {/* Footer: date + time */}
                    <div className="px-5 pb-4 flex items-center gap-4 text-sm">
                      {sec.date && (
                        <div className="flex items-center gap-1.5 text-muted">
                          <span>📅</span>
                          <span className="font-semibold text-[var(--lp-ink)]">{sec.date}</span>
                        </div>
                      )}
                      {sec.time && (
                        <div className="flex items-center gap-1.5 text-muted">
                          <span>🕐</span>
                          <span className="font-semibold text-[var(--lp-ink)]">{sec.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
                    <div className="w-8 h-8 rounded-full bg-[var(--lp-brass)] text-black font-bold flex items-center justify-center text-sm shrink-0">
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
        <PackageBookingWidget packageId={pkg.id} roomTypes={pkg.roomTypes} packageName={pkg.name} initialAdults={initialAdults} initialChildren={initialChildren} initialInfants={initialInfants} />
      </div>
    </>
  );
}
