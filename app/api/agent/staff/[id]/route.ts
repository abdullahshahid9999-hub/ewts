import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_PERMISSIONS = [
  "canCreateBookings", "canViewBookings", "canSubmitPaymentSlip",
  "canViewLedger", "canManageSavedClients", "canViewNotifications",
];

async function getStaff(id: string, agentId: string) {
  const s = await prisma.agentUser.findUnique({ where: { id } });
  if (!s || s.agentId !== agentId) return null;
  return s;
}

// PATCH — update staff (permissions, status, password, details)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  const staff = await getStaff(id, agent.id);
  if (!staff) return NextResponse.json({ error: "Staff not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.fullName    === "string") data.fullName    = body.fullName.trim();
  if (typeof body.phone       === "string") data.phone       = body.phone.trim() || null;
  if (typeof body.designation === "string") data.designation = body.designation.trim() || null;
  if (body.status === "active" || body.status === "suspended") data.status = body.status;
  if (typeof body.password === "string" && body.password.length >= 6) {
    data.passwordHash = await hashPassword(body.password);
  }
  if (typeof body.permissions === "object" && body.permissions) {
    const cleanPerms: Record<string, boolean> = {};
    for (const key of ALLOWED_PERMISSIONS) cleanPerms[key] = body.permissions[key] === true;
    data.permissions = cleanPerms;
  }

  const updated = await prisma.agentUser.update({
    where: { id },
    data,
    select: { id: true, fullName: true, email: true, phone: true, designation: true, status: true, permissions: true, createdAt: true },
  });
  return NextResponse.json({ staff: updated });
}

// DELETE — remove staff member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  const staff = await getStaff(id, agent.id);
  if (!staff) return NextResponse.json({ error: "Staff not found." }, { status: 404 });
  await prisma.agentUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
