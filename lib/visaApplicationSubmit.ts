import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import crypto from "crypto";

const ALLOWED_DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export class VisaSubmissionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Reads one batch of applications (visaId_0, visaId_1, …) out of a
// FormData payload, validates each, creates the VisaApplication +
// VisaApplicationDocument rows, and returns a summary. `agentId` is set
// only when an agent is submitting on a customer's behalf — null means a
// direct/B2C application, exactly like Booking.groupFlightId is null for
// non-group-flight bookings.
export async function submitVisaApplicationBatch(
  form: FormData,
  opts: { agentId?: string } = {}
) {
  const indices: number[] = [];
  for (let i = 0; i < 20; i++) {
    if (form.get(`visaId_${i}`)) indices.push(i);
    else break;
  }
  if (indices.length === 0) throw new VisaSubmissionError("No applications submitted.");

  const batchRef = `VA-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const results: { id: string; visaId: string; visa: string; totalPricePkr: number }[] = [];

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
      throw new VisaSubmissionError(
        `Application ${i + 1}: Full name, passport number, phone, email and visa are required.`
      );
    }

    const visa = await prisma.visaService.findUnique({
      where: { id: visaId }, // no status:"active" filter so test/inactive visas still work for admin/agent testing
      include: { requiredDocuments: true },
    });
    if (!visa) throw new VisaSubmissionError(`Application ${i + 1}: Visa not found (id: ${visaId}).`, 404);

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
        throw new VisaSubmissionError(`Application ${i + 1}: "${doc.name}" is a required document — please attach it.`);
      }
    }

    const application = await prisma.visaApplication.create({
      data: {
        batchRef,
        visaId,
        agentId: opts.agentId ?? null,
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
      if (!ALLOWED_DOC_TYPES.includes(ct)) {
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
      if (!ALLOWED_DOC_TYPES.includes(ct)) continue;
      const buf = Buffer.from(await file.arrayBuffer());
      const fileUrl = await uploadToR2({ buffer: buf, contentType: ct, folder: "visas" });
      const fileName = (file as File).name ?? `document_${x + 1}`;
      await prisma.visaApplicationDocument.create({
        data: { appId: application.id, docId: null, fileUrl, fileName },
      });
    }

    results.push({ id: application.id, visaId, visa: visa.title, totalPricePkr });
  }

  return { batchRef, applications: results };
}
