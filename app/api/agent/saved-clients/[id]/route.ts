import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  await prisma.agentSavedClient.deleteMany({ where: { id, agentId: agent.id } });
  return NextResponse.json({ ok: true });
}
