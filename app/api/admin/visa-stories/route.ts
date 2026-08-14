import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stories = await prisma.visaStory.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ stories });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { country, countryFlag, headline, body: storyBody, customerName, sortOrder } = body;
  if (!country?.trim() || !headline?.trim()) return NextResponse.json({ error: "country and headline are required" }, { status: 400 });
  const story = await prisma.visaStory.create({ data: { country: country.trim(), countryFlag: countryFlag?.trim() || null, headline: headline.trim(), body: storyBody?.trim() || null, customerName: customerName?.trim() || null, sortOrder: Number(sortOrder) || 0 } });
  return NextResponse.json({ story }, { status: 201 });
}
