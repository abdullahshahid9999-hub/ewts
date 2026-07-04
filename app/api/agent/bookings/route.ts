import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent, stripAgentWriteOnlyFields } from "@/lib/apiAuth";

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

  const booking = await prisma.agentBooking.create({
    data: {
      agentId: agent.id,
      serviceType,
      groupFlightId,
      sellPrice,
      // Commission is computed/assigned by business rules elsewhere
      // (e.g. tier-based rate lookups), never taken verbatim from the
      // agent's request — left at the schema default here pending that
      // rule being wired in from the agent's actual commission tier.
      bookingRef: generateBookingRef(),
      status: "pending",
      expiresAt: computeExpiresAt(serviceType),
    },
  });

  return NextResponse.json({ booking }, { status: 201 });
}
