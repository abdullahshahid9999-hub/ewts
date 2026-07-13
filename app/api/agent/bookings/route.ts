import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, stripAgentWriteOnlyFields } from "@/lib/apiAuth";
import { calculateCommission } from "@/lib/commission";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

const VALID_SERVICE_TYPES = ["umrah", "tours", "group_ticket", "insurance"] as const;
const VALID_STATUSES = ["pending", "confirmed", "issue_requested", "issued", "cancelled"] as const;

// Internal-inventory bookings (umrah/insurance, no live supplier API) get a
// flat 30-minute window to request issuance. Group tickets are backed by
// supplier seat holds — new bookings default to the same 30-minute window
// unless/until a real supplier integration provides its own limit, in
// which case that limit minus a 3-minute safety buffer should be used
// instead (see brief item 3, "Booking expiry timers").
const INTERNAL_INVENTORY_EXPIRY_MS = 30 * 60 * 1000;
const SUPPLIER_SAFETY_BUFFER_MS = 3 * 60 * 1000;

function computeExpiresAt(serviceType: string, supplierLimitMs?: number) {
  if (serviceType === "group_ticket" && supplierLimitMs) {
    return new Date(Date.now() + Math.max(supplierLimitMs - SUPPLIER_SAFETY_BUFFER_MS, 0));
  }
  return new Date(Date.now() + INTERNAL_INVENTORY_EXPIRY_MS);
}

