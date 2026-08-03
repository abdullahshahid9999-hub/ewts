import { prisma } from "@/lib/prisma";

export async function notifyAgent(agentId: string, title: string, body?: string, link?: string) {
  try {
    await prisma.agentNotification.create({ data: { agentId, title, body, link } });
  } catch (e) {
    // Never let a notification failure break the actual business action
    // (topup approval, issuance, etc.) that triggered it.
    console.error("notifyAgent failed:", e);
  }
}
