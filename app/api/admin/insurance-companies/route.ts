import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function GET() {
  const insuranceCompanies = await prisma.insuranceCompany.findMany({
    orderBy: { createdAt: "desc" },
    include: { plans: { include: { rates: true } } },
  });
  return NextResponse.json({ insuranceCompanies });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData();
  const name = form.get("name");
  if (typeof name !== "string" || !name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  let logoUrl: string | undefined;
  const file = form.get("logo");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    logoUrl = await uploadToR2({ buffer, contentType: file.type, folder: "insurance" });
  }

  const insuranceCompany = await prisma.insuranceCompany.create({
    data: { name, logoUrl, description: str("description") },
  });

  return NextResponse.json({ insuranceCompany }, { status: 201 });
}
