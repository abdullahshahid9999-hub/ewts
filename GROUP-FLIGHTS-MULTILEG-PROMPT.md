# Group Flights: Multi-Leg Support + Grouped Table Display (Agent Portal)

## First step
Clone repo (token given separately), read last ~30 lines of PROGRESS.md.

## What the owner wants (exact spec)
On the agent portal's group flights page, flights sharing the same
airline + overall route should be grouped under ONE header:
- Airline logo (left) + route as "LHE → DXB" (center), for that whole group
- Below: a table of numbered "options" (different dates/routings), where
  EACH option can have multiple flight legs (connecting flights) shown as
  sub-rows, e.g.:
  ```
  Option 1: EK-774 LHE→KHI 00:30→01:10, then EK-776 KHI→DXB 01:45→03:10
            07 Jul 2026 · Meal: Yes · Baggage: 25+7kg · Rs. 95,000 · [Book Now]
  Option 2: EK-783 LHE→DXB (direct) 00:05→04:30
            08 Jul 2026 · Meal: Yes · Baggage: 23+7kg · Rs. 88,000 · [Book Now]
  ```
- ONE price + ONE "Book Now" button per OPTION (not per leg) — a connecting
  option with 2 legs is still ONE bookable thing at ONE price.

## Why this needs a schema change (don't try to fake it with the current model)
`GroupFlight` currently represents exactly one leg (one flightNo, one dep/arr
time, one date) — there's no way to attach a second connecting leg to the
same bookable option. Add a `legs` field to represent this, following the
same pattern already used for `Package.itinerary` (JSON array) elsewhere in
this codebase — stay consistent with that convention rather than inventing
a new one.

### Schema change
Add to `GroupFlight`:
```prisma
// Array of { flightNo, from, to, depTime, arrTime } — one entry per leg.
// A direct flight has 1 entry; a connecting flight (e.g. via Karachi) has
// 2+. The GroupFlight row itself still holds ONE price/date/seats — that's
// the bookable "option," legs are just its journey breakdown.
legs Json?
```
Keep existing `route`, `depDate`, `depTime`, `arrTime`, `flightNo` fields
for backward compatibility with existing rows that don't have `legs` set
(fall back to displaying those single fields as a 1-leg option if `legs` is
null — don't break existing data).

Give the owner the exact `ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS
legs JSONB;` (check actual table name via `@@map` in schema first) as plain
text — you cannot run it yourself.

## Admin form (`app/admin/group-flights/page.tsx`)
Add a repeatable "Legs" editor per flight option — same UI pattern as the
Flight Sectors editor already built in the packages admin form (reuse that
component/pattern if it's reusable, don't rewrite from scratch). Each leg
row: Flight No, From (city code), To (city code), Dep Time, Arr Time.
Minimum 1 leg required. `route` field can be auto-derived as
`{firstLeg.from} - {lastLeg.to}` for grouping/display purposes, or kept as
a separate manually-entered field — your call, but it must stay consistent
with how grouping is computed (see below).

## Agent portal display (`app/agent/group-flights/page.tsx` or wherever it lives)
1. Fetch all active group flights.
2. Group them client-side (or via the API) by `(airline, route)` — all
   options for the same airline+route appear under one header.
3. Header per group: airline logo (left-aligned) + route as "LHE → DXB"
   (use an arrow character, center-aligned or next to the logo — match the
   existing brand style, gold accents, card-based layout already used
   elsewhere in the agent portal).
4. Below each header: a table, one row per OPTION (not per leg). If an
   option has multiple legs, show them as stacked sub-lines within that
   same row (flight no + from→to + times for each leg, stacked vertically
   in one cell), with Date/Meal/Baggage/Price/Book Now still one-per-option
   on that row.
5. "Book Now" per option → wire to the existing booking flow
   (`app/api/agent/bookings` POST with `groupFlightId`) — no change needed
   there, just make sure the button passes the right `GroupFlight.id`.

## Rules
- Don't touch pricing/booking logic — only the schema addition (`legs`) and
  the two UI surfaces (admin form, agent display).
- `npx tsc --noEmit` clean before committing.
- Existing single-leg flights (no `legs` set) must keep displaying/working
  exactly as before — this is additive, not a breaking migration.
- Commit in logical chunks: schema, admin form, agent display.

## When done
Update PROGRESS.md, give the ALTER TABLE SQL, commit, push, stop.
