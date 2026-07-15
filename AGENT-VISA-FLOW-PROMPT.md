# Agent Portal: Visa Application Flow with Per-Traveller Documents

## First step
Clone repo (token given separately), read last ~30 lines of PROGRESS.md.

## Context — what already exists (reuse, don't rebuild)
The public site already has a full visa apply flow:
- `app/visa/[id]/page.tsx` + `app/visa/[id]/VisaApplyFlow.tsx` (413 lines) —
  shows visa details, takes ONE lead applicant's info + adults/children/
  infants counts, uploads documents at the APPLICATION level (not per
  person), reviews, submits to `/api/visa-applications`.
- Schema: `VisaService` (the visa listing), `VisaRequiredDocument` (what
  docs are needed per visa, admin-configured), `VisaApplication` (one
  submission), `VisaApplicationDocument` (uploaded files, currently linked
  to the application only, not to a specific traveller).
- Admin side: `app/admin/visa-applications/page.tsx` reviews submissions.

## The gap (why this needs a schema change, not just a copy-paste)
The owner wants agent bookings to collect one full document set per
traveller — e.g. a family of 4 each uploads their own passport scan, not
one shared upload for the whole application. The current schema only
supports application-level documents. Add traveller-level tracking:

```prisma
// One row per traveller within a VisaApplication (owner wants per-person
// documents, not just a headcount — this didn't exist before).
model VisaApplicant {
  id             String   @id @default(uuid())
  applicationId  String   @map("application_id")
  fullName       String   @map("full_name")
  passportNumber String?  @map("passport_number")
  ageGroup       String   @default("adult") @map("age_group") // "adult" | "child" | "infant"
  createdAt      DateTime @default(now()) @map("created_at")

  application VisaApplication          @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  documents   VisaApplicationDocument[]

  @@map("visa_applicants")
}
```
Add `applicantId String? @map("applicant_id")` + relation to
`VisaApplicationDocument` (nullable — keep backward compatible with the
existing application-level-only flow on the public site, which you are
NOT required to change). Give the owner the exact CREATE TABLE / ALTER
TABLE SQL as plain text — you cannot run it yourself.

## What to build: `app/agent/visa/[id]/page.tsx` (new, agent-only)
A step-by-step wizard, agent-authenticated (reuse AgentGuard/AgentShell
same as other agent pages). Steps:

1. Visa details — same info shown on the public visa detail page
   (country, type, price, validity, processing time, requirements) —
   reuse/adapt that display, don't redesign it.
2. Selected visa summary — reconfirm what was picked (title, price per
   person) before moving on.
3. Traveller count — how many adults/children/infants.
4. Per-traveller details + documents — for EACH traveller (based on the
   count from step 3): full name, passport number, then a document upload
   section listing every VisaRequiredDocument for this visa (name +
   description as a label, file picker per requirement) — multiple files
   allowed per traveller if a requirement allows it, or at minimum one
   file per required-document row. Compress images client-side before
   upload (reuse the existing image-compression pattern already used
   elsewhere in the admin panel) and upload via R2 (reuse uploadToR2
   pattern via a route handler — don't expose R2 credentials to the
   client).
5. Review Application — show every traveller's entered info + which
   documents were attached (checkmarks), and a price breakdown.
6. Submit — creates one VisaApplication (batchRef groups all travellers
   together) + one VisaApplicant row per traveller + their documents, via
   a new POST /api/agent/visa-applications route (agent-authenticated,
   server-side price computation from VisaService's current price —
   don't trust client-sent totals).
7. Confirmation — short bill summary: visa name, traveller count
   breakdown, total price, application reference, and a clear "no payment
   collected yet, admin will review" message (matching the tone already
   used on the package booking confirmation page — check
   app/booking-confirmation/page.tsx for that pattern).

## Rules
- Server-side price computation only, same as every other booking flow in
  this project — never trust a client-sent total.
- Every document upload goes through a server route using R2 credentials,
  never client-direct.
- Reuse existing components/patterns (AgentShell, image compression, R2
  upload route pattern, confirmation-page tone) rather than reinventing —
  this codebase has all of these already, this task is about assembling
  them into a new flow, not building primitives from scratch.
- npx tsc --noEmit clean before each commit.
- Commit in chunks: schema, agent visa detail+wizard page, submission API
  route, confirmation display.

## When done
Update PROGRESS.md, give the required SQL, commit, push, stop — don't
touch the public-facing visa flow or the admin visa-applications review
page unless directly required to display the new per-traveller data (if
you do touch the admin review page to show per-traveller docs, keep that
change minimal and clearly separate in its own commit).
