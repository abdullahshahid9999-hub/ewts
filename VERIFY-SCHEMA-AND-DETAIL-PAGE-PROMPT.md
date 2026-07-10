# Quick Task: Verify Schema-DB Sync + Package Detail Page Display

## First step
Clone repo, read `PROGRESS.md` + `git log -20` for context.

## What just got fixed (don't redo)
- `PackageRoomType.roomType` was missing `@map("room_type")` — fixed.
- `agent_commission_rates` table was missing entirely — owner created it via SQL.
- `package_room_types.price_per_infant_pkr` column was missing — owner added it via SQL.
- Admin list GET routes (packages, agents) now surface real errors instead of
  silently showing an empty list on DB failure.

## Your task
1. **Run a full schema-vs-database audit**: for every model in
   `prisma/schema.prisma`, confirm every `@map(...)` target column and every
   un-mapped field name actually exists in the live database (owner has
   psql/TablePlus access — ask them to run a verification query if you can't
   connect directly, same pattern as the recent `roomType` bug: one missing
   `@map` or one un-run `ALTER TABLE` breaks that entire feature silently).
   Fix any other mapping bugs you find the same way (add `@map`, or give the
   owner the matching `ALTER TABLE` SQL).

2. **Verify the package detail page actually displays admin-entered data
   end to end**: create a test package in `/admin/packages` with itinerary
   steps + room types filled in, then load its `/umrah/[slug]` (or `/tours/`)
   page and confirm: itinerary renders, room type cards show correct
   prices/limits, the booking calculator computes correctly, and clicking
   "Book Now" correctly carries state into `/booking-form`. If anything
   doesn't show up despite being saved in the admin form, that's the same
   class of bug as the roomType issue — trace it (check the Prisma query
   powering that page for a missing `include`/wrong field name) rather than
   guessing.

3. Apply the same "surface real errors, don't silently show empty" pattern
   (from the packages/agents fix) to any other admin list page that doesn't
   have it yet, if you find one failing silently.

## When done
Update PROGRESS.md with what you audited and fixed. Keep going through
remaining project items per PROGRESS.md's own list after this — don't stop
to ask, only stop if genuinely blocked (missing credential/decision).
