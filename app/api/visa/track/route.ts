import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

function validateToken(app: { uploadToken: string | null }, token: string | null): boolean {
  if (!app.uploadToken || !token) return false;
  // Constant-time compare to prevent timing attacks
  try {
    const a = Buffer.from(app.uploadToken, "utf8");
    const b = Buffer.from(token, "utf8");
    if (a.length !== b.length) return false;
    return require("crypto").timingSafeEqual(a, b);
  } catch { return false; }
}

// GET — look up application by batchRef + token
export async function GET(req: NextRequest) {
  const ref   = req.nextUrl.searchParams.get("ref")?.trim().toUpperCase();
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!ref) return NextResponse.json({ error: "Reference required." }, { status: 400 });

  const app = await prisma.visaApplication.findFirst({
    where: { batchRef: ref },
    select: { id: true, fullName: true, uploadToken: true, status: true, visa: { select: { title: true, country: true } } },
  });

  // Always give same error for not-found AND wrong token (don't leak existence)
  if (!app || !validateToken(app, token ?? null)) {
    return NextResponse.json({ error: "Invalid link. Please use the exact link from your email, or contact us on WhatsApp." }, { status: 403 });
  }
  if (app.status === "approved" || app.status === "rejected") {
    return NextResponse.json({ error: "This application is already finalised. Contact us on WhatsApp if you need help." }, { status: 400 });
  }

  return NextResponse.json({ fullName: app.fullName, visaLabel: `${app.visa.country} – ${app.visa.title}` });
}

// POST — upload documents (requires ref + token)
export async function POST(req: NextRequest) {
  const form  = await req.formData().catch(() => null);
  const ref   = (form?.get("ref") as string)?.trim().toUpperCase();
  const token = (form?.get("token") as string)?.trim();
  if (!ref) return NextResponse.json({ error: "Reference required." }, { status: 400 });

  const app = await prisma.visaApplication.findFirst({
    where: { batchRef: ref },
    select: { id: true, uploadToken: true, status: true },
  });

  if (!app || !validateToken(app, token ?? null)) {
    return NextResponse.json({ error: "Invalid link. Please use the exact link from your email." }, { status: 403 });
  }
  if (app.status === "approved" || app.status === "rejected") {
    return NextResponse.json({ error: "This application is already finalised." }, { status: 400 });
  }

  const fileEntries = form?.getAll("files") ?? [];
  if (!fileEntries.length) return NextResponse.json({ error: "No files provided." }, { status: 400 });

  let uploaded = 0;
  for (const entry of fileEntries) {
    if (!(entry instanceof Blob) || entry.size === 0) continue;
    const buffer = Buffer.from(await entry.arrayBuffer());
    const url = await uploadToR2({ buffer, contentType: entry.type || "application/octet-stream", folder: "visas" });
    await prisma.visaApplicationDocument.create({
      data: { appId: app.id, fileUrl: url, fileName: (entry as File).name ?? "document" },
    });
    uploaded++;
  }

  if (!uploaded) return NextResponse.json({ error: "No valid files." }, { status: 400 });
  return NextResponse.json({ ok: true, uploaded });
}
