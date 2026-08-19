import { prisma } from "@/lib/prisma";
import { uploadToR2 } from "@/lib/r2";
import { calculateCommission } from "@/lib/commission";
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
//
// Per-traveller data (agent wizard only): for application index `i`, if
// `travellerCount_i` is present, we also read `trav_{i}_{t}_fullName`,
// `trav_{i}_{t}_passportNumber`, `trav_{i}_{t}_ageGroup` for t in
// [0, travellerCount_i), plus per-traveller docs at
// `travdoc_{i}_{t}_{docId}`, creating one VisaApplicant row per traveller
// with its own documents. The public/B2C flow never sends these fields,
// so existing application-level-only submissions are unaffected.
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
  const discountTiers = await prisma.visaDiscountTier.findMany();
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
    const applicantCategory = ((form.get(`applicantCategory_${i}`) as string | null) ?? "").trim() || null;
    const nationality = ((form.get(`nationality_${i}`) as string | null) ?? "").trim() || null;
    const passportExpiry = ((form.get(`passportExpiry_${i}`) as string | null) ?? "").trim() || null;

    if (!visaId || !fullName) {
      throw new VisaSubmissionError(
        `Application ${i + 1}: Full name and visa are required.`
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
    const grossPricePkr = adults * priceAdult + children * priceChild + infants * priceInfant;
    // Group discount: highest tier this application's traveller count
    // qualifies for. Same commission is then computed on the DISCOUNTED
    // total (not gross) — the agent's cut reflects what the customer
    // actually pays, same principle as everywhere else in this codebase.
    const totalTravellers = adults + children + infants;
    const applicableTier = discountTiers
      .filter((t) => totalTravellers >= t.minTravellers)
      .sort((a, b) => b.discountPercent - a.discountPercent)[0];
    const totalPricePkr = applicableTier
      ? Math.round(grossPricePkr * (1 - applicableTier.discountPercent / 100))
      : grossPricePkr;

    // Same snapshot convention as AgentBooking.commission — computed once,
    // now, using whatever rate is current for this agent+visa_services.
    // Null for direct/B2C applications (no agent to owe commission to).
    const commission = opts.agentId
      ? await calculateCommission(opts.agentId, "visa_services", totalPricePkr)
      : null;

    // Validate required docs are present. Two modes: the public/B2C flow
    // attaches documents at the application level (doc_{docId}_{i}); the
    // agent wizard attaches them per-traveller instead
    // (travdoc_{i}_{t}_{docId}) since each traveller needs their own set.
    // Checking only the application-level key here was the bug — it
    // rejected agent submissions that had correctly attached every
    // traveller's documents, because those never populate doc_{docId}_{i}.
    const travellerCountRaw = form.get(`travellerCount_${i}`);
    const travellerCount = travellerCountRaw ? Math.max(0, Number(travellerCountRaw) || 0) : 0;
    const requiredDocs = visa.requiredDocuments.filter((d) => d.isRequired);

    if (travellerCount > 0) {
      for (let t = 0; t < travellerCount; t++) {
        const travFullName = ((form.get(`trav_${i}_${t}_fullName`) as string | null) ?? "").trim();
        if (!travFullName) continue; // empty row, skipped later too — nothing to validate
        for (const doc of requiredDocs) {
          const file = form.get(`travdoc_${i}_${t}_${doc.id}`);
          if (!file || !(file instanceof Blob) || file.size === 0) {
            throw new VisaSubmissionError(
              `Application ${i + 1}, Traveller ${t + 1}: "${doc.name}" is a required document — please attach it.`
            );
          }
        }
      }
    } else {
      for (const doc of requiredDocs) {
        const file = form.get(`doc_${doc.id}_${i}`);
        if (!file || !(file instanceof Blob) || file.size === 0) {
          throw new VisaSubmissionError(`Application ${i + 1}: "${doc.name}" is a required document — please attach it.`);
        }
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
        adults, children, infants,
        applicantCategory, nationality, passportExpiry,
        totalPricePkr, commission,
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

    // Per-traveller applicants + documents — agent wizard only (see
    // module doc comment above). Absent entirely for public submissions.
    for (let t = 0; t < travellerCount; t++) {
      const travFullName = ((form.get(`trav_${i}_${t}_fullName`) as string | null) ?? "").trim();
      if (!travFullName) continue;
      const travPassport = ((form.get(`trav_${i}_${t}_passportNumber`) as string | null) ?? "").trim();
      const ageGroup = ((form.get(`trav_${i}_${t}_ageGroup`) as string | null) ?? "adult").trim();
      const applicantCategory = ((form.get(`trav_${i}_${t}_applicantCategory`) as string | null) ?? "").trim() || null;
      const nationality = ((form.get(`trav_${i}_${t}_nationality`) as string | null) ?? "").trim() || null;
      const passportExpiry = ((form.get(`trav_${i}_${t}_passportExpiry`) as string | null) ?? "").trim() || null;
      const dobRaw = ((form.get(`trav_${i}_${t}_dob`) as string | null) ?? "").trim() || null;
      const dateOfIssueRaw = ((form.get(`trav_${i}_${t}_dateOfIssue`) as string | null) ?? "").trim() || null;
      const issuingCountry = ((form.get(`trav_${i}_${t}_issuingCountry`) as string | null) ?? "").trim() || null;

      const applicant = await prisma.visaApplicant.create({
        data: {
          applicationId: application.id,
          fullName: travFullName,
          passportNumber: travPassport || null,
          ageGroup,
          applicantCategory,
          nationality,
          passportExpiry,
        },
      });
      if (dobRaw || dateOfIssueRaw || issuingCountry) {
        await prisma.$executeRawUnsafe(
          `UPDATE visa_applicants SET dob = $1, date_of_issue = $2, issuing_country = $3 WHERE id = $4`,
          dobRaw ?? null, dateOfIssueRaw ?? null, issuingCountry ?? null, applicant.id
        );
      }

      for (const doc of visa.requiredDocuments) {
        const file = form.get(`travdoc_${i}_${t}_${doc.id}`);
        if (!file || !(file instanceof Blob) || file.size === 0) continue;
        const ct = file.type || "application/pdf";
        if (!ALLOWED_DOC_TYPES.includes(ct)) continue;
        const buf = Buffer.from(await file.arrayBuffer());
        const fileUrl = await uploadToR2({ buffer: buf, contentType: ct, folder: "visas" });
        const fileName = (file as File).name ?? doc.name;
        await prisma.visaApplicationDocument.create({
          data: { appId: application.id, docId: doc.id, applicantId: applicant.id, fileUrl, fileName },
        });
      }
    }

    results.push({ id: application.id, visaId, visa: visa.title, totalPricePkr });
  }

  return { batchRef, applications: results };
}
