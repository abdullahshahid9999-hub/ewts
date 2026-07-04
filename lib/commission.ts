import { prisma } from "@/lib/prisma";

/**
 * Computes commission for a booking at CREATION time, using whatever
 * AgentCommissionRate is current right now for this agent+serviceType.
 *
 * IMPORTANT: the result must be stored directly on AgentBooking.commission
 * at creation and never recomputed later. If admin changes the agent's rate
 * afterward (e.g. relationship improves, target hit), that new rate applies
 * only to bookings created from that point on — already-issued/pending
 * bookings keep the commission they were created with. This function is
 * only ever called once, at booking-creation time.
 *
 * If no rate has been configured for this agent+serviceType yet, returns 0
 * and logs a warning — admin needs to set one via the agent management UI.
 * We don't throw, so booking creation isn't blocked by a missing rate
 * config, but 0 commission is visibly wrong so it should get noticed and
 * fixed quickly rather than silently miscalculating.
 */
export async function calculateCommission(
  agentId: string,
  serviceType: string,
  sellPrice: number
): Promise<number> {
  const rate = await prisma.agentCommissionRate.findUnique({
    where: { agentId_serviceType: { agentId, serviceType } },
  });

  if (!rate) {
    console.warn(
      `No commission rate configured for agent ${agentId} / ${serviceType} — defaulting to 0. Admin should set one.`
    );
    return 0;
  }

  if (rate.rateType === "fixed") {
    return rate.value;
  }

  if (rate.rateType === "percentage") {
    return Math.round((sellPrice * rate.value) / 100);
  }

  console.warn(`Unknown rate_type "${rate.rateType}" for agent ${agentId} / ${serviceType} — defaulting to 0.`);
  return 0;
}
