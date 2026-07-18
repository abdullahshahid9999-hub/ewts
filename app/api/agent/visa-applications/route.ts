import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { submitVisaApplicationBatch, VisaSubmissionError } from "@/lib/visaApplicationSubmit";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "under_review", "approved", "rejected", "more_info_needed"];

export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { agentId: agent.id };
  if (status && status !== "all" && VALID_STATUSES.includes(status)) {
    where.status = status;
  }

  const applications = await prisma.visaApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      visa: { select: { title: true, country: true, type: true } },
      applicants: { select: { id: true, fullName: true, ageGroup: true } },
    },
  });

  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

    const { batchRef, applications } = await submitVisaApplicationBatch(form, { agentId: agent.id });
    return NextResponse.json({ batchRef, applications }, { status: 201 });
  } catch (err) {
    if (err instanceof VisaSubmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Agent visa application submission error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error — please try again." },
      { status: 500 }
    );
  }
}
