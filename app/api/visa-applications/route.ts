import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/visa-applications
 *
 * Accepts multipart/form-data encoding a batch of 1–N visa applications.
 * Each application is identified by an index suffix on field names:
 *   visaId_0, fullName_0, passportNumber_0, phone_0, email_0,
 *   adults_0, children_0, infants_0,
 *   doc_{docId}_0  (one per required document slot for application 0)
 *
 * Returns { batchRef, applications: [{ id, visaId, totalPricePkr }] }
 * so the client can show a confirmation.
 *
 * Price convention: totalPricePkr is ALWAYS computed server-side
 * (adults × priceAdult + children × priceChild + infants × priceInfant).
 * Client-supplied prices are ignored. This matches the existing public
 * booking route's "server always recomputes" rule.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  // Find how many applications are in this batch by scanning for visaId_0, visaId_1, …
  const indices: number[] = [];
  for (let i = 0; i < 20; i++) {
    if (form.get(`visaId_${i}`)) indices.push(i);
    else break;
  }
  if (indices.length === 0) return NextResponse.json({ error: "No applications submitted." }, { status: 400 });

  const batchRef = `VA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const results = [];

  for (const i of indices) {
    const visaId = form.get(`visaId_${i}`) as string;
    const fullName = (form.get(`fullName_${i}`) as string | null)?.trim() ?? "";
    const passportNumber = (form.get(`passportNumber_${i}`) as string | null)?.trim() ?? "";
    const phone = (form.get(`phone_${i}`) as string | null)?.trim() ?? "";
    const email = (form.get(`email_${i}`) as string | null)?.trim() ?? "";
    const adults = Math.max(0, Number(form.get(`adults_${i}`)) || 1);
    const children = Math.max(0, Number(form.get(`children_${i}`)) || 0);
    const infants = Math.max(0, Number(form.get(`infants_${i}`)) || 0);

    if (!visaId || !fullName || !passportNumber || !phone || !email) {
      return NextResponse.json(
        { error: `Application ${i + 1}: fullName, passportNumber, phone, email, and visaId are required.` },
        { status: 400 }
      );
    }

    // Fetch visa + its required documents to validate and compute price
    const visa = await prisma.visaService.findUnique({
      where: { id: visaId, status: "active" },
      include: { requiredDocuments: true },
    });
    if (!visa) return NextResponse.json({ error: `Application ${i + 1}: Visa not found.` }, { status: 404 });

    // Server-side price computation — never trust client totals
    const priceAdult = visa.priceAdult ?? 0;
    const priceChild = visa.priceChild ?? 0;
    const priceInfant = visa.priceInfant ?? 0;
    const totalPricePkr = adults * priceAdult + children * priceChild + infants * priceInfant;

    // Check required documents are present
    const requiredDocs = visa.requiredDocuments.filter((d) => d.isRequired);
    for (const doc of requiredDocs) {
      const file = form.get(`doc_${doc.id}_${i}`);
      if (!file || !(file instanceof Blob) || file.size === 0) {
        return NextResponse.json(
          { error: `Application ${i + 1}: Required document "${doc.name}" is missing.` },
          { status: 400 }
        );
      }
    }

    // Create application record
    const application = await prisma.visaApplication.create({
      data: {
        batchRef,
        visaId,
        fullName,
        passportNumber,
        phone,
        email,
        adults,
        children,
        infants,
        totalPricePkr,
        status: "pending",
      },
    });

    // Upload documents
    for (const doc of visa.requiredDocuments) {
      const file = form.get(`doc_${doc.id}_${i}`);
      if (!file || !(file instanceof Blob) || file.size === 0) continue;

      const ct = file.type || "application/pdf";
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(ct)) continue; // skip unknown types silently

      const buf = Buffer.from(await file.arrayBuffer());
      const fileUrl = await uploadToR2({ buffer: buf, contentType: ct, folder: "visas" });
      const fileName = (file as File).name ?? doc.name;

      await prisma.visaApplicationDocument.create({
        data: {
          appId: application.id,
          docId: doc.id,
          fileUrl,
          fileName,
        },
      });
    }

    results.push({ id: application.id, visaId, visa: visa.title, totalPricePkr });
  }

  return NextResponse.json({ batchRef, applications: results }, { status: 201 });
}
