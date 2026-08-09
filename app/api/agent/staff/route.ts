import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_PERMISSIONS = [
  "canCreateBookings", "canViewBookings", "canSubmitPaymentSlip",
  "canViewLedger", "canManageSavedClients", "canViewNotifications",
];

// GET — list all staff for this agent
export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const staff = await prisma.agentUser.findMany({
    where: { agentId: agent.id },
    select: { id: true, fullName: true, email: true, phone: true, designation: true, status: true, permissions: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ staff });
}

// POST — create a new staff member
export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fullName    = typeof body?.fullName    === "string" ? body.fullName.trim()    : "";
  const email       = typeof body?.email       === "string" ? body.email.trim().toLowerCase() : "";
  const phone       = typeof body?.phone       === "string" ? body.phone.trim()       : "";
  const designation = typeof body?.designation === "string" ? body.designation.trim() : "";
  const password    = typeof body?.password    === "string" ? body.password           : "";
  const perms       = typeof body?.permissions === "object" && body.permissions ? body.permissions : {};

  if (!fullName) return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  if (!email)    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

  // Validate permissions keys
  const cleanPerms: Record<string, boolean> = {};
  for (const key of ALLOWED_PERMISSIONS) {
    cleanPerms[key] = perms[key] === true;
  }

  const existing = await prisma.agentUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "A staff member with this email already exists." }, { status: 409 });

  const staff = await prisma.agentUser.create({
    data: {
      agentId: agent.id,
      fullName,
      email,
      phone: phone || null,
      designation: designation || null,
      passwordHash: await hashPassword(password),
      permissions: cleanPerms,
    },
    select: { id: true, fullName: true, email: true, phone: true, designation: true, status: true, permissions: true, createdAt: true },
  });
  return NextResponse.json({ staff }, { status: 201 });
}
