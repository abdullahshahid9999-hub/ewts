import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEF = { canCreateBookings:true, canViewBookings:true, canSubmitPaymentSlip:true, canViewLedger:true, canManageSavedClients:true, canViewNotifications:true, canIssueTickets:false };

export async function GET(req: NextRequest) {
  const session = await requireAgent(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.subUser) return NextResponse.json({ error: "Only agency owner can manage team." }, { status: 403 });

  const subUsers = await prisma.agentUser.findMany({
    where: { agentId: session.id },
    orderBy: { createdAt: "asc" },
    select: { id:true, fullName:true, email:true, phone:true, designation:true, status:true, permissions:true, createdAt:true },
  });
  return NextResponse.json({ subUsers });
}

export async function POST(req: NextRequest) {
  const session = await requireAgent(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.subUser) return NextResponse.json({ error: "Only agency owner can add staff." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const fullName = body?.fullName?.trim();
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  if (!fullName || !email || password.length < 8)
    return NextResponse.json({ error: "fullName, email, and password (min 8) required." }, { status: 400 });

  const permissions = { ...DEF, ...(body?.permissions ?? {}), canIssueTickets: false };
  const passwordHash = await hashPassword(password);

  try {
    const subUser = await prisma.agentUser.create({
      data: { agentId: session.id, fullName, email, phone: body?.phone?.trim()||null, designation: body?.designation?.trim()||null, passwordHash, permissions },
      select: { id:true, fullName:true, email:true, phone:true, designation:true, status:true, permissions:true, createdAt:true },
    });
    return NextResponse.json({ subUser }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    return NextResponse.json({ error: "Could not create staff member." }, { status: 500 });
  }
}
