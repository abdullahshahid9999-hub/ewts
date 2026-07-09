# Build Package Detail Page — Room-Type Selector + Live Booking Calculator

## First step
Clone the repo, read `PROGRESS.md` and recent `git log` for context if this
is a fresh session. The backend/schema for this feature is ALREADY DONE —
don't redo it, just read it: `prisma/schema.prisma` (Package/PackageRoomType/
Booking models), `app/api/bookings/route.ts` (booking submission, already
validates and recomputes price server-side).

## Reference
This is modeled on https://usmantravels.com/packages/umrah-december-2026-4/
— fetch that URL yourself to see the actual layout/interaction if useful,
but match OUR brand system (gold/navy/ivory, Cormorant Garamond + Plus
Jakarta Sans), not their visual style.

## What to build

### 1. `app/[category]/[slug]/page.tsx` (or `app/umrah/[slug]/page.tsx` +
   `app/tours/[slug]/page.tsx` if easier) — the package detail page
Server Component, fetches the package by slug via Prisma including its
`roomTypes`. Sections, in order:
- Header: package name, departure city, tier badge (SILVER/GOLD — style as
  a small colored pill), duration
- Image (use `pkg.imageUrl`, fall back to a styled placeholder if none)
- Package Description: two columns — "What's Included" (checkmark list,
  parse `pkg.includes` by splitting on newlines) and "Not Included" (x-mark
  list, same for `pkg.excludes`)
- Itinerary: numbered steps from `pkg.itinerary` (JSON array of
  `{title, details: string[], images?: string[]}`) — render as a vertical
  numbered timeline, each step showing title, bullet details, and images if
  present. Handle `itinerary` being null/empty gracefully (skip the section).
- Room Type Selector + Live Calculator (client component — see below)

### 2. `components/PackageBookingWidget.tsx` — Client Component
This is the interactive core, props: `packageId`, `roomTypes` (from the
package's `roomTypes` relation), `packageName`.

**Room type cards**: one per `PackageRoomType`, showing room type name,
price per person (`Rs. X`), max adults/infants, and — if
`minAdultsRequired` is set — a note like "Requires at least N adults."
Clicking a card selects it (only one selected at a time, matches the
reference's radio-button-like card selection).

**Calculator** (updates live as inputs change):
- Adults counter (+/- buttons), clamped to the selected room type's
  `maxAdults`, and if `minAdultsRequired` is set, show a validation message
  if below it (don't hard-block typing, but disable submit until valid)
- Infants counter (+/- buttons), clamped to `maxInfants`
- Live total: `adults * pricePerPersonPkr` (infants currently free — no
  infant rate exists in the schema yet; if the owner wants one, that's a
  schema addition, don't invent a number)
- Show the breakdown like the reference: "Adults (2 × Rs. 45,000) = Rs.
  90,000", "Total: Rs. 90,000"

**Booking form** (appears once a room type is selected — can be inline
below the calculator or a modal, your call, just keep it uncluttered):
- Full Name *, Phone *, Email (optional)
- "Book Now" button — POSTs to `/api/bookings` with `{packageId, roomType,
  adults, infants, customerName, phone, email}`
- On success: show a clear confirmation ("Booking request received! Ref:
  BK-XXXX. We'll contact you on WhatsApp/phone to confirm and discuss
  payment.") — **be explicit that no payment has been taken yet**, this is
  a booking request only, matching the owner's stated plan (payment
  pipeline comes later).
- On error: show the server's actual error message (e.g. "Maximum 2 adults
  for Double Room"), don't swallow it into a generic message.
- Also show a WhatsApp fallback button next to "Book Now" using the
  existing `waLink()` helper, prefilled with the package name + room type +
  adults/infants, for anyone who'd rather message directly.

### 3. Update package listing cards to link to the detail page
Wherever packages are currently listed (home page Featured Packages,
`/umrah`, `/tours`), the "Enquire →" links should become "View Details →"
links pointing to `/{category}/{slug}` — but **only if the package has a
slug set** (older packages created before this feature won't have one yet
until admin edits them). If no slug, keep the current WhatsApp-enquiry
behavior as a fallback so nothing breaks for existing packages.

### 4. Admin panel: extend the packages form
`app/admin/packages/page.tsx` needs new fields: slug (text input, or
auto-generate from name with a "regenerate" button), departure city, tier,
and — the bigger piece — a room-type manager (add/edit/delete
`PackageRoomType` rows for the package being edited: room type name, price
per person, max adults, max infants, min adults required). Also an
itinerary editor — this can be simple: a repeatable list of
{title, details (textarea, one bullet per line), image URLs (comma-
separated or reuse the existing upload pattern)} — doesn't need to be
fancy, just functional. Follow the existing `adp-*` styling conventions
already used elsewhere in the admin panel for consistency.

### 5. New admin API routes needed
- `app/api/admin/packages/[id]/room-types/route.ts` — POST (create),
  matching pattern of other admin routes (requireAdmin, validate, Prisma
  create)
- `app/api/admin/packages/[id]/room-types/[roomTypeId]/route.ts` — PATCH/
  DELETE
- Package update route needs to accept slug/departureCity/tier/itinerary
  now too — check `app/api/admin/packages/[id]/route.ts` and extend it

## Don't do
- Don't build any payment integration — explicitly out of scope per the
  owner, "pipeline baad mein jorenge" (payment pipeline added later).
- Don't invent an infant pricing rate — infants are currently free in the
  calculation since no rate field exists for them; flag this as a question
  for the owner in PROGRESS.md rather than guessing a number.
- Don't trust client-side price calculations for anything that touches the
  database — the booking API route already recomputes server-side, keep it
  that way.

## When done
Type-check clean, update PROGRESS.md, commit in logical chunks (schema use
first, then detail page, then booking widget, then admin form, then admin
API routes) rather than one giant commit.
