"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  pricePerInfantPkr: number;
  pricePerChildPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
};

export default function PackageBookingWidget({
  packageId,
  roomTypes,
  packageName,
}: {
  packageId: string;
  roomTypes: RoomType[];
  packageName: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(roomTypes[0]?.id ?? null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const selected = roomTypes.find((r) => r.id === selectedId) ?? null;

  const total = useMemo(
    () => (selected ? adults * selected.pricePerPersonPkr + children * selected.pricePerChildPkr + infants * selected.pricePerInfantPkr : 0),
    [selected, adults, children, infants]
  );

  const minInvalid = !!(selected?.minAdultsRequired && adults < selected.minAdultsRequired);
  const canProceed = !!selected && !minInvalid;

  function selectRoomType(rt: RoomType) {
    setSelectedId(rt.id);
    setAdults((a) => Math.min(Math.max(a, 1), rt.maxAdults));
    setInfants((i) => Math.min(i, rt.maxInfants));
  }

  function adjustAdults(delta: number) {
    if (!selected) return;
    setAdults((a) => Math.min(Math.max(a + delta, 1), selected.maxAdults));
  }

  function adjustInfants(delta: number) {
    if (!selected) return;
    setInfants((i) => Math.min(Math.max(i + delta, 0), selected.maxInfants));
  }

  function adjustChildren(delta: number) {
    setChildren((c) => Math.max(c + delta, 0));
  }

  const bookingFormHref = selected
    ? `/booking-form?packageId=${encodeURIComponent(packageId)}&roomType=${encodeURIComponent(selected.roomType)}&adults=${adults}&children=${children}&infants=${infants}`
    : "#";

  const whatsappMessage = selected
    ? `Assalam o Alaikum! I'm interested in "${packageName}" — ${selected.roomType}, ${adults} adult(s)${children ? `, ${children} child(ren)` : ""}${infants ? `, ${infants} infant(s)` : ""}.`
    : `Assalam o Alaikum! I'm interested in "${packageName}".`;

  if (roomTypes.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 text-center">
        <p className="text-muted text-sm mb-4">
          Room pricing for this package isn&apos;t listed yet — WhatsApp us for a custom quote.
        </p>
        <a
          href={waLink(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
        >
          WhatsApp for a Quote
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <h3 className="font-display text-xl font-semibold mb-4">Select Room Type</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {roomTypes.map((rt) => (
          <button
            key={rt.id}
            type="button"
            onClick={() => selectRoomType(rt)}
            className={`text-left rounded-xl border-2 p-4 transition-colors ${
              selectedId === rt.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"
            }`}
          >
            <p className="font-semibold mb-1">{rt.roomType}</p>
            <p className="font-display text-lg font-semibold text-gold mb-1">
              Rs. {rt.pricePerPersonPkr.toLocaleString()} <span className="text-muted text-xs font-sans font-normal">/ person</span>
            </p>
            <p className="text-muted text-xs">
              Up to {rt.maxAdults} adult{rt.maxAdults === 1 ? "" : "s"}
              {rt.maxInfants > 0 ? `, ${rt.maxInfants} infant${rt.maxInfants === 1 ? "" : "s"}` : ""}
            </p>
            {rt.maxInfants > 0 && rt.pricePerInfantPkr > 0 && (
              <p className="text-muted text-xs">
                Infant rate: Rs. {rt.pricePerInfantPkr.toLocaleString()} flat
              </p>
            )}
            {rt.minAdultsRequired && (
              <p className="text-muted text-xs mt-1">Requires at least {rt.minAdultsRequired} adults.</p>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="border-t border-border pt-5 mb-5">
            <h4 className="font-semibold mb-3">Travellers</h4>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">Adults</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => adjustAdults(-1)} className="w-8 h-8 rounded-full border border-border font-bold">−</button>
                <span className="w-6 text-center font-semibold">{adults}</span>
                <button type="button" onClick={() => adjustAdults(1)} className="w-8 h-8 rounded-full border border-border font-bold">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Children</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => adjustChildren(-1)} className="w-8 h-8 rounded-full border border-border font-bold">−</button>
                <span className="w-6 text-center font-semibold">{children}</span>
                <button type="button" onClick={() => adjustChildren(1)} className="w-8 h-8 rounded-full border border-border font-bold">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">
                Infants{" "}
                <span className="text-muted text-xs">
                  {selected.pricePerInfantPkr > 0 ? `(Rs. ${selected.pricePerInfantPkr.toLocaleString()} each)` : "(free)"}
                </span>
              </span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => adjustInfants(-1)} className="w-8 h-8 rounded-full border border-border font-bold">−</button>
                <span className="w-6 text-center font-semibold">{infants}</span>
                <button type="button" onClick={() => adjustInfants(1)} className="w-8 h-8 rounded-full border border-border font-bold">+</button>
              </div>
            </div>
            {minInvalid && (
              <p className="text-red-700 text-xs mt-3">
                {selected.roomType} requires at least {selected.minAdultsRequired} adults.
              </p>
            )}
          </div>

          <div className="bg-surface rounded-xl p-4 mb-5 text-sm">
            <div className="flex justify-between mb-1">
              <span>Adults ({adults} × Rs. {selected.pricePerPersonPkr.toLocaleString()})</span>
              <span>Rs. {(adults * selected.pricePerPersonPkr).toLocaleString()}</span>
            </div>
            {children > 0 && (
              <div className="flex justify-between mb-1">
                <span>Children ({children} × Rs. {selected.pricePerChildPkr.toLocaleString()})</span>
                <span>Rs. {(children * selected.pricePerChildPkr).toLocaleString()}</span>
              </div>
            )}
            {infants > 0 && (
              <div className="flex justify-between mb-1">
                <span>Infants ({infants} × Rs. {selected.pricePerInfantPkr.toLocaleString()})</span>
                <span>Rs. {(infants * selected.pricePerInfantPkr).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-display text-lg font-semibold pt-2 border-t border-border mt-2">
              <span>Total</span>
              <span className="text-gold">Rs. {total.toLocaleString()}</span>
            </div>
          </div>

          {selected && (
            <div className="flex gap-2 flex-wrap">
              {canProceed ? (
                <Link
                  href={bookingFormHref}
                  className="flex-1 text-center bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
                >
                  Book Now
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 bg-gold text-black font-bold px-6 py-3 rounded-lg shadow-md opacity-50 cursor-not-allowed"
                >
                  Book Now
                </button>
              )}
              <a
                href={waLink(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center border border-border hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                WhatsApp Instead
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
