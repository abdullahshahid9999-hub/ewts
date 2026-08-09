import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAgent(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.subUser) return NextResponse.json({ error: "Only agency owner can edit staff." }, { status: 403 });

  const { userId } = await params;
  const su = await prisma.agentUser.findUnique({ where: { id: userId } });
  if (!su || su.agentId !== session.id) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (body?.status) data.status = body.status;
  if (body?.permissions) data.permissions = { ...body.permissions, canIssueTickets: false };

  const updated = await prisma.agentUser.update({ where: { id: userId }, data, select: { id:true, fullName:true, email:true, status:true, permissions:true } });
  return NextResponse.json({ subUser: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAgent(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.subUser) return NextResponse.json({ error: "Only agency owner can delete staff." }, { status: 403 });

  const { userId } = await params;
  const su = await prisma.agentUser.findUnique({ where: { id: userId } });
  if (!su || su.agentId !== session.id) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.agentUser.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
