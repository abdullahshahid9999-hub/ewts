"use client";

import { useState } from "react";
import Image from "next/image";
import { waLink } from "@/lib/whatsapp";

type Flight = {
  id: string;
  flightNo: string | null;
  airline: string;
  airlineLogoUrl: string | null;
  route: string;
  depDate: string | null;
  depTime: string | null;
  arrTime: string | null;
  arrDate: string | null;
  baggage: string | null;
  meal: string | null;
  price: string;
  seats: number;
};

const FEATURES = [
  { title: "Min 10 Seats", desc: "Special negotiated group fares starting from 10 passengers" },
  { title: "Best Group Rates", desc: "Up to 30% cheaper than individual tickets" },
  { title: "Group Check-In", desc: "Coordinated check-in and seat blocking for your group" },
];

function BookingModal({ flight, onClose }: { flight: Flight; onClose: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [passport, setPassport] = useState("");
  const [seats, setSeats] = useState("1");
  const [travelClass, setTravelClass] = useState("Economy");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = [
      "Assalam o Alaikum! I'd like to book a group ticket:",
      `Flight: ${flight.airline} — ${flight.route}`,
      `Name: ${firstName} ${lastName}`,
      `WhatsApp: ${whatsapp}`,
      email ? `Email: ${email}` : null,
      `Passport No: ${passport}`,
      `Seats: ${seats}`,
      `Class: ${travelClass}`,
    ].filter(Boolean);
    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-xl font-semibold mb-1">Book Your Seat</h2>
        <p className="text-muted text-xs mb-4">
          Your booking details will be sent to our WhatsApp team for confirmation
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" />
            <input required placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <input required placeholder="WhatsApp Number *" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input required placeholder="Passport No *" value={passport} onChange={(e) => setPassport(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input required type="number" min={1} placeholder="No. of Seats *" value={seats} onChange={(e) => setSeats(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <select value={travelClass} onChange={(e) => setTravelClass(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option>Economy</option>
            <option>Business</option>
            <option>First Class</option>
          </select>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-gold hover:bg-gold-light text-black font-bold px-3 py-2 text-sm">
              Confirm via WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupTicketsClient({ flights }: { flights: Flight[] }) {
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);

  // Group by DESTINATION (route) first — so multiple airlines serving the
  // same route sit under one clearly-labeled section instead of looking
  // like unrelated, disconnected blocks.
  const groups = new Map<string, Flight[]>();
  for (const f of flights) {
    if (!groups.has(f.route)) groups.set(f.route, []);
    groups.get(f.route)!.push(f);
  }

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 pb-16 space-y-12">
        {flights.length === 0 ? (
          <p className="text-muted text-center">
            No group flights are listed right now — WhatsApp us for current availability.
          </p>
        ) : (
          Array.from(groups.entries()).map(([route, group]) => (
            <div key={route}>
              {/* Destination heading — the single source of truth for
                  "these flights all go to the same place," so it's never
                  ambiguous even with several airlines listed below it. */}
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px flex-1 bg-border" />
                <h2 className="font-display text-2xl font-semibold text-center whitespace-nowrap">
                  {route.replace("-", " → ")}
                </h2>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="rounded-2xl overflow-hidden border border-border shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead>
                      <tr className="bg-gold text-black text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 text-left">Airline</th>
                        <th className="px-4 py-3 text-left">Flight</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Time</th>
                        <th className="px-4 py-3 text-left">Bag</th>
                        <th className="px-4 py-3 text-left">Meal</th>
                        <th className="px-4 py-3 text-left">Fare</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((f, i) => (
                        <tr
                          key={f.id}
                          className={`${i % 2 === 0 ? "bg-white" : "bg-[var(--surface)]"} border-t border-border`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 shrink-0 rounded-lg bg-white border border-border p-1.5">
                                {f.airlineLogoUrl ? (
                                  <Image src={f.airlineLogoUrl} alt={f.airline} fill className="object-contain p-0.5" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-muted font-semibold text-center leading-tight">
                                    {f.airline}
                                  </div>
                                )}
                              </div>
                              <span className="font-semibold whitespace-nowrap">{f.airline}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">{f.flightNo ?? "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted">{f.depDate ?? "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted">
                            {f.depTime ?? "—"}{f.arrTime ? ` - ${f.arrTime}` : ""}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted">{f.baggage ?? "—"}</td>
                          <td className={`px-4 py-3 font-semibold ${f.meal === "No" ? "text-red-500" : "text-green-600"}`}>
                            {f.meal ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-display font-semibold text-gold whitespace-nowrap">{f.price}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setBookingFlight(f)}
                              disabled={f.seats <= 0}
                              className="bg-[var(--navy)] hover:bg-gold hover:text-black text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {f.seats > 0 ? "Book Now" : "Sold Out"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="bg-[var(--surface)] py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 className="font-display text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {bookingFlight && <BookingModal flight={bookingFlight} onClose={() => setBookingFlight(null)} />}
    </>
  );
}
