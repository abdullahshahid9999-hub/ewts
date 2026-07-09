import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email";

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
  const infants = Number(body?.infants) || 0;
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!packageId || !roomType || !customerName || !phone) {
    return NextResponse.json(
      { error: "Package, room type, name, and phone are required." },
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

  // Server-side price computation — the only source of truth for what
  // this booking actually costs, regardless of what the client displayed.
  const totalPricePkr = adults * rt.pricePerPersonPkr; // infants priced separately only if/when the business defines an infant rate; currently free, matching "not included" style reference pricing until specified otherwise

  const booking = await prisma.booking.create({
    data: {
      bookingRef: generateBookingRef(),
      customerName,
      phone,
      email: email || undefined,
      service: pkg.category,
      packageId: pkg.id,
      roomTypeLabel: rt.roomType,
      adults,
      infants,
      totalPricePkr,
      status: "pending",
    },
  });

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
        <p><strong>Adults:</strong> ${adults} &nbsp; <strong>Infants:</strong> ${infants}</p>
        <p><strong>Total:</strong> Rs. ${totalPricePkr.toLocaleString()}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
        <p><em>No payment has been collected yet — this is a booking request only.</em></p>
      `,
    }).catch((e) => console.error("Booking notification email failed:", e));
  }

  return NextResponse.json({ booking }, { status: 201 });
}
