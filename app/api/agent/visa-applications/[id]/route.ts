import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/apiAuth";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

const ALLOWED_DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const application = await prisma.visaApplication.findUnique({
    where: { id },
    include: {
      visa: { include: { requiredDocuments: { orderBy: { sortOrder: "asc" } } } },
      applicants: { include: { documents: true } },
      documents: { include: { document: { select: { name: true } } } },
    },
  });

  if (!application || application.agentId !== agent.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({ application });
}

// Lets an agent add documents to an EXISTING application after admin asks
// for more info — without this, the only option was starting an entirely
// new application from scratch, losing all the already-submitted info.
// Restricted to applications in "more_info_needed" so it can't be used
// to tamper with an application admin has already decided on.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await requireAgent(req);
  if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const application = await prisma.visaApplication.findUnique({
    where: { id },
    include: { applicants: true },
  });

  if (!application || application.agentId !== agent.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  if (application.status !== "more_info_needed") {
    return NextResponse.json({ error: "Documents can only be added while status is 'More Info Needed'." }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  let uploaded = 0;
  // Field convention: doc_{applicantId}_{docId} — mirrors the wizard's
  // travdoc_{i}_{t}_{docId} convention closely enough to stay consistent.
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("doc_") || !(value instanceof Blob) || value.size === 0) continue;
    const [, applicantId, docId] = key.split("_");
    if (!application.applicants.some((a) => a.id === applicantId)) continue; // ignore anything not belonging to this application

    const ct = value.type || "application/pdf";
    if (!ALLOWED_DOC_TYPES.includes(ct)) continue;

    const buf = Buffer.from(await value.arrayBuffer());
    const fileUrl = await uploadToR2({ buffer: buf, contentType: ct, folder: "visas" });
    const fileName = (value as File).name ?? "document";

    await prisma.visaApplicationDocument.create({
      data: { appId: application.id, applicantId, docId: docId || null, fileUrl, fileName },
    });
    uploaded++;
  }

  if (uploaded === 0) {
    return NextResponse.json({ error: "No valid documents were uploaded." }, { status: 400 });
  }

  // Bump back to under_review so admin knows there's something new to
  // look at, instead of it sitting silently in more_info_needed forever.
  await prisma.visaApplication.update({ where: { id }, data: { status: "under_review" } });

  return NextResponse.json({ ok: true, uploaded });
}
