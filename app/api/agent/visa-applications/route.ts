import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/apiAuth";
import { submitVisaApplicationBatch, VisaSubmissionError } from "@/lib/visaApplicationSubmit";

export const dynamic = "force-dynamic";

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
