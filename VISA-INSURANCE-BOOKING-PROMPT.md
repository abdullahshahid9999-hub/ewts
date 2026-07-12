# Make Visa + Insurance Bookable Online (B2C), Same as Umrah/Tours/Group-Tickets

## First step
Clone repo, `git log -20` + last ~40 lines of `PROGRESS.md` for context.
Read `app/api/bookings/route.ts` and `components/BookingFormClient.tsx`
first — this reuses that same pattern, doesn't invent a new one.

## The gap
Umrah, Tours, and Group Tickets all have a real "Book Now → fill details
→ confirmation" flow (`Booking` model, `/booking-form`,
`/booking-confirmation`). Visa (`VisaService`) and Insurance
(`InsuranceRate`) only have WhatsApp-enquiry buttons — no real booking
record gets created, so admin has no list of "who requested this visa /
this insurance plan," and neither shows in `/admin/agent-bookings` or any
finance figure. Owner wants both to work the same way as the others.

## What to build

### 1. Schema — extend `Booking`, don't create new tables
`Booking` already has `packageId`/`groupFlightId` as alternative
references (only one set per row) with a `service` string field. Add two
more nullable reference fields the same way:
- `visaServiceId String? @map("visa_service_id")` + relation to
  `VisaService`
- `insuranceRateId String? @map("insurance_rate_id")` + relation to
  `InsuranceRate`
A `Booking` row now has exactly one of `packageId` / `groupFlightId` /
`visaServiceId` / `insuranceRateId` set — same "which type is this" logic
as the existing comment above `groupFlightId` describes.

**Visa-specific fields needed on submission** — ask the owner if unclear,
but reasonable defaults: applicant full name (can reuse `customerName`),
passport number (`passport` field already exists), travel date, number of
applicants (reuse `adults`, no children/infants concept for visa —
validate those are 0/unused for this type).

**Insurance-specific fields needed**: which `InsuranceRate` (i.e. which
plan+company+price), traveller count (`adults`, again no children/infants
distinction needed), travel start/end dates if the plan is duration-based
— check whether `InsuranceRate` already has duration info before adding
new fields for it.

### 2. `/api/bookings` — extend, don't duplicate
Same route, new branch: if `visaServiceId` or `insuranceRateId` is
present instead of `packageId`, validate against that model instead
(`VisaService.status === 'active'`, `InsuranceRate` exists), skip the
room-type/price-per-person logic entirely (visa/insurance pricing is a
flat rate from the row itself, not computed from adults×rate the same
way — reuse the price field already on `VisaService`/`InsuranceRate`
directly). Keep the existing package/group-flight branches untouched.

### 3. UI — "Book Now" buttons + a booking form per type
On `/visa` and `/insurance`, each card's "Enquire" button becomes "Book
Now" (WhatsApp fallback stays for cards where that makes more sense, your
judgment) linking to something like
`/booking-form?visaServiceId=X` or `/booking-form?insuranceRateId=X`.
Extend `app/booking-form/page.tsx`'s Server Component to handle these two
new query-param shapes (fetch the right model, build the right summary
props) instead of only `packageId`/`roomType`. `BookingFormClient.tsx`
probably needs a couple of conditional fields (e.g. no room-type row for
visa, no children/infants counters) — check what actually changes rather
than assuming the whole form needs a rewrite.

### 4. Admin visibility
`/admin` needs *some* way to see these new booking types — either extend
an existing bookings list page or confirm one already generically lists
`Booking` rows regardless of type (check first, there may already be a
"Direct Bookings" admin page from a recent session — read
`app/admin/direct-bookings` if it exists before building a new one).

## Don't do
- Don't touch the existing Umrah/Tours/Group-ticket booking branches in
  `/api/bookings` — this is additive only.
- Don't invent visa/insurance-specific fields beyond what's listed above
  without checking with the owner first if something's genuinely unclear
  — same "don't guess business logic" rule as every other prompt in this
  project.
- No payment integration — same as everywhere else, still out of scope.

## When done
Type-check clean, update PROGRESS.md with any new migration SQL needed
(same pattern as every other session — list the exact `ALTER TABLE`
statements, don't assume the sandbox can run them), commit in logical
chunks (schema first, then API, then UI, then admin visibility).
