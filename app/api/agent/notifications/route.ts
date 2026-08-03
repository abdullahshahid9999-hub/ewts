import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.agentNotification.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.agentNotification.count({ where: { agentId: agent.id, readAt: null } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// Mark one (body: { id }) or all (body: { all: true }) as read.
export async function PATCH(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.all) {
    await prisma.agentNotification.updateMany({ where: { agentId: agent.id, readAt: null }, data: { readAt: new Date() } });
  } else if (body?.id) {
    await prisma.agentNotification.updateMany({ where: { id: body.id, agentId: agent.id }, data: { readAt: new Date() } });
  }
  return NextResponse.json({ ok: true });
}
