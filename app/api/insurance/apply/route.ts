import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rateId = typeof body?.rateId === "string" ? body.rateId : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const travellers = Number(body?.travellers) || 1;

  if (!rateId || !fullName || !phone || !email) {
    return NextResponse.json({ error: "Plan, name, phone, and email are required." }, { status: 400 });
  }
  if (travellers < 1) {
    return NextResponse.json({ error: "At least 1 traveller is required." }, { status: 400 });
  }

  const rate = await prisma.insuranceRate.findUnique({
    where: { id: rateId },
    include: { plan: { include: { company: true } } },
  });
  if (!rate) return NextResponse.json({ error: "That insurance plan is no longer available." }, { status: 404 });

  const totalPricePkr = travellers * rate.pricePkr;

  const application = await prisma.insuranceApplication.create({
    data: { rateId, fullName, phone, email, travellers, totalPricePkr, status: "pending" },
  });

  return NextResponse.json({
    application: {
      id: application.id,
      planName: rate.plan.name,
      companyName: rate.plan.company.name,
      totalPricePkr,
    },
  });
}
