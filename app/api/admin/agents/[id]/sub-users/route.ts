import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_PERMS = { canCreateBookings: true, canViewBookings: true, canSubmitPaymentSlip: true, canViewLedger: true, canManageSavedClients: true, canViewNotifications: true };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const subUsers = await prisma.agentUser.findMany({ where: { agentId: id }, orderBy: { createdAt: "asc" }, select: { id: true, fullName: true, email: true, phone: true, designation: true, status: true, permissions: true, createdAt: true } });
  return NextResponse.json({ subUsers });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id: agentId } = await params;
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const fullName = body?.fullName?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  if (!fullName || !email || password.length < 8)
    return NextResponse.json({ error: "fullName, email, and password (min 8) required." }, { status: 400 });

  const permissions = { ...DEFAULT_PERMS, ...(body?.permissions ?? {}) };
  const passwordHash = await hashPassword(password);

  try {
    const subUser = await prisma.agentUser.create({
      data: { agentId, fullName, email, phone: body?.phone?.trim() || null, designation: body?.designation?.trim() || null, passwordHash, permissions },
      select: { id: true, fullName: true, email: true, phone: true, designation: true, status: true, permissions: true, createdAt: true },
    });
    return NextResponse.json({ subUser }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    return NextResponse.json({ error: "Could not create sub-user." }, { status: 500 });
  }
}
