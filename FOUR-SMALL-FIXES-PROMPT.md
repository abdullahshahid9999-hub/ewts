# 4 Small Fixes — Bounded Task

## First step
Clone repo (token given separately), read last ~30 lines of PROGRESS.md
only. Fix exactly these 4 items, nothing else, then stop.

## 1. Umrah packages: hide Departure/Arrival fields
In `app/admin/packages/page.tsx`, the package form shows Departure/Arrival
date fields regardless of category. When `category === 'umrah'` is
selected, hide (or don't require) those two fields — they don't apply the
same way to Umrah packages as they might to Tours. Keep them for `tours`.
Simple conditional render, not a schema change.

## 2. Bank details: add a logo option
Find wherever bank account details are managed (for payment slip /
transfer instructions — check `app/admin/payment-slips/page.tsx` and
related API routes; if there's no dedicated "bank accounts" admin section
yet, check PROGRESS.md for whether this exists at all before assuming).
Add a logo upload field for each bank entry, same pattern as
`insurance_companies.logo_url` (upload to R2, store the URL). If no bank-
accounts table/feature exists yet at all, stop and note that in
PROGRESS.md rather than inventing the whole feature — ask the owner to
confirm scope first.

## 3. Agent Bookings: each booking must show as its own separate row
On `app/admin/agent-bookings/page.tsx`, the owner reports bookings aren't
showing individually — investigate whether the list is being deduplicated,
grouped, or overwritten somewhere (check the `.map()` key prop — a wrong
`key` like using `agentId` instead of the booking's own `id` would cause
React to silently collapse/overwrite rows with the same key). Fix the
actual root cause, don't just re-render generically.

## 4. BUG: opening one tour/package shows bookings from a different category
Owner's exact report: "I open World Tour and it shows Umrah or Group Tour
bookings instead." This means wherever bookings are filtered/displayed per
package (likely on a package detail view within admin, or an agent-
bookings filter tied to a specific package), the filter isn't scoping
correctly — it's probably filtering by category string alone without also
matching the specific `packageId`, so ANY booking with a loosely-matching
category shows up regardless of which actual package/tour it belongs to.
Find that query, add the missing `packageId` (or equivalent specific ID)
condition to the WHERE clause. This is the most important item — a data
correctness bug, not cosmetic.

## Rules
- Root-cause each one, don't paper over with generic fixes.
- `npx tsc --noEmit` clean before committing.
- Any DB change → give plain-text SQL for the owner to run themselves.
- Commit each of the 4 separately (4 commits, not 1), clear messages.
- **Stop after these 4.** Update PROGRESS.md briefly, don't look for more.
