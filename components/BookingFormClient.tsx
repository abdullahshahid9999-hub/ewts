"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Pkg = { id: string; slug: string | null; name: string; category: string; imageUrl: string | null };
type RoomType = { roomType: string; pricePerPersonPkr: number; pricePerInfantPkr: number };

export default function BookingFormClient({
  pkg,
  roomType,
  adults,
  infants,
}: {
  pkg: Pkg;
  roomType: RoomType;
  adults: number;
  infants: number;
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [passport, setPassport] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const adultsTotal = adults * roomType.pricePerPersonPkr;
  const infantsTotal = infants * roomType.pricePerInfantPkr;
  const total = adultsTotal + infantsTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: pkg.id,
        roomType: roomType.roomType,
        adults,
        infants,
        customerName,
        email,
        phone,
        passport: passport || undefined,
        specialRequests: specialRequests || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit booking. Please try again.");
      return;
    }

    const q = new URLSearchParams({
      ref: data.booking.bookingRef,
      package: pkg.name,
      roomType: roomType.roomType,
      total: String(total),
    });
    router.push(`/booking-confirmation?${q.toString()}`);
  }

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-semibold mb-8">Complete Your Booking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10">
        {/* LEFT: PERSONAL INFORMATION */}
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Personal Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CNIC / Passport (optional)</label>
              <input
                value={passport}
                onChange={(e) => setPassport(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Special Requests (optional)</label>
              <textarea
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gold hover:bg-gold-light text-black font-bold px-6 py-3 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Complete Booking"}
            </button>
            <p className="text-muted text-xs text-center">
              No payment is required now. This submits a booking request only.
            </p>
          </form>
        </div>

        {/* RIGHT: BOOKING SUMMARY (read-only) */}
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Booking Summary</h2>
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="relative h-40 bg-surface">
              {pkg.imageUrl ? (
                <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--navy)] to-[#1a2b45] text-white/50 text-sm">
                  {pkg.name}
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="font-semibold mb-1">{pkg.name}</p>
              <p className="text-muted text-sm mb-4">{roomType.roomType}</p>

              <div className="text-sm space-y-1 mb-4 pb-4 border-b border-border">
                <div className="flex justify-between">
                  <span>Adults ({adults} × Rs. {roomType.pricePerPersonPkr.toLocaleString()})</span>
                  <span>Rs. {adultsTotal.toLocaleString()}</span>
                </div>
                {infants > 0 && (
                  <div className="flex justify-between">
                    <span>Infants ({infants} × Rs. {roomType.pricePerInfantPkr.toLocaleString()})</span>
                    <span>Rs. {infantsTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-display text-lg font-semibold mb-4">
                <span>Total</span>
                <span className="text-gold">Rs. {total.toLocaleString()}</span>
              </div>

              <p className="text-muted text-xs">
                Want a different room or traveller count?{" "}
                <a
                  href={pkg.slug ? `/${pkg.category}/${pkg.slug}` : `/${pkg.category}`}
                  className="text-gold hover:underline"
                >
                  Go back to the package page
                </a>{" "}
                to change your selection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
