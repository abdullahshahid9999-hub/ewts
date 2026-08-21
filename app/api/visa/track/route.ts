import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

// GET — look up application by batchRef (public, no auth — only returns safe info)
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref")?.trim().toUpperCase();
  if (!ref) return NextResponse.json({ error: "Reference required." }, { status: 400 });

  const app = await prisma.visaApplication.findFirst({
    where: { batchRef: ref },
    select: { id: true, fullName: true, visaId: true, status: true, visa: { select: { title: true, country: true } } },
  });
  if (!app) return NextResponse.json({ error: "Application not found. Please check your reference number." }, { status: 404 });
  if (app.status === "approved" || app.status === "rejected") {
    return NextResponse.json({ error: "This application is already finalised. Please contact us on WhatsApp if you need assistance." }, { status: 400 });
  }

  return NextResponse.json({ fullName: app.fullName, visaLabel: `${app.visa.country} – ${app.visa.title}` });
}

// POST — upload documents against a batchRef (public, no auth)
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const ref = (form?.get("ref") as string)?.trim().toUpperCase();
  if (!ref) return NextResponse.json({ error: "Reference required." }, { status: 400 });

  const app = await prisma.visaApplication.findFirst({
    where: { batchRef: ref },
    select: { id: true, status: true },
  });
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (app.status === "approved" || app.status === "rejected") {
    return NextResponse.json({ error: "This application is already finalised." }, { status: 400 });
  }

  const fileEntries = form?.getAll("files") ?? [];
  if (!fileEntries.length) return NextResponse.json({ error: "No files provided." }, { status: 400 });

  const urls: string[] = [];
  for (const entry of fileEntries) {
    if (!(entry instanceof Blob) || entry.size === 0) continue;
    const buffer = Buffer.from(await entry.arrayBuffer());
    const url = await uploadToR2({ buffer, contentType: entry.type || "application/octet-stream", folder: "visas" });
    urls.push(url);

    await prisma.visaApplicationDocument.create({
      data: { appId: app.id, fileUrl: url, fileName: (entry as File).name ?? "document" },
    });
  }

  if (!urls.length) return NextResponse.json({ error: "No valid files uploaded." }, { status: 400 });
  return NextResponse.json({ ok: true, uploaded: urls.length });
}
