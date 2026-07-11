import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, stripAgentWriteOnlyFields } from "@/lib/apiAuth";
import { calculateCommission } from "@/lib/commission";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

const VALID_SERVICE_TYPES = ["umrah", "group_ticket", "insurance"] as const;
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

  const bookings = await prisma.agentBooking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { groupFlight: true },
  });

  return NextResponse.json({ bookings });
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

    // Atomically decrement seats and create the booking together. The
    // conditional `seats: { gt: 0 }` in the update's where-clause means
    // this update affects zero rows if someone else just took the last
    // seat between the check and this call — we detect that via count
    // and bail out, instead of silently overselling.
    booking = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.groupFlight.updateMany({
        where: { id: groupFlightId, seats: { gt: 0 } },
        data: { seats: { decrement: 1 } },
      });
      if (updateResult.count === 0) {
        throw new Error("SOLD_OUT");
      }
      return tx.agentBooking.create({
        data: {
          agentId: agent.id,
          serviceType,
          groupFlightId,
          sellPrice,
          commission,
          bookingRef: generateBookingRef(),
          status: "pending",
          expiresAt: computeExpiresAt(serviceType),
        },
      });
    }).catch((e) => {
      if (e instanceof Error && e.message === "SOLD_OUT") return null;
      throw e;
    });

    if (!booking) {
      return NextResponse.json({ error: "This flight is sold out — no seats remaining." }, { status: 409 });
    }
  } else {
    booking = await prisma.agentBooking.create({
      data: {
        agentId: agent.id,
        serviceType,
        groupFlightId,
        sellPrice,
        commission,
        bookingRef: generateBookingRef(),
        status: "pending",
        expiresAt: computeExpiresAt(serviceType),
      },
    });
  }

  return NextResponse.json({ booking }, { status: 201 });
}
