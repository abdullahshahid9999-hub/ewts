import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { hashPassword } from "@/lib/auth";
import { getBrandInitials, getCityCode, generateAgentCode, TIER_CREDIT } from "@/lib/agentId";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ error: "Could not load agents." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fullName         = typeof body?.fullName        === "string" ? body.fullName.trim()         : "";
  const email            = typeof body?.email           === "string" ? body.email.trim().toLowerCase(): "";
  const phone            = typeof body?.phone           === "string" ? body.phone.trim()            : undefined;
  const password         = typeof body?.password        === "string" ? body.password                : "";
  const agencyName       = typeof body?.agencyName      === "string" ? body.agencyName.trim()       : "";
  const agencyCity       = typeof body?.agencyCity      === "string" ? body.agencyCity.trim()       : "";
  const agencyAddress    = typeof body?.agencyAddress   === "string" ? body.agencyAddress.trim()    : undefined;
  const dtsLicense       = typeof body?.dtsLicense      === "boolean"? body.dtsLicense              : false;
  const dtsLicenseNumber = typeof body?.dtsLicenseNumber=== "string" ? body.dtsLicenseNumber.trim() : undefined;
  const tier             = typeof body?.tier            === "string" ? body.tier.toLowerCase()      : "bronze";
  const isOwner          = body?.isOwner !== false; // default true
  const commissionRates: { serviceType: string; rateType: string; value: number }[] =
    Array.isArray(body?.commissionRates) ? body.commissionRates : [];
  // Admin can override credit limit; otherwise use tier default
  const creditLimitOverride = typeof body?.creditLimit === "number" ? body.creditLimit : null;

  if (!fullName || !email || password.length < 8)
    return NextResponse.json({ error: "fullName, email, and password (min 8 chars) required." }, { status: 400 });
  if (!agencyName || !agencyCity)
    return NextResponse.json({ error: "agencyName and agencyCity are required." }, { status: 400 });

  // Find existing codes for same brand+city to determine next slot
  const prefix   = getBrandInitials(agencyName);
  const cityCode = getCityCode(agencyCity);
  const base     = `${prefix}-${cityCode}-`;

  const existing = await prisma.agent.findMany({
    where: { agentCode: { startsWith: base } },
    select: { agentCode: true },
  });
  const existingCodes = existing.map(a => a.agentCode);
  const agentCode = generateAgentCode(agencyName, agencyCity, tier, existingCodes, isOwner);

  const creditLimit = creditLimitOverride ?? TIER_CREDIT[tier] ?? 0;
  const passwordHash = await hashPassword(password);
  const now = new Date();

  try {
    const agent = await prisma.agent.create({
      data: {
        agentCode, fullName, email, phone, passwordHash,
        agencyName, agencyCity, agencyAddress,
        dtsLicense, dtsLicenseNumber: dtsLicense ? dtsLicenseNumber : undefined,
        tier, creditLimit,
        creditLimitUpdatedAt: now,
        creditLimitEffectiveAt: now,
        commissionRates: commissionRates.length > 0 ? {
          create: commissionRates
            .filter(r => r.serviceType && r.rateType && typeof r.value === "number")
            .map(r => ({ serviceType: r.serviceType, rateType: r.rateType, value: r.value, effectiveAt: now })),
        } : undefined,
      },
      include: { commissionRates: true },
    });
    const { passwordHash: _, ...safeAgent } = agent;
    return NextResponse.json({ agent: safeAgent }, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string; meta?: { target?: string[] } };
    if (err?.code === "P2002") {
      const field = err.meta?.target?.[0] ?? "field";
      return NextResponse.json({ error: `Agent with this ${field} already exists.` }, { status: 409 });
    }
    console.error("Agent creation failed:", e);
    return NextResponse.json({ error: "Could not create agent." }, { status: 500 });
  }
}
