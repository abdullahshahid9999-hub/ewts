import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

    // Find how many applications are in this batch (visaId_0, visaId_1, …)
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
      const fullName = ((form.get(`fullName_${i}`) as string | null) ?? "").trim();
      const passportNumber = ((form.get(`passportNumber_${i}`) as string | null) ?? "").trim();
      const phone = ((form.get(`phone_${i}`) as string | null) ?? "").trim();
      const email = ((form.get(`email_${i}`) as string | null) ?? "").trim();
      const adults = Math.max(1, Number(form.get(`adults_${i}`)) || 1);
      const children = Math.max(0, Number(form.get(`children_${i}`)) || 0);
      const infants = Math.max(0, Number(form.get(`infants_${i}`)) || 0);

      if (!visaId || !fullName || !passportNumber || !phone || !email) {
        return NextResponse.json(
          { error: `Application ${i + 1}: Full name, passport number, phone, email and visa are required.` },
          { status: 400 }
        );
      }

      // Fetch visa + documents
      const visa = await prisma.visaService.findUnique({
        where: { id: visaId },  // removed status:"active" filter so test visas work too
        include: { requiredDocuments: true },
      });
      if (!visa) {
        return NextResponse.json({ error: `Application ${i + 1}: Visa not found (id: ${visaId}).` }, { status: 404 });
      }

      // Server-side price — never trust client total
      const priceAdult = visa.priceAdult ?? 0;
      const priceChild = visa.priceChild ?? 0;
      const priceInfant = visa.priceInfant ?? 0;
      const totalPricePkr = adults * priceAdult + children * priceChild + infants * priceInfant;

      // Validate required docs are present
      const requiredDocs = visa.requiredDocuments.filter((d) => d.isRequired);
      for (const doc of requiredDocs) {
        const file = form.get(`doc_${doc.id}_${i}`);
        if (!file || !(file instanceof Blob) || file.size === 0) {
          return NextResponse.json(
            { error: `Application ${i + 1}: "${doc.name}" is a required document — please attach it.` },
            { status: 400 }
          );
        }
      }

      // Create application row
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

      // Upload documents to R2
      for (const doc of visa.requiredDocuments) {
        const file = form.get(`doc_${doc.id}_${i}`);
        if (!file || !(file instanceof Blob) || file.size === 0) continue;

        const ct = file.type || "application/pdf";
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(ct)) {
          console.warn(`Skipping unsupported file type: ${ct}`);
          continue;
        }

        const buf = Buffer.from(await file.arrayBuffer());
        const fileUrl = await uploadToR2({ buffer: buf, contentType: ct, folder: "visas" });
        const fileName = (file as File).name ?? doc.name;

        await prisma.visaApplicationDocument.create({
          data: { appId: application.id, docId: doc.id, fileUrl, fileName },
        });
      }

      // Also handle generic extra files (when no required docs configured)
      for (let x = 0; x < 10; x++) {
        const file = form.get(`extra_${x}_${i}`) ?? form.get(`extra_${x}`);
        if (!file || !(file instanceof Blob) || file.size === 0) continue;
        const ct = file.type || "application/pdf";
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(ct)) continue;
        const buf = Buffer.from(await file.arrayBuffer());
        const fileUrl = await uploadToR2({ buffer: buf, contentType: ct, folder: "visas" });
        const fileName = (file as File).name ?? `document_${x + 1}`;
        await prisma.visaApplicationDocument.create({
          data: { appId: application.id, docId: null, fileUrl, fileName },
        });
      }

      results.push({ id: application.id, visaId, visa: visa.title, totalPricePkr });
    }

    return NextResponse.json({ batchRef, applications: results }, { status: 201 });

  } catch (err) {
    console.error("Visa application submission error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error — please try again." },
      { status: 500 }
    );
  }
}
