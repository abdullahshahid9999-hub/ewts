import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await requireAgent(req);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const fullName = body?.fullName?.trim();
  const phone = body?.phone?.trim() || null;
  const email = body?.email?.trim() || null;
  const passportNumber = body?.passportNumber?.trim() || null;
  const forceNew = body?.forceNew === true;
  if (!fullName) return NextResponse.json({ error: "fullName required." }, { status: 400 });

  if (!forceNew) {
    const existing = await prisma.agentSavedClient.findMany({
      where: { agentId: session.id, fullName: { equals: fullName, mode: "insensitive" } }, take: 5,
    });
    if (existing.length > 0) return NextResponse.json({ conflict: true, matches: existing });
  }

  const client = await prisma.agentSavedClient.create({
    data: { agentId: session.id, fullName, phone, email, passportNumber },
  });
  return NextResponse.json({ saved: true, client }, { status: 201 });
}
