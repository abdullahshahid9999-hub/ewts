# Small Task (bounded — do NOT expand scope)

## First step
Clone repo, read `PROGRESS.md` (just the last ~30 lines) for recent context.
Do not re-read the whole file history or re-audit the whole project — this
task is deliberately small.

## Do exactly these 3 things, nothing else

### 1. Confirm the package detail page works
Open `/umrah/[slug]` for one existing package (check `PROGRESS.md` or the
admin packages list for a real slug) in your own reasoning/by reading the
code path — trace `app/umrah/[slug]/page.tsx` → `PackageDetailView` →
`PackageBookingWidget`, confirm the Prisma query includes `roomTypes` and
every field used in the component actually exists on the query result type.
If you find a mismatch, fix it. If it already looks correct, say so and
stop — don't keep searching for problems that aren't there.

### 2. Confirm `/booking-form` reads query params correctly
Read `app/booking-form/page.tsx`. Confirm it re-fetches the package+room
type from the database (not trusting the URL's price param) and handles a
missing/invalid `packageId` gracefully. Fix only if actually broken.

### 3. Update PROGRESS.md
One short paragraph: what you checked, what (if anything) you fixed. Commit
and push.

## Hard stop
Do not run a broader audit, do not touch other pages, do not refactor
anything not directly required by the 3 items above. If you finish these 3
items with time/context to spare, STOP and say "done, ready for next task"
rather than finding more work — the owner will hand you the next small
task themselves.