function generateBookingRef() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EWT-${stamp}-${rand}`;
}

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category"); // one of VALID_SERVICE_TYPES, or "all"/null
  const status = searchParams.get("status"); // one of VALID_STATUSES, or "all"/null
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Build ONE combined where-clause object rather than two separate
  // filter functions — the legacy bug was two filters silently
  // overwriting each other because they were applied independently.
  const where: Record<string, unknown> = { agentId: agent.id };

  if (category && category !== "all" && VALID_SERVICE_TYPES.includes(category as typeof VALID_SERVICE_TYPES[number])) {
    where.serviceType = category;
  }
  if (status && status !== "all" && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    where.status = status;
  }

  // Optional date-range scope (used by the dashboard's "bookings in this
  // period" summary — see finance/sales-dashboard brief). "to" is a
  // calendar date, treated as inclusive of the whole day.
  const from = fromParam ? new Date(fromParam) : null;
  const to = toParam ? new Date(toParam) : null;
  const toExclusive = to ? new Date(to.getTime() + 24 * 60 * 60 * 1000) : null;
  if ((from && !isNaN(from.getTime())) || (toExclusive && !isNaN(toExclusive.getTime()))) {
    where.createdAt = {
      ...(from && !isNaN(from.getTime()) ? { gte: from } : {}),
      ...(toExclusive && !isNaN(toExclusive.getTime()) ? { lt: toExclusive } : {}),
    };
  }

  const bookings = await prisma.agentBooking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { groupFlight: true },
  });

  // Lightweight summary of the currently-filtered set, mainly for the
  // dashboard's date-range "amount owed from these bookings" card — this
  // is bookings-in-range, NOT a recomputation of the agent's balance
  // (balance is a cumulative running total, see admin finance route for
  // the same caveat spelled out in more detail).
  const summary = bookings.reduce(
    (acc, b) => {
      acc.count += 1;
      acc.totalSellPrice += b.sellPrice;
      acc.totalCommission += b.commission;
      return acc;
    },
    { count: 0, totalSellPrice: 0, totalCommission: 0 }
  );

  return NextResponse.json({
    bookings,
    summary: { ...summary, net: summary.totalSellPrice - summary.totalCommission },
  });
}


export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  // Balance/creditLimit/tier/commission can never be set by the agent,
  // no matter what the client sends — enforced here, not just hidden in
  // the UI.
  const body = stripAgentWriteOnlyFields(rawBody);

  const serviceType = body.serviceType;
  if (!VALID_SERVICE_TYPES.includes(serviceType)) {
    return NextResponse.json({ error: "Invalid service_type." }, { status: 400 });
  }

  const sellPrice = Number(body.sellPrice);
  if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
    return NextResponse.json({ error: "Invalid sell price." }, { status: 400 });
  }

  const groupFlightId = typeof body.groupFlightId === "string" ? body.groupFlightId : undefined;
  const packageId = typeof body.packageId === "string" ? body.packageId : undefined;
  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : undefined;
  const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : undefined;
  const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : undefined;
  const roomTypeLabel = typeof body.roomType === "string" ? body.roomType.trim() : undefined;
  const insurancePlanLabel = typeof body.insurancePlanLabel === "string" ? body.insurancePlanLabel.trim() : undefined;
  const adults = body.adults !== undefined ? Number(body.adults) : undefined;
  const children = body.children !== undefined ? Number(body.children) : undefined;
  const infants = body.infants !== undefined ? Number(body.infants) : undefined;
  const travellersInput: unknown = body.travellers;
  const travellers = Array.isArray(travellersInput)
    ? travellersInput
        .map((t) => ({
          fullName: typeof t?.fullName === "string" ? t.fullName.trim() : "",
          passportNo: typeof t?.passportNo === "string" ? t.passportNo.trim() : "",
          cnic: typeof t?.cnic === "string" ? t.cnic.trim() : "",
        }))
        .filter((t) => t.fullName)
    : [];

  if (!customerName || !customerPhone) {
    return NextResponse.json({ error: "Customer name and phone are required." }, { status: 400 });
  }
  if (serviceType === "umrah" && travellers.length === 0) {
    return NextResponse.json(
      { error: "Please add at least one passenger's full name for Umrah bookings." },
      { status: 400 }
    );
  }

  // Commission is a SNAPSHOT computed right now from the agent's current
  // rate for this service type (admin-configured, can change over time —
  // see lib/commission.ts). Once stored on this row it never changes again,
  // even if admin updates the agent's rate later.
  const commission = await calculateCommission(agent.id, serviceType, sellPrice);

  let booking;
  if (serviceType === "group_ticket") {
    if (!groupFlightId) {
      return NextResponse.json({ error: "groupFlightId is required for group ticket bookings." }, { status: 400 });
    }

    // Seats are no longer touched here — decrement now happens at ISSUE
    // time (see admin agent-bookings [id] PATCH route), since that's when
    // the office actually commits to the seat. This is a read-only guard
    // so an agent can't even start a booking against an already-sold-out
    // flight; it does not reserve the seat, so it's still possible (if
    // rare) for multiple pending bookings to race for the last seat — the
    // real oversell protection is the transactional decrement at issue
    // time, which is where it actually matters.
    const flight = await prisma.groupFlight.findUnique({ where: { id: groupFlightId } });
    if (!flight || flight.seats <= 0) {
      return NextResponse.json({ error: "This flight is sold out — no seats remaining." }, { status: 409 });
    }

    booking = await prisma.agentBooking.create({
      data: {
        agentId: agent.id,
        serviceType,
        groupFlightId,
        sellPrice,
        commission,
        customerName,
        customerPhone,
        customerEmail,
        travellers: travellers.length > 0 ? travellers : undefined,
        bookingRef: generateBookingRef(),
        status: "pending",
        expiresAt: computeExpiresAt(serviceType),
      },
    });
  } else {
    booking = await prisma.agentBooking.create({
      data: {
        agentId: agent.id,
        serviceType,
        groupFlightId,
        packageId: serviceType === "umrah" || serviceType === "tours" ? packageId : undefined,
        sellPrice,
        commission,
        customerName,
        customerPhone,
        customerEmail,
        travellers: travellers.length > 0 ? travellers : undefined,
        roomTypeLabel,
        insurancePlanLabel,
        adults: Number.isFinite(adults) ? adults : undefined,
        children: Number.isFinite(children) ? children : undefined,
        infants: Number.isFinite(infants) ? infants : undefined,
        bookingRef: generateBookingRef(),
        status: "pending",
        expiresAt: computeExpiresAt(serviceType),
      },
    });
  }

  return NextResponse.json({ booking }, { status: 201 });
}
