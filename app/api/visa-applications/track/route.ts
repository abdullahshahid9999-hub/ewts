import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/visa-applications/track?email=x@y.com
// OR  /api/visa-applications/track?batchRef=VA-xxx
// Public endpoint — no auth needed, but only returns data matching the
// provided identifier so users can only see their own applications.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const batchRef = searchParams.get("batchRef")?.trim() ?? "";

  if (!email && !batchRef) {
    return NextResponse.json({ error: "Provide email or batchRef." }, { status: 400 });
  }

  try {
    const applications = await prisma.visaApplication.findMany({
      where: {
        ...(email && { email: { equals: email, mode: "insensitive" } }),
        ...(batchRef && { batchRef }),
      },
      include: {
        visa: { select: { title: true, country: true, type: true, countryFlag: true } },
        documents: { select: { id: true, fileName: true, fileUrl: true, document: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (err) {
    console.error("Track applications error:", err);
    return NextResponse.json({ error: "Failed to load applications." }, { status: 500 });
  }
}
