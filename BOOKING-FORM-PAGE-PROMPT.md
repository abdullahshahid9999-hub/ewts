# Split Booking Into Two Pages: Detail Page → Dedicated Booking Form Page

## First step
Clone repo, read `PROGRESS.md` + recent `git log` for context. The room-type
selector + live calculator already exists in `components/PackageBookingWidget.tsx`
and works inline on the detail page. This task is about splitting that into
two pages, matching https://usmantravels.com/packages/.../ exactly (fetch it
yourself for reference if useful — note the URL pattern:
`/booking-form/?package=X&room=Y&adults=N&infants=N&total=Z`).

## What changes

### 1. `components/PackageBookingWidget.tsx` — simplify
Keep the room-type cards + adults/infants calculator + live price breakdown
exactly as-is. **Remove** the inline "Full Name / Phone / Email" form and
the direct submit-to-`/api/bookings` call. Instead, the "Book Now" button
becomes a `Link` (or `router.push`) to:
```
/booking-form?packageId={packageId}&roomType={encodeURIComponent(rt.roomType)}&adults={adults}&infants={infants}
```
Disable/hide the button until a room type is actually selected (same
validation as before — respect `minAdultsRequired`, `maxAdults`,
`maxInfants`).

### 2. `app/booking-form/page.tsx` — new page
Two-column layout, matching the reference's actual structure:
- **Left column — "Personal Information"**: Full Name *, Email *, Phone *,
  CNIC/Passport (optional, useful for travel docs), Special Requests
  (optional textarea)
- **Right column — "Booking Summary"** (read-only recap, NOT editable here
  — if the person wants to change room/adults, they go back to the detail
  page): package name + image thumbnail, selected room type, adults ×
  price, infants × price (if any), total — pulled by re-fetching the
  package from the server using the `packageId` query param (Server
  Component wrapper, or fetch client-side from a small GET endpoint) so the
  price shown is always current/accurate, not just carried in the URL
  unvalidated
- Submit button: "Complete Booking" — POSTs everything (packageId,
  roomType, adults, infants, customerName, email, phone, + any new fields
  like passport/specialRequests if you add them — check whether
  `app/api/bookings/route.ts` needs those two extra optional fields added,
  add them if so, they're harmless additions)
- On success: redirect to `app/booking-confirmation/page.tsx` (new, simple)
  showing the booking reference, a summary, and **explicitly**: "No payment
  has been taken yet. Our team will contact you on WhatsApp/phone within 24
  hours to confirm details and discuss payment." — a WhatsApp button too,
  prefilled with the booking ref + package name, in case they want to reach
  out immediately instead of waiting.
- On error: show the real error message from the API (e.g. validation
  failures), don't swallow it into a generic message.

### 3. Handle direct/invalid access to `/booking-form`
If someone lands on `/booking-form` without valid query params (no
packageId, or a roomType that doesn't exist for that package), show a
friendly message ("Please select a package and room type first") with a
link back to `/umrah` — don't crash or show a blank page.

### 4. Update `components/PackageDetailView.tsx` if needed
Just confirm it still renders `PackageBookingWidget` correctly after the
widget's prop/behavior change — likely no changes needed here since the
widget's external props (packageId, roomTypes) stay the same, only its
internal behavior on submit changes.

## Explicitly out of scope (per owner's plan — payment comes later)
- No payment form, no payment gateway integration, no "pay now" button.
- The booking is captured as `status: "pending"` — that's already correct
  in the existing API, don't change it.

## When done
Type-check clean, test the full flow mentally (detail page → select room →
Book Now → booking-form page loads with correct summary → submit → 
confirmation page), update PROGRESS.md, commit in logical chunks.
