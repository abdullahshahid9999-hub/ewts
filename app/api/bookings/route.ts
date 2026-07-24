import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";
import { releaseExpiredSlotHolds } from "@/lib/packageSlots";

// Public, unauthenticated — customers book without logging in (matches
// the reference site's flow: pick room type -> fill details -> submit).
// No payment integration yet (owner's own call — "payment pipeline baad
// mein jorenge"), this just records the booking as 'pending' and notifies
// the business. Price is ALWAYS recomputed server-side from the package's
// current PackageRoomType rows — never trusted from the client, even
// though the client also shows a live total for UX purposes.
function generateBookingRef() {
  return "BK-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`booking:${ip}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many booking attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const packageId = typeof body?.packageId === "string" ? body.packageId : "";
  const roomType = typeof body?.roomType === "string" ? body.roomType : "";
  const adults = Number(body?.adults) || 1;
  const children = Number(body?.children) || 0;
  const infants = Number(body?.infants) || 0;
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const passport = typeof body?.passport === "string" ? body.passport.trim() : "";
  const specialRequests = typeof body?.specialRequests === "string" ? body.specialRequests.trim() : "";
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

  if (!packageId || !roomType || !customerName || !phone || !email) {
    return NextResponse.json(
      { error: "Package, room type, name, phone, and email are required." },
      { status: 400 }
    );
  }
  if (adults < 1) {
    return NextResponse.json({ error: "At least 1 adult is required." }, { status: 400 });
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: { roomTypes: true },
  });
  if (!pkg) return NextResponse.json({ error: "Package not found." }, { status: 404 });

  const rt = pkg.roomTypes.find((r) => r.roomType === roomType);
  if (!rt) return NextResponse.json({ error: "Selected room type is not available for this package." }, { status: 400 });

  if (adults > rt.maxAdults) {
    return NextResponse.json({ error: `Maximum ${rt.maxAdults} adults for ${rt.roomType}.` }, { status: 400 });
  }
  if (infants > rt.maxInfants) {
    return NextResponse.json({ error: `Maximum ${rt.maxInfants} infants for ${rt.roomType}.` }, { status: 400 });
  }
  if (rt.minAdultsRequired && adults < rt.minAdultsRequired) {
    return NextResponse.json(
      { error: `${rt.roomType} requires at least ${rt.minAdultsRequired} adults.` },
      { status: 400 }
    );
  }

  if (pkg.category === "umrah" && travellers.length < adults) {
    return NextResponse.json(
      { error: `Please provide the full name of each adult traveller (${adults} required for Umrah bookings).` },
      { status: 400 }
    );
  }

  // Server-side price computation — the only source of truth for what
  // this booking actually costs, regardless of what the client displayed.
  const totalPricePkr = adults * rt.pricePerPersonPkr + children * rt.pricePerChildPkr + infants * rt.pricePerInfantPkr; // owner decision: flat PKR rate per infant/child, admin-configurable per room type
  const slotsNeeded = adults + children + infants;
  const tracksSlots = rt.availableSlots !== null;

  let booking;
  try {
    if (tracksSlots) {
      await releaseExpiredSlotHolds(rt.id);
      booking = await prisma
        .$transaction(async (tx) => {
          const slotUpdate = await tx.packageRoomType.updateMany({
            where: { id: rt.id, availableSlots: { gte: slotsNeeded } },
            data: { availableSlots: { decrement: slotsNeeded } },
          });
          if (slotUpdate.count === 0) throw new Error("SOLD_OUT_SLOTS");
          return tx.booking.create({
            data: {
              bookingRef: generateBookingRef(),
              customerName, phone, email: email || undefined, passport: passport || undefined,
              specialRequests: specialRequests || undefined,
              service: pkg.category, packageId: pkg.id, roomTypeLabel: rt.roomType,
              adults, children, infants, totalPricePkr, status: "pending",
              expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
              travellers: travellers.length > 0 ? { create: travellers } : undefined,
            },
            include: { travellers: true },
          });
        })
        .catch((e) => {
          if (e instanceof Error && e.message === "SOLD_OUT_SLOTS") return null;
          throw e;
        });
      if (!booking) {
        return NextResponse.json({ error: `Not enough slots left in ${rt.roomType} for ${slotsNeeded} traveller(s).` }, { status: 409 });
      }
    } else {
      booking = await prisma.booking.create({
        data: {
          bookingRef: generateBookingRef(),
          customerName,
          phone,
          email: email || undefined,
          passport: passport || undefined,
          specialRequests: specialRequests || undefined,
          service: pkg.category,
          packageId: pkg.id,
          roomTypeLabel: rt.roomType,
          adults,
          children,
          infants,
          totalPricePkr,
          status: "pending",
          travellers: travellers.length > 0 ? { create: travellers } : undefined,
        },
        include: { travellers: true },
      });
    }
  } catch (e) {
    console.error("POST /api/bookings failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? `Could not submit booking: ${e.message}` : "Could not submit booking." },
      { status: 500 }
    );
  }

  const notifyEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (notifyEmail) {
    sendEmail({
      to: notifyEmail,
      subject: `New Booking — ${pkg.name} (${booking.bookingRef})`,
      html: `
        <h2>New package booking</h2>
        <p><strong>Booking Ref:</strong> ${booking.bookingRef}</p>
        <p><strong>Package:</strong> ${pkg.name}</p>
        <p><strong>Room Type:</strong> ${rt.roomType}</p>
        <p><strong>Adults:</strong> ${adults} &nbsp; <strong>Children:</strong> ${children} &nbsp; <strong>Infants:</strong> ${infants}</p>
        <p><strong>Total:</strong> Rs. ${totalPricePkr.toLocaleString()}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
        ${passport ? `<p><strong>CNIC/Passport:</strong> ${passport}</p>` : ""}
        ${specialRequests ? `<p><strong>Special Requests:</strong> ${specialRequests}</p>` : ""}
        ${travellers.length > 0 ? `<p><strong>Travellers:</strong></p><ul>${travellers.map((t) => `<li>${t.fullName}${t.passportNo ? ` — Passport: ${t.passportNo}` : ""}${t.cnic ? ` — CNIC: ${t.cnic}` : ""}</li>`).join("")}</ul>` : ""}
        <p><em>No payment has been collected yet — this is a booking request only.</em></p>
      `,
    }).catch((e) => console.error("Booking notification email failed:", e));
  }

  return NextResponse.json({ booking }, { status: 201 });
}
