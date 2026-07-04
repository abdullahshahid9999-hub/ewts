import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET() {
  const insurancePlans = await prisma.insurancePlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { rates: true, company: true },
  });
  return NextResponse.json({ insurancePlans });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const companyId = typeof body?.companyId === "string" ? body.companyId : "";
  const name = typeof body?.name === "string" ? body.name : "";
  if (!companyId || !name) {
    return NextResponse.json({ error: "companyId and name are required." }, { status: 400 });
  }

  const company = await prisma.insuranceCompany.findUnique({ where: { id: companyId } });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const insurancePlan = await prisma.insurancePlan.create({
    data: {
      companyId,
      name,
      description: typeof body?.description === "string" ? body.description : undefined,
    },
  });

  return NextResponse.json({ insurancePlan }, { status: 201 });
}
