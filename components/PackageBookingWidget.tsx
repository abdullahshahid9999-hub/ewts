"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  pricePerInfantPkr: number;
  pricePerChildWithBedPkr: number;
  pricePerChildWithoutBedPkr: number;
  pricePerChildPkr: number;
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
  availableSlots?: number | null;
};

function Counter({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-border font-bold text-lg flex items-center justify-center hover:bg-surface transition disabled:opacity-30"
          disabled={value <= min}>−</button>
        <span className="w-6 text-center font-semibold text-base">{value}</span>
        <button type="button" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
          className="w-8 h-8 rounded-full border border-border font-bold text-lg flex items-center justify-center hover:bg-surface transition disabled:opacity-30"
          disabled={max !== undefined && value >= max}>+</button>
      </div>
    </div>
  );
}

// Modal: step 1 = room select, step 2 = travellers
function BookingModal({ roomTypes, packageId, packageName, onClose }: { roomTypes: RoomType[]; packageId: string; packageName: string; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string>(roomTypes[0]?.id ?? "");
  const [adults, setAdults] = useState(1);
  const [childrenWithBed, setChildrenWithBed] = useState(0);
  const [childrenWithoutBed, setChildrenWithoutBed] = useState(0);
  const [infants, setInfants] = useState(0);

  const selected = roomTypes.find(r => r.id === selectedId) ?? roomTypes[0];

  // Rules:
  // - child with bed: occupies adult slot (counted in bed occupancy)
  // - max 2 infants per booking
  // - max 2 child without bed per booking (per spec)
  const MAX_INFANTS = 2;
  const MAX_CWO_BED = 2;
  const bedOccupancy = adults + childrenWithBed;
  const maxBeds = selected?.maxAdults ?? 1;
  const overCapacity = bedOccupancy > maxBeds;
  const minInvalid = !!(selected?.minAdultsRequired && adults < selected.minAdultsRequired);

  // clamp when room changes
  function pickRoom(rt: RoomType) {
    setSelectedId(rt.id);
    if (adults > rt.maxAdults) setAdults(rt.maxAdults);
    if (childrenWithBed > rt.maxAdults - adults) setChildrenWithBed(Math.max(0, rt.maxAdults - adults));
  }

  const cwbPrice = selected ? (selected.pricePerChildWithBedPkr || selected.pricePerChildPkr) : 0;
  const cwobPrice = selected?.pricePerChildWithoutBedPkr ?? 0;
  const total = useMemo(() => {
    if (!selected) return 0;
    return adults * selected.pricePerPersonPkr + childrenWithBed * cwbPrice + childrenWithoutBed * cwobPrice + infants * selected.pricePerInfantPkr;
  }, [selected, adults, childrenWithBed, childrenWithoutBed, infants, cwbPrice, cwobPrice]);

  const bookingHref = selected ? `/booking-form?packageId=${encodeURIComponent(packageId)}&roomTypeId=${encodeURIComponent(selected.id)}&adults=${adults}&childrenWithBed=${childrenWithBed}&childrenWithoutBed=${childrenWithoutBed}&infants=${infants}` : "#";
  const waMsg = `Assalam o Alaikum! I'm interested in "${packageName}" — ${selected?.roomType ?? ""}, ${adults} adult(s)${childrenWithBed + childrenWithoutBed > 0 ? `, ${childrenWithBed + childrenWithoutBed} child(ren)` : ""}${infants ? `, ${infants} infant(s)` : ""}.`;
  const canBook = !!selected && !overCapacity && !minInvalid;

  // close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wide">Step {step} of 2</p>
            <h3 className="font-display font-semibold text-lg leading-tight">{step === 1 ? "Select Room Type" : "Travellers"}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface flex items-center justify-center text-muted text-lg transition">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {step === 1 ? (
            <div className="space-y-3">
              {roomTypes.map(rt => {
                const isSel = rt.id === selectedId;
                return (
                  <button key={rt.id} type="button" onClick={() => pickRoom(rt)}
                    className={`w-full text-left rounded-2xl border-2 px-4 py-3.5 transition-all ${isSel ? "border-gold bg-gold/5 shadow-sm" : "border-border hover:border-gold/40"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold ${isSel ? "text-base" : "text-sm text-muted"}`}>{rt.roomType}</p>
                        <p className="text-xs text-muted mt-0.5">Up to {rt.maxAdults} bed{rt.maxAdults !== 1 ? "s" : ""}{rt.maxInfants > 0 ? ` · ${rt.maxInfants} infant` : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-display font-bold ${isSel ? "text-xl text-gold" : "text-base text-muted"}`}>
                          Rs. {rt.pricePerPersonPkr.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">/ person</p>
                      </div>
                    </div>
                    {isSel && rt.availableSlots != null && rt.availableSlots > 0 && (
                      <p className={`text-xs font-bold mt-1 ${rt.availableSlots >= 9 ? "text-green-600" : rt.availableSlots >= 4 ? "text-amber-600" : "text-red-600"}`}>{rt.availableSlots} slots left</p>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              {/* Selected room recap */}
              <div className="bg-surface rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">{selected?.roomType}</p>
                <p className="text-gold font-bold">Rs. {selected?.pricePerPersonPkr.toLocaleString()} / person</p>
              </div>

              {overCapacity && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3 text-xs text-red-700 font-medium">
                  ⚠️ Bed occupancy ({bedOccupancy}) exceeds room max ({maxBeds}). Reduce adults or children with bed.
                </div>
              )}
              {minInvalid && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-3 text-xs text-amber-800 font-medium">
                  ⚠️ {selected?.roomType} requires at least {selected?.minAdultsRequired} adults.
                </div>
              )}

              <Counter label="Adults" value={adults} min={selected?.minAdultsRequired ?? 1} max={maxBeds} onChange={a => { setAdults(a); if (childrenWithBed > maxBeds - a) setChildrenWithBed(Math.max(0, maxBeds - a)); }} />
              <Counter label="Children With Bed" sub={`Uses adult bed slot (${bedOccupancy}/${maxBeds} used)`} value={childrenWithBed} min={0} max={Math.min(maxBeds - adults, maxBeds)} onChange={setChildrenWithBed} />
              <Counter label="Children Without Bed" sub="Max 2 · sleeps with parents" value={childrenWithoutBed} min={0} max={MAX_CWO_BED} onChange={setChildrenWithoutBed} />
              <Counter label={`Infants${selected && selected.pricePerInfantPkr > 0 ? ` (Rs. ${selected.pricePerInfantPkr.toLocaleString()} each)` : " (free)"}`} sub="Max 2 per booking · lap infant" value={infants} min={0} max={MAX_INFANTS} onChange={setInfants} />

              {/* Price breakdown */}
              <div className="mt-4 bg-surface rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted">Adults ({adults})</span><span>Rs. {(adults * (selected?.pricePerPersonPkr ?? 0)).toLocaleString()}</span></div>
                {childrenWithBed > 0 && <div className="flex justify-between"><span className="text-muted">Child w/ bed ({childrenWithBed})</span><span>Rs. {(childrenWithBed * cwbPrice).toLocaleString()}</span></div>}
                {childrenWithoutBed > 0 && <div className="flex justify-between"><span className="text-muted">Child w/o bed ({childrenWithoutBed})</span><span>Rs. {(childrenWithoutBed * cwobPrice).toLocaleString()}</span></div>}
                {infants > 0 && <div className="flex justify-between"><span className="text-muted">Infants ({infants})</span><span>Rs. {(infants * (selected?.pricePerInfantPkr ?? 0)).toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border mt-2">
                  <span>Total</span><span className="text-gold">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
          {step === 1 ? (
            <>
              <button onClick={() => setStep(2)} className="flex-1 bg-gold text-black font-bold py-3 rounded-xl text-base transition hover:brightness-105">
                Next: Travellers →
              </button>
              <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl border border-border font-semibold text-sm hover:border-gold transition text-center">WhatsApp</a>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border border-border font-semibold text-sm hover:border-gold transition">← Back</button>
              {canBook ? (
                <Link href={bookingHref} className="flex-1 bg-gold text-black font-bold py-3 rounded-xl text-base text-center transition hover:brightness-105">Book Now</Link>
              ) : (
                <button disabled className="flex-1 bg-gold/40 text-black font-bold py-3 rounded-xl text-base cursor-not-allowed opacity-60">Book Now</button>
              )}
              <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer"
                className="px-4 py-3 rounded-xl border border-border font-semibold text-sm hover:border-gold transition text-center">WhatsApp</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PackageBookingWidget({ packageId, roomTypes, packageName, initialAdults = 1, initialChildren = 0, initialInfants = 0 }: { packageId: string; roomTypes: RoomType[]; packageName: string; initialAdults?: number; initialChildren?: number; initialInfants?: number }) {
  const [showModal, setShowModal] = useState(false);

  // Auto-select cheapest room for the teaser
  const cheapest = roomTypes.reduce<RoomType | null>((acc, rt) => (!acc || rt.pricePerPersonPkr < acc.pricePerPersonPkr) ? rt : acc, null);
  const featured = roomTypes.find(r => r.maxAdults >= initialAdults) ?? cheapest ?? roomTypes[0] ?? null;
  const waMsg = `Assalam o Alaikum! I'm interested in "${packageName}". Please share details.`;

  if (roomTypes.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 text-center">
        <p className="text-muted text-sm mb-4">Room pricing isn&apos;t listed yet — WhatsApp for a custom quote.</p>
        <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer" className="inline-block bg-gold text-black font-bold px-6 py-3 rounded-lg shadow-md transition">WhatsApp for a Quote</a>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-border rounded-2xl p-5">
        {/* FEATURED room — big */}
        {featured && (
          <div className="mb-4">
            <p className="text-xs text-muted uppercase tracking-wide font-semibold mb-2">Starting From</p>
            <div className="rounded-2xl border-2 border-gold bg-gold/5 px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-base">{featured.roomType}</p>
                <p className="text-xs text-muted mt-0.5">Up to {featured.maxAdults} beds{featured.maxInfants > 0 ? ` · ${featured.maxInfants} infants` : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-gold">Rs. {featured.pricePerPersonPkr.toLocaleString()}</p>
                <p className="text-xs text-muted">/ person</p>
              </div>
            </div>
          </div>
        )}

        {/* Other rooms — compact chips */}
        {roomTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {roomTypes.filter(r => r.id !== featured?.id).map(rt => (
              <div key={rt.id} className="text-xs border border-border rounded-full px-3 py-1.5 text-muted flex items-center gap-1.5">
                <span className="font-semibold text-text">{rt.roomType}</span>
                <span>·</span>
                <span className="font-bold text-[var(--lp-brass,#b8860b)]">Rs. {rt.pricePerPersonPkr.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="flex-1 bg-gold text-black font-bold py-3 rounded-xl text-base transition hover:brightness-105">
            Book Now
          </button>
          <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center border border-border font-semibold py-3 rounded-xl text-sm hover:border-gold transition">
            WhatsApp Instead
          </a>
        </div>
      </div>

      {showModal && (
        <BookingModal roomTypes={roomTypes} packageId={packageId} packageName={packageName} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
