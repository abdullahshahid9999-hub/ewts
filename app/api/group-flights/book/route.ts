import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { releaseExpiredSeatHolds } from "@/lib/groupFlightSeats";

// Public, unauthenticated — a direct/walk-in customer booking a seat on a
// group flight. Seats ARE held here (2-hour reservation) since there's no
// agent/admin in the loop to manually manage inventory for these — see
// lib/groupFlightSeats.ts for how expired holds get released back.
const HOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

function generatePNR() {
  // 6-character alphanumeric, uppercase, no ambiguous chars (0/O, 1/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) pnr += chars[Math.floor(Math.random() * chars.length)];
  return pnr;
}

async function generateUniquePNR() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const pnr = generatePNR();
    const clash = await prisma.booking.findUnique({ where: { bookingRef: pnr } });
    if (!clash) return pnr;
  }
  // Extremely unlikely fallback if 5 random collisions happen in a row
  return generatePNR() + Date.now().toString(36).slice(-2).toUpperCase();
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
  const travelClass = VALID_CLASSES.includes(body?.travelClass) ? body.travelClass : "Economy";

  const travellersInput: unknown = body?.travellers;
  const travellers = Array.isArray(travellersInput)
    ? travellersInput
        .map((t) => ({
          fullName: typeof t?.fullName === "string" ? t.fullName.trim() : "",
          passportNo: typeof t?.passportNo === "string" ? t.passportNo.trim() : "",
          cnic: typeof t?.cnic === "string" ? t.cnic.trim() : "",
        }))
        .filter((t) => t.fullName)
    : [];
  const seatsRequested = travellers.length > 0 ? travellers.length : Number(body?.seats) || 1;

  if (!groupFlightId || !firstName || !lastName || !whatsapp || !passport || !email) {
    return NextResponse.json(
      { error: "Flight, name, WhatsApp number, email, and passport number are required." },
      { status: 400 }
    );
  }
  if (seatsRequested < 1) {
    return NextResponse.json({ error: "At least 1 seat is required." }, { status: 400 });
  }
  if (travellers.length > 0 && travellers.length !== seatsRequested) {
    return NextResponse.json(
      { error: "Please provide a full name for every seat requested." },
      { status: 400 }
    );
  }

  // Release any stale holds on this flight first, so the seat count we
  // check against next is accurate.
  await releaseExpiredSeatHolds(groupFlightId);

  const flight = await prisma.groupFlight.findUnique({ where: { id: groupFlightId } });
  if (!flight) return NextResponse.json({ error: "Flight not found." }, { status: 404 });
  if (flight.status !== "active") {
    return NextResponse.json({ error: "This flight is no longer available." }, { status: 409 });
  }

  const pnr = await generateUniquePNR();
  const expiresAt = new Date(Date.now() + HOLD_MS);

  // Atomically hold the seats: conditional decrement only succeeds if
  // enough seats remain, and the booking is created in the same
  // transaction so the two can never go out of sync.
  const booking = await prisma
    .$transaction(async (tx) => {
      const updateResult = await tx.groupFlight.updateMany({
        where: { id: groupFlightId, seats: { gte: seatsRequested } },
        data: { seats: { decrement: seatsRequested } },
      });
      if (updateResult.count === 0) throw new Error("SOLD_OUT");

      return tx.booking.create({
        data: {
          bookingRef: pnr,
          customerName: `${firstName} ${lastName}`.trim(),
          phone: whatsapp,
          email,
          passport,
          service: "group_ticket",
          groupFlightId: flight.id,
          travelClass,
          seatsRequested,
          status: "pending",
          expiresAt,
          travellers: travellers.length > 0 ? { create: travellers } : undefined,
        },
        include: { travellers: true },
      });
    })
    .catch((e) => {
      if (e instanceof Error && e.message === "SOLD_OUT") return null;
      throw e;
    });

  if (!booking) {
    return NextResponse.json(
      { error: `Only a few seats left — not enough for ${seatsRequested} traveller(s). Please try a lower seat count.` },
      { status: 409 }
    );
  }

  const holdHoursLeft = "2 hours";
  const flightSummary = `${flight.airline} — ${flight.route} (${flight.flightNo ?? "flight no. TBC"})`;

  const adminNotifyEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (adminNotifyEmail) {
    sendEmail({
      to: adminNotifyEmail,
      subject: `New Group Flight Booking — ${flightSummary} — PNR ${pnr}`,
      html: `
        <h2>New group flight booking</h2>
        <p><strong>PNR:</strong> ${pnr}</p>
        <p><strong>Flight:</strong> ${flightSummary}</p>
        <p><strong>Class:</strong> ${travelClass} &nbsp; <strong>Seats:</strong> ${seatsRequested}</p>
        <p><strong>Customer:</strong> ${booking.customerName}</p>
        <p><strong>WhatsApp:</strong> ${whatsapp}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Passport No:</strong> ${passport}</p>
        ${travellers.length > 0 ? `<p><strong>Travellers:</strong></p><ul>${travellers.map((t) => `<li>${t.fullName}${t.passportNo ? ` — Passport: ${t.passportNo}` : ""}</li>`).join("")}</ul>` : ""}
        <p><strong>Seat hold expires:</strong> ${expiresAt.toLocaleString()}</p>
        <p><em>No payment has been collected yet — this is a booking request only. Confirm in the admin panel to keep the seat, or it auto-releases after 2 hours.</em></p>
      `,
    }).catch((e) => console.error("Group flight booking admin notification failed:", e));
  }

  // Customer confirmation email — this is the "automatic" channel (real
  // automatic WhatsApp sending requires a paid Business API the project
  // doesn't have set up; email via Resend is genuinely free and automatic).
  sendEmail({
    to: email,
    subject: `Booking Received — PNR ${pnr} — East & West Travel Services`,
    html: `
      <h2>Your booking request has been received</h2>
      <p><strong>PNR:</strong> ${pnr}</p>
      <p><strong>Flight:</strong> ${flightSummary}</p>
      <p><strong>Class:</strong> ${travelClass} &nbsp; <strong>Seats:</strong> ${seatsRequested}</p>
      <p>Your seat(s) are held for <strong>${holdHoursLeft}</strong> while our team confirms your booking.</p>
      <p><strong>No payment has been taken yet.</strong> We'll contact you on WhatsApp/phone shortly to confirm and discuss payment.</p>
      <p>Quote your PNR <strong>${pnr}</strong> if you contact us.</p>
    `,
  }).catch((e) => console.error("Group flight booking customer email failed:", e));

  return NextResponse.json({ booking, pnr, expiresAt });
}
