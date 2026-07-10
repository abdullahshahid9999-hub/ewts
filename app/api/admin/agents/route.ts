import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";

// Route Handlers are cached by Next.js by default — without this, admin
// panel list pages can keep showing stale data after a create/update
// even though the write succeeded (the classic 'it saved but doesn't
// show up' symptom). Force this route to always run fresh.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: { commissionRates: true },
    });

    // passwordHash is never sent to the client, even to admins.
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

  try {
    const agent = await prisma.agent.create({
      data: { agentCode, fullName, email, phone, passwordHash },
    });
    const { passwordHash: _hash, ...safeAgent } = agent;
    return NextResponse.json({ agent: safeAgent }, { status: 201 });
  } catch (e: unknown) {
    // Prisma unique constraint violation (P2002) — agentCode or email
    // already exists. Without this catch, the request just 500s with no
    // useful message and the admin sees "Could not create agent" with no
    // idea why.
    const err = e as { code?: string; meta?: { target?: string[] } };
    if (err?.code === "P2002") {
      const field = err.meta?.target?.[0] ?? "agentCode/email";
      return NextResponse.json({ error: `An agent with this ${field} already exists.` }, { status: 409 });
    }
    console.error("Agent creation failed:", e);
    return NextResponse.json({ error: "Could not create agent. Please try again." }, { status: 500 });
  }
}
