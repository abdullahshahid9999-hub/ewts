# Fix This One Bug — Bounded Task

## Setup (do this first, then move straight to the bug — don't explore beyond this)
```
git clone https://ewadmin:<TOKEN_GIVEN_SEPARATELY_BY_OWNER>@github.com/abdullahshahid9999-hub/ewts.git
```
(Owner: paste the actual current token here before sending this file —
never commit a real token into this repo.)
Read the last ~30 lines of `PROGRESS.md` only, for recent context. Do not
read the whole project history, do not run a general audit.

## Project in one paragraph
Next.js + PostgreSQL (via Prisma) + custom JWT auth travel agency site
(public site, agent portal, admin panel, all in this one repo). A recurring
bug pattern in this project: a Prisma schema field missing `@map("snake_case_name")`
to match the actual DB column, or a database migration that was written but
never actually run — both cause a silent-looking failure (data saves fine,
but reading it back crashes or shows empty) unless the API route has a
try/catch surfacing the real error. If your bug looks like "X was added/
saved but doesn't show up," check for exactly this pattern first before
looking anywhere else — it's been the cause almost every time so far.

## THE BUG (fill this in each time you use this prompt)
**What I did:** [e.g. "Clicked Create Package with an itinerary step filled in"]

**What I expected:** [e.g. "Package should appear in the list below"]

**What actually happened:** [e.g. "Nothing shows, no error message" — or
paste the exact error text if one appeared]

**Where:** [URL/page, e.g. "ewts.onrender.com/admin/packages"]

**Screenshot/error text:** [paste here]

## Rules for fixing it
1. Find the ROOT CAUSE — trace the actual code path (the specific API
   route + the specific Prisma query + the specific frontend fetch), don't
   guess or apply a generic fix.
2. Fix ONLY this bug. Do not refactor, "improve," or touch unrelated code.
3. If the fix requires a database change (new column/table), give the exact
   `ALTER TABLE` / `CREATE TABLE` SQL as plain text in your final message —
   the owner will run it themselves in TablePlus, you cannot run it directly.
4. Run `npx tsc --noEmit` before committing — fix any new errors it shows
   (ignore pre-existing "implicitly has an 'any' type" ones, those are a
   known unrelated issue from Prisma Client not being generated in most dev
   sandboxes).
5. Commit with a clear message explaining the root cause you found, push.
6. **Stop immediately once this one bug is fixed and verified by
   type-check.** Do not go looking for other bugs. Update PROGRESS.md with
   one short paragraph (what broke, why, what you changed) and end your turn.

## When you report back to the owner
End with:
- One sentence: what was actually broken (the root cause, in plain terms)
- Any SQL they need to run (if applicable)
- Confirmation that this is pushed and they should redeploy on Render
