"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

type RoomType = {
  id: string;
  roomType: string;
  pricePerPersonPkr: number;
  pricePerInfantPkr: number;
  pricePerChildWithBedPkr: number;
  pricePerChildWithoutBedPkr: number;
  pricePerChildPkr: number; // legacy fallback
  maxAdults: number;
  maxInfants: number;
  minAdultsRequired: number | null;
  availableSlots?: number | null;
};

function Counter({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-full border border-border font-bold text-lg flex items-center justify-center hover:bg-surface transition">−</button>
        <span className="w-6 text-center font-semibold">{value}</span>
        <button type="button" onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)} className="w-8 h-8 rounded-full border border-border font-bold text-lg flex items-center justify-center hover:bg-surface transition">+</button>
      </div>
    </div>
  );
}

// Suggest room combos when travellers exceed single room capacity
function RoomCombos({ adults, childrenWithBed, roomTypes }: { adults: number; childrenWithBed: number; roomTypes: RoomType[] }) {
  const occupancy = adults + childrenWithBed;
  if (occupancy <= (roomTypes[0]?.maxAdults ?? 99)) return null;

  const combos: string[] = [];
  // Try all pairs of room types
  for (let i = 0; i < roomTypes.length; i++) {
    for (let j = i; j < roomTypes.length; j++) {
      const total = roomTypes[i].maxAdults + roomTypes[j].maxAdults;
      if (total >= occupancy && total <= occupancy + 1) {
        combos.push(`${roomTypes[i].roomType} + ${roomTypes[j].roomType}`);
        if (combos.length >= 3) break;
      }
    }
    if (combos.length >= 3) break;
  }

  if (combos.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs">
      <p className="font-semibold text-amber-800 mb-1">💡 Suggested Room Combinations for {occupancy} people:</p>
      {combos.map((c) => <p key={c} className="text-amber-700">• {c}</p>)}
      <p className="text-amber-600 mt-1">Contact us on WhatsApp to book multiple rooms.</p>
    </div>
  );
}

