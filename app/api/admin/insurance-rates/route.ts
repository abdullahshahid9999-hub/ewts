import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET() {
  const insuranceRates = await prisma.insuranceRate.findMany({
    orderBy: { pricePkr: "asc" },
    include: { plan: { include: { company: true } } },
  });
  return NextResponse.json({ insuranceRates });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const planId = typeof body?.planId === "string" ? body.planId : "";
  const pricePkr = Number(body?.pricePkr);

  if (!planId || !Number.isFinite(pricePkr) || pricePkr <= 0) {
    return NextResponse.json({ error: "planId and a positive pricePkr are required." }, { status: 400 });
  }

  const plan = await prisma.insurancePlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  const insuranceRate = await prisma.insuranceRate.create({
    data: {
      planId,
      pricePkr,
      coverageDetails: typeof body?.coverageDetails === "string" ? body.coverageDetails : undefined,
      destination: typeof body?.destination === "string" && body.destination ? body.destination : undefined,
      durationDays: Number.isFinite(Number(body?.durationDays)) && body?.durationDays ? Number(body.durationDays) : undefined,
    },
  });

  return NextResponse.json({ insuranceRate }, { status: 201 });
}
