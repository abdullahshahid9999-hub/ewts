import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";

// Public, unauthenticated — a direct/walk-in customer booking a seat on a
// group flight, same spirit as /api/bookings (package bookings): no
// login, no payment collected yet, just records the request and notifies
// the office. Seats are NOT decremented here — this table mirrors the
// admin Direct Bookings module, which is a request/record, not the
// agent-network AgentBooking flow that actually manages live seat
// inventory (see app/api/admin/agent-bookings/[id]/route.ts for where
// GroupFlight.seats is actually decremented, at issue-time). An admin
// looking at this list decides for themselves whether/when to actually
// commit a seat.
function generateBookingRef() {
  return "BK-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

const VALID_CLASSES = ["Economy", "Business", "First Class"];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`group-flight-booking:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many booking attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const groupFlightId = typeof body?.groupFlightId === "string" ? body.groupFlightId : "";
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const whatsapp = typeof body?.whatsapp === "string" ? body.whatsapp.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const passport = typeof body?.passport === "string" ? body.passport.trim() : "";
  const seatsRequested = Number(body?.seats) || 1;
  const travelClass = VALID_CLASSES.includes(body?.travelClass) ? body.travelClass : "Economy";

  if (!groupFlightId || !firstName || !lastName || !whatsapp || !passport) {
    return NextResponse.json(
      { error: "Flight, name, WhatsApp number, and passport number are required." },
      { status: 400 }
    );
  }
  if (seatsRequested < 1) {
    return NextResponse.json({ error: "At least 1 seat is required." }, { status: 400 });
  }

  const flight = await prisma.groupFlight.findUnique({ where: { id: groupFlightId } });
  if (!flight) return NextResponse.json({ error: "Flight not found." }, { status: 404 });
  if (flight.status !== "active" || flight.seats <= 0) {
    return NextResponse.json({ error: "This flight is sold out or no longer available." }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      bookingRef: generateBookingRef(),
      customerName: `${firstName} ${lastName}`.trim(),
      phone: whatsapp,
      email: email || undefined,
      passport,
      service: "group_ticket",
      groupFlightId: flight.id,
      travelClass,
      seatsRequested,
      status: "pending",
    },
  });

  const notifyEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (notifyEmail) {
    sendEmail({
      to: notifyEmail,
      subject: `New Group Flight Booking — ${flight.airline} ${flight.route} (${booking.bookingRef})`,
      html: `
        <h2>New group flight booking</h2>
        <p><strong>Booking Ref:</strong> ${booking.bookingRef}</p>
        <p><strong>Flight:</strong> ${flight.airline} — ${flight.route} (${flight.flightNo ?? "no flight no."})</p>
        <p><strong>Class:</strong> ${travelClass} &nbsp; <strong>Seats:</strong> ${seatsRequested}</p>
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
        <p><strong>Passport No:</strong> ${passport}</p>
        <p><em>No payment has been collected yet — this is a booking request only.</em></p>
      `,
    }).catch((e) => console.error("Group flight booking notification email failed:", e));
  }

  return NextResponse.json({ booking }, { status: 201 });
}
