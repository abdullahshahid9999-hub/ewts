import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

/**
 * Marks a booking as issue_requested. This must only be reachable after
 * the agent has completed the OTP verify step
 * (POST /api/agent-otp/verify with purpose=issue_request) — the client is
 * responsible for calling verify first, but we also re-check server-side
 * that a used, still-fresh OTP exists for this agent so this route can't
 * be hit directly without ever verifying a code.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  const booking = await prisma.agentBooking.findUnique({ where: { id } });
  if (!booking || booking.agentId !== agent.id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking is not in a state that can be issue-requested." }, { status: 400 });
  }

  if (booking.expiresAt && booking.expiresAt < new Date()) {
    return NextResponse.json({ error: "This booking has expired." }, { status: 400 });
  }

  // Require a recently-used OTP for this agent, purpose=issue_request,
  // used within the last 5 minutes — this is the server-side proof that
  // the OTP step actually happened for this agent, not just a client
  // claim.
  const recentVerifiedOtp = await prisma.agentOtp.findFirst({
    where: {
      agentId: agent.id,
      purpose: "issue_request",
      used: true,
      createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!recentVerifiedOtp) {
    return NextResponse.json(
      { error: "OTP verification required before requesting issuance." },
      { status: 403 }
    );
  }

  const updated = await prisma.agentBooking.update({
    where: { id: booking.id },
    data: {
      status: "issue_requested",
      issueRequestedAt: new Date(),
      issueRequestedBy: agent.id,
    },
  });

  return NextResponse.json({ booking: updated });
}
