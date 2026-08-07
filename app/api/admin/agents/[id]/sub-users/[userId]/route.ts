import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id: agentId, userId } = await params;
  const su = await prisma.agentUser.findUnique({ where: { id: userId } });
  if (!su || su.agentId !== agentId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (body?.fullName) data.fullName = body.fullName.trim();
  if (body?.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body?.designation !== undefined) data.designation = body.designation?.trim() || null;
  if (body?.status) data.status = body.status;
  if (body?.password?.length >= 8) data.passwordHash = await hashPassword(body.password);
  if (body?.permissions) data.permissions = { ...body.permissions, canIssueTickets: false };

  const updated = await prisma.agentUser.update({ where: { id: userId }, data, select: { id: true, fullName: true, email: true, phone: true, designation: true, status: true, permissions: true } });
  return NextResponse.json({ subUser: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id: agentId, userId } = await params;
  const su = await prisma.agentUser.findUnique({ where: { id: userId } });
  if (!su || su.agentId !== agentId) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await prisma.agentUser.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
