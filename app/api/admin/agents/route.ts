import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";
import { getBrandInitials, formatSequence } from "@/lib/agentId";

export const dynamic = "force-dynamic";

const BRAND_NAME = "East and West Travel Services";

/** Auto-generate next Agent ID: EW-01, EW-02, … */
async function nextAgentCode(): Promise<string> {
  const prefix = getBrandInitials(BRAND_NAME); // "EW"

  const agents = await prisma.agent.findMany({
    where: { agentCode: { startsWith: `${prefix}-` } },
    select: { agentCode: true },
  });

  let maxSeq = 0;
  for (const { agentCode } of agents) {
    const parts = agentCode.split("-");
    const seq = parseInt(parts[1], 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  return `${prefix}-${formatSequence(maxSeq + 1)}`;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: { commissionRates: true },
    });
    const sanitized = agents.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json({ agents: sanitized });
  } catch (e) {
    console.error("GET /api/admin/agents failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? `Could not load agents: ${e.message}` : "Could not load agents." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email    = typeof body?.email    === "string" ? body.email.trim().toLowerCase() : "";
  const phone    = typeof body?.phone    === "string" ? body.phone.trim() : undefined;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!fullName || !email || password.length < 8) {
    return NextResponse.json(
      { error: "fullName, email, and a password (min 8 chars) are required." },
      { status: 400 }
    );
  }

  // Auto-generate Agent ID
  const agentCode = await nextAgentCode();

  const passwordHash = await hashPassword(password);

  try {
    const agent = await prisma.agent.create({
      data: { agentCode, fullName, email, phone, passwordHash },
    });
    const { passwordHash: _hash, ...safeAgent } = agent;
    return NextResponse.json({ agent: safeAgent }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string; meta?: { target?: string[] } };
    if (err?.code === "P2002") {
      const field = err.meta?.target?.[0] ?? "email";
      return NextResponse.json({ error: `An agent with this ${field} already exists.` }, { status: 409 });
    }
    console.error("Agent creation failed:", e);
    return NextResponse.json({ error: "Could not create agent. Please try again." }, { status: 500 });
  }
}
