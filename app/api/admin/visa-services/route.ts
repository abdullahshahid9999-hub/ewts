import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export async function GET() {
  const visaServices = await prisma.visaService.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ visaServices });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData();
  const title = form.get("title");
  const country = form.get("country");
  const type = form.get("type");
  if (typeof title !== "string" || !title || typeof country !== "string" || !country) {
    return NextResponse.json({ error: "title and country are required." }, { status: 400 });
  }
  if (typeof type !== "string" || !["tourist", "umrah", "business", "work"].includes(type)) {
    return NextResponse.json({ error: "type must be tourist, umrah, business, or work." }, { status: 400 });
  }

  const str = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };

  let countryImage: string | undefined;
  const file = form.get("countryImage");
  if (file instanceof File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    countryImage = await uploadToR2({ buffer, contentType: file.type, folder: "visas" });
  }

  const visaService = await prisma.visaService.create({
    data: {
      title,
      country,
      type,
      price: str("price"),
      days: str("days"),
      validity: str("validity"),
      maxStay: str("maxStay"),
      processingTime: str("processingTime"),
      requirements: str("requirements"),
      countryFlag: str("countryFlag"),
      countryImage,
      status: str("status") ?? "active",
    },
  });

  return NextResponse.json({ visaService }, { status: 201 });
}
