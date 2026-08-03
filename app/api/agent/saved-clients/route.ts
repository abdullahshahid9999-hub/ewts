import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const clients = await prisma.agentSavedClient.findMany({ where: { agentId: agent.id }, orderBy: { fullName: "asc" } });
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) return NextResponse.json({ error: "Full name is required." }, { status: 400 });

  const client = await prisma.agentSavedClient.create({
    data: {
      agentId: agent.id,
      fullName,
      passportNumber: body?.passportNumber?.trim() || null,
      cnic: body?.cnic?.trim() || null,
      phone: body?.phone?.trim() || null,
      email: body?.email?.trim() || null,
      dob: body?.dob || null,
      passportExpiry: body?.passportExpiry || null,
      notes: body?.notes?.trim() || null,
    },
  });
  return NextResponse.json({ client }, { status: 201 });
}
