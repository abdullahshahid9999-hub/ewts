import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

// POST /api/agent/topup
// Accepts multipart/form-data: amount (number) + optional slip image file.
// Creates a PaymentSlip record (status=pending). Admin approves it later,
// which credits the agent's balance via /api/admin/payment-slips/[id].
export async function POST(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const amountRaw = form.get("amount");
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "A valid amount is required." }, { status: 400 });
  }

  let slipImageUrl: string | null = null;
  const file = form.get("slip");
  if (file && file instanceof Blob) {
    const ct = file.type;
    if (!["image/jpeg", "image/png", "image/webp"].includes(ct)) {
      return NextResponse.json({ error: "Slip image must be JPEG, PNG, or WebP." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Slip image must be under 8 MB." }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    slipImageUrl = await uploadToR2({ buffer, contentType: ct, folder: "payments" });
  }

  const note = form.get("note");
  const slip = await prisma.paymentSlip.create({
    data: {
      agentId: agent.id,
      amount,
      slipImageUrl,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      status: "pending",
    },
  });

  return NextResponse.json({ slip }, { status: 201 });
}

// GET /api/agent/topup — list this agent's own payment slips
export async function GET(req: NextRequest) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const slips = await prisma.paymentSlip.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ slips });
}