export default function PackageBookingWidget({
  packageId,
  roomTypes,
  packageName,
  initialAdults = 1,
  initialChildren = 0,
  initialInfants = 0,
}: {
  packageId: string;
  roomTypes: RoomType[];
  packageName: string;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
}) {
  // Auto-select best matching room for adult count
  const autoRoom = roomTypes.find((r) => r.maxAdults >= initialAdults) ?? roomTypes[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(autoRoom?.id ?? null);
  const [adults, setAdults] = useState(initialAdults);
  const [childrenWithBed, setChildrenWithBed] = useState(0);
  const [childrenWithoutBed, setChildrenWithoutBed] = useState(Math.max(0, initialChildren));
  const [infants, setInfants] = useState(initialInfants);
  const [paxAsked, setPaxAsked] = useState(false); // whether we've shown pax clarification

  const selected = roomTypes.find((r) => r.id === selectedId) ?? null;

  // If coming from search, show pax clarification first
  const showPaxStep = initialChildren > 0 && !paxAsked;

  const cwbPrice = selected ? (selected.pricePerChildWithBedPkr || selected.pricePerChildPkr) : 0;
  const cwobPrice = selected ? (selected.pricePerChildWithoutBedPkr || 0) : 0;

  const total = useMemo(() => {
    if (!selected) return 0;
    return (
      adults * selected.pricePerPersonPkr +
      childrenWithBed * cwbPrice +
      childrenWithoutBed * cwobPrice +
      infants * selected.pricePerInfantPkr
    );
  }, [selected, adults, childrenWithBed, childrenWithoutBed, infants, cwbPrice, cwobPrice]);

  const occupancy = adults + childrenWithBed; // bed occupancy for room
  const maxOccupancy = selected?.maxAdults ?? 99;
  const minInvalid = !!(selected?.minAdultsRequired && adults < selected.minAdultsRequired);
  const overCapacity = occupancy > maxOccupancy;
  const canProceed = !!selected && !minInvalid && !overCapacity;

  function selectRoomType(rt: RoomType) {
    setSelectedId(rt.id);
    // Clamp adults to room max
    if (adults > rt.maxAdults) setAdults(rt.maxAdults);
    if (infants > rt.maxInfants) setInfants(rt.maxInfants);
  }

  const bookingFormHref = selected
    ? `/booking-form?packageId=${encodeURIComponent(packageId)}&roomTypeId=${encodeURIComponent(selected.id)}&adults=${adults}&childrenWithBed=${childrenWithBed}&childrenWithoutBed=${childrenWithoutBed}&infants=${infants}`
    : "#";

  const whatsappMessage = `Assalam o Alaikum! I'm interested in "${packageName}" — ${selected?.roomType ?? ""}, ${adults} adult(s)${childrenWithBed + childrenWithoutBed > 0 ? `, ${childrenWithBed + childrenWithoutBed} child(ren)` : ""}${infants ? `, ${infants} infant(s)` : ""}.`;

  if (roomTypes.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 text-center">
        <p className="text-muted text-sm mb-4">Room pricing isn&apos;t listed yet — WhatsApp for a custom quote.</p>
        <a href={waLink(whatsappMessage)} target="_blank" rel="noopener noreferrer" className="inline-block bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors">WhatsApp for a Quote</a>
      </div>
    );
  }

  // Pax clarification step — child with/without bed
  if (showPaxStep) {
    const totalChildren = initialChildren;
    let tempCwb = childrenWithBed;
    let tempCwob = childrenWithoutBed;
    return (
      <div className="bg-white border border-border rounded-2xl p-6">
        <h3 className="font-display text-xl font-semibold mb-2">Child Bed Preference</h3>
        <p className="text-sm text-muted mb-5">You selected {totalChildren} child(ren). How many need a bed? <span className="font-medium text-text">(Children with bed count toward room occupancy)</span></p>
        <Counter label="Children With Bed" sub="Needs own bed space, counted in room" value={childrenWithBed} min={0} max={totalChildren} onChange={(v) => { setChildrenWithBed(v); setChildrenWithoutBed(totalChildren - v); }} />
        <Counter label="Children Without Bed" sub="Sleeps with parents, no extra bed needed" value={childrenWithoutBed} min={0} max={totalChildren} onChange={(v) => { setChildrenWithoutBed(v); setChildrenWithBed(totalChildren - v); }} />
        <button type="button" onClick={() => setPaxAsked(true)} className="mt-5 w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-lg transition-colors">
          Continue to Room Selection →
        </button>
      </div>
    );
    void tempCwb; void tempCwob;
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <h3 className="font-display text-xl font-semibold mb-4">Select Room Type</h3>

      <RoomCombos adults={adults} childrenWithBed={childrenWithBed} roomTypes={roomTypes} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {roomTypes.map((rt) => {
          const isOver = adults + childrenWithBed > rt.maxAdults;
          return (
            <button key={rt.id} type="button" onClick={() => selectRoomType(rt)}
              className={`text-left rounded-xl border-2 p-4 transition-colors ${selectedId === rt.id ? "border-gold bg-gold/5" : isOver ? "border-red-100 opacity-60" : "border-border hover:border-gold/50"}`}>
              <p className="font-semibold mb-1">{rt.roomType}</p>
              {rt.availableSlots != null && rt.availableSlots > 0 && (
                <span className={`text-xs font-bold block mb-1 ${rt.availableSlots >= 9 ? "text-green-600" : rt.availableSlots >= 4 ? "text-amber-600" : "text-red-600"}`}>
                  {String(rt.availableSlots).padStart(2, "0")} slots left
                </span>
              )}
              <p className="font-display text-lg font-semibold text-gold mb-1">
                Rs. {rt.pricePerPersonPkr.toLocaleString()} <span className="text-muted text-xs font-sans font-normal">/ person</span>
              </p>
              <p className="text-muted text-xs">Up to {rt.maxAdults} bed{rt.maxAdults !== 1 ? "s" : ""}{rt.maxInfants > 0 ? `, ${rt.maxInfants} infant${rt.maxInfants !== 1 ? "s" : ""}` : ""}</p>
              {rt.minAdultsRequired && <p className="text-muted text-xs mt-1">Min {rt.minAdultsRequired} adults required</p>}
              {isOver && <p className="text-red-500 text-xs mt-1 font-medium">Over capacity for your group</p>}
            </button>
          );
        })}
      </div>

      {selected && (
        <>
          <div className="border-t border-border pt-5 mb-5">
            <h4 className="font-semibold mb-1">Travellers</h4>
            {overCapacity && <p className="text-red-600 text-xs mb-3 font-medium">⚠️ Bed occupancy ({occupancy}) exceeds room max ({maxOccupancy}). Move some children to Without Bed or pick a larger room.</p>}
            <Counter label="Adults" value={adults} min={1} max={selected.maxAdults} onChange={setAdults} />
            <Counter label="Children With Bed" sub="Counted in room occupancy" value={childrenWithBed} min={0} onChange={(v) => setChildrenWithBed(v)} />
            <Counter label="Children Without Bed" sub="No extra bed needed" value={childrenWithoutBed} min={0} onChange={setChildrenWithoutBed} />
            <Counter label={`Infants${selected.pricePerInfantPkr > 0 ? ` (Rs. ${selected.pricePerInfantPkr.toLocaleString()} each)` : " (free)"}`} value={infants} min={0} max={selected.maxInfants} onChange={setInfants} />
            <p className="text-xs text-muted mt-2">Bed occupancy: {occupancy} of {maxOccupancy} used</p>
            {minInvalid && <p className="text-red-700 text-xs mt-2">{selected.roomType} requires at least {selected.minAdultsRequired} adults.</p>}
          </div>

          <div className="bg-surface rounded-xl p-4 mb-5 text-sm">
            <div className="flex justify-between mb-1"><span>Adults ({adults} × Rs. {selected.pricePerPersonPkr.toLocaleString()})</span><span>Rs. {(adults * selected.pricePerPersonPkr).toLocaleString()}</span></div>
            {childrenWithBed > 0 && <div className="flex justify-between mb-1"><span>Children with bed ({childrenWithBed} × Rs. {cwbPrice.toLocaleString()})</span><span>Rs. {(childrenWithBed * cwbPrice).toLocaleString()}</span></div>}
            {childrenWithoutBed > 0 && <div className="flex justify-between mb-1"><span>Children without bed ({childrenWithoutBed} × Rs. {cwobPrice.toLocaleString()})</span><span>Rs. {(childrenWithoutBed * cwobPrice).toLocaleString()}</span></div>}
            {infants > 0 && <div className="flex justify-between mb-1"><span>Infants ({infants} × Rs. {selected.pricePerInfantPkr.toLocaleString()})</span><span>Rs. {(infants * selected.pricePerInfantPkr).toLocaleString()}</span></div>}
            <div className="flex justify-between font-display text-lg font-semibold pt-2 border-t border-border mt-2"><span>Total</span><span className="text-gold">Rs. {total.toLocaleString()}</span></div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canProceed ? (
              <Link href={bookingFormHref} className="flex-1 text-center bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors">Book Now</Link>
            ) : (
              <button type="button" disabled className="flex-1 bg-gold text-black font-bold px-6 py-3 rounded-lg shadow-md opacity-50 cursor-not-allowed">Book Now</button>
            )}
            <a href={waLink(whatsappMessage)} target="_blank" rel="noopener noreferrer" className="flex-1 text-center border border-border hover:border-gold px-6 py-3 rounded-lg font-semibold transition-colors">WhatsApp Instead</a>
          </div>
        </>
      )}
    </div>
  );
}
