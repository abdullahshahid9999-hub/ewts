import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    include: { commissionRates: true },
  });

  // passwordHash is never sent to the client, even to admins.
  const sanitized = agents.map(({ passwordHash, ...rest }) => rest);
  return NextResponse.json({ agents: sanitized });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const agentCode = typeof body?.agentCode === "string" ? body.agentCode.trim() : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : undefined;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!agentCode || !fullName || !email || password.length < 8) {
    return NextResponse.json(
      { error: "agentCode, fullName, email, and a password (min 8 chars) are required." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  const agent = await prisma.agent.create({
    data: { agentCode, fullName, email, phone, passwordHash },
  });

  const { passwordHash: _hash, ...safeAgent } = agent;
  return NextResponse.json({ agent: safeAgent }, { status: 201 });
}
