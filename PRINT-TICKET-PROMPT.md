# Agent Portal: "Print Ticket" — Exact Reference Layout

## First step
Clone repo (token given separately), read last ~30 lines of PROGRESS.md.

## The reference (owner will paste this exact image again if needed)
A printable ticket document, top to bottom:
1. **Top bar** (bordered box): Agency logo (left) + "Booking Reference: XXXXXX"
   + "Ticket Number # XXX-XXXXXXX-XXX" (center-right, stacked) + barcode
   image (right).
2. **Second row**: Airline logo (left) + "Booked By: [Agency Name]" +
   "Contact Number: [phone]" (center) + a vertical divider + "Reserved On:
   [date time]" / "Ticketed On: [date time]" (right column).
3. **"Passenger Name" table**: columns SR, Name, Passport, P-Expiry, DOB —
   one row per traveller.
4. **"Travel Itinerary" table**: columns Flight No., From, To, Dep,
   Arrival, Meal, Baggage, Status (Status is a pill badge, green when
   confirmed) — one row per flight LEG (a return trip is 2 rows, a
   connecting trip is more).
5. **"Term & Conditions"** section: numbered list, plain text (owner can
   configure the exact wording later — use sensible placeholder text
   matching a normal airline ticket for now, e.g. non-refundable, 4hr
   check-in, visa responsibility).

## Business logic — 3 distinct states (this is the important part)
The SAME print layout is used in all 3 cases, only specific fields change:

1. **Booking not yet issued** (`AgentBooking.status` is `pending`,
   `confirmed`, or `issue_requested` — anything before `issued`): "Print
   Ticket" still opens this exact layout, but:
   - Ticket Number shows literally empty/blank (not a placeholder string —
     the field is genuinely null at this point, nothing has been ticketed).
   - The Status pill in the itinerary table reads **"Not Confirmed"**
     (not green — use a neutral/amber color).
2. **Booking issued** (`status === 'issued'`): full real data — actual
   ticket number (admin enters this at issuance time, see schema below),
   Status pill reads **"Confirmed"** (green), matching the reference image
   exactly.
3. **"Print Invoice" / "Print without fare"** (a separate button next to
   Print Ticket): for now, if the booking isn't issued yet, this just shows
   a simple message: **"Ticket not issued yet."** — don't build a full
   invoice layout yet, the owner will send that reference separately later.
   Leave a clear `// TODO: replace with real invoice layout once owner
   provides reference` comment where this is stubbed.

## Per-agent branding (this is NOT one hardcoded "Neo Fly Travel Tours")
This platform has multiple agents, each effectively their own sub-agency.
The printed ticket must show the **booking's own agent's** branding, not a
fixed one:
- Logo: `Agent.logoUrl` (already exists on the schema)
- "Booked By": `Agent.fullName`
- "Contact Number": `Agent.phone`
- Airline logo: pull from the `GroupFlight.airlineLogoUrl` this booking is
  for (already exists).

## Schema additions needed
```prisma
// On AgentBooking — set by admin at the moment of actual issuance, stays
// null before that (this is what makes "Not Confirmed" vs "Confirmed"
// work correctly rather than faking it client-side).
ticketNumber String? @map("ticket_number")
```
The `travellers Json?` field already exists
(`[{fullName, passportNo, cnic}]`) but is missing 2 fields this layout
needs — extend the shape (JSON, no migration needed, just update
wherever travellers are captured/typed) to
`[{fullName, passportNo, passportExpiry, dob, cnic}]`. Make the two new
fields optional so existing bookings without them don't break — display
"—" for missing values on the printed ticket rather than crashing.

Give the owner the exact `ALTER TABLE agent_bookings ADD COLUMN IF NOT
EXISTS ticket_number TEXT;` as plain text — you cannot run it yourself.

## Where admin sets the ticket number
Find wherever admin marks a booking as issued (the `status = 'issued'`
transition, likely in `app/admin/agent-bookings/page.tsx` or its API
route) and add a "Ticket Number" input there, required before an admin can
mark a group-ticket booking as issued. Store it in the new
`ticketNumber` field.

## Flight leg data for the Travel Itinerary table
This depends on the group-flights multi-leg feature (schema field
`GroupFlight.legs`, JSON array of `{flightNo, from, to, depTime, arrTime}`)
— check PROGRESS.md/git log for whether that was already built. If yes,
use `legs` for the itinerary table rows (fall back to the flight's single
route/time fields if `legs` is null, same backward-compat approach as that
feature's own spec). If that feature wasn't built yet, use the single-leg
fields for now and note in PROGRESS.md that the itinerary table will only
show one row until multi-leg support lands.

## Build
- New component: `components/PrintTicket.tsx` — takes an `AgentBooking`
  (with agent + groupFlight included) as props, renders the layout above.
  Use a print-friendly approach: either a dedicated `/agent/bookings/[id]/
  print` route styled for print media (`@media print` CSS), or a modal/new
  tab with a "Print" button calling `window.print()` — match whatever
  pattern (if any) is already used elsewhere in this codebase for
  print/export (check `app/api/admin/direct-bookings/export/route.ts` for
  precedent, though that's Excel export not print HTML, so likely no
  existing pattern — your call on the cleanest approach).
- Add "Print Ticket" and "Print Invoice" buttons on the agent's booking
  detail/list view for group-ticket bookings.
- Barcode: a simple generated barcode image is fine (e.g. a lightweight
  client-side barcode-rendering approach) — encode the booking reference.
  Don't overthink this, a visually-correct-looking barcode is enough, it
  doesn't need to be scannable by real hardware.

## Rules
- Reuse existing design tokens (gold/navy/ivory, Cormorant Garamond + Plus
  Jakarta Sans) for anything NOT inside the print layout itself — the
  print layout should match the reference image's own style (clean,
  minimal, green/white in the reference, but use the AGENT'S actual airline
  logos as shown — don't force brand colors onto the printed ticket itself,
  airline tickets conventionally use the airline/agency's own branding).
- `npx tsc --noEmit` clean before committing.
- Commit in chunks: schema, PrintTicket component, wiring into agent
  bookings UI, admin ticket-number-entry-at-issuance.

## When done
Update PROGRESS.md, give the SQL, commit, push, stop. If anything in this
spec is ambiguous when you get to it, make the most reasonable choice and
note it in PROGRESS.md rather than guessing silently — the owner is
sending a "Print Invoice" reference separately, so don't build that part
speculatively.
