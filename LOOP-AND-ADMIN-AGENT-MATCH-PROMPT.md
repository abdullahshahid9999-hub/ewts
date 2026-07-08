# Self-Verify Loop + Match Admin Panel & Agent Portal Exactly

## First step, always (whether this is a continuing session or a brand new one)
Clone the repo if you haven't already:
```
git clone https://<token>@github.com/abdullahshahid9999-hub/ewts.git
```
Then **read `PROGRESS.md` in the repo root and skim `git log --oneline -30`**
before doing anything else. That file + commit history is the full project
memory — everything below assumes you've done this, regardless of whether
you're a continuing session or a fresh one with no prior conversation.

## Part A — Verification status (already checked, don't redo)
A full `npx tsc --noEmit` was just run against the whole repo. Result: only
15 errors, and every single one is the expected "Prisma client not
generated in this sandbox" fallout (implicit-`any` on Prisma query result
callbacks — e.g. `app/umrah/page.tsx`, `app/insurance/page.tsx`,
`app/api/admin/finance/route.ts`). No other type errors exist anywhere in
the codebase right now. This is a clean baseline — if a future `tsc` run
shows NEW errors beyond this known list, that's a real regression, fix it
immediately before continuing other work.

## Part B — Why the public pages weren't "sara sahi" (all correct) before
Some earlier page rebuilds (visa, blog) noted in their commit messages and
PROGRESS.md that the live site's actual listing markup is client-rendered
JavaScript, so a plain fetch couldn't extract it — those pages were rebuilt
based on the surrounding static HTML (hero, headers, structure) but the
dynamic listing sections were educated approximations, not extracted copy.
**This is a known gap, not something to silently accept as "done."**

### Required: close this gap properly
For any page where PROGRESS.md says "client-rendered, not extractable via
fetch" (currently: visa listing, blog listing), use a **browser-based**
fetch instead of a plain HTTP fetch — i.e. render the JS and read the
resulting DOM (a headless-browser-capable tool, or ask the owner to paste
the rendered page's HTML/screenshot if no such tool is available). Don't
leave these as approximations if a better tool exists to get the real
content. If truly no way to extract it, say so explicitly in PROGRESS.md
with the specific reason (not a generic "couldn't fetch") and what was
used as the fallback basis instead.

## Part C — The ongoing self-check loop (apply this from now on, always)
Before marking ANY page or feature "done," run this checklist yourself —
don't wait for the owner to find problems:

1. Re-fetch the live equivalent page (if one exists) and re-read your own
   code side by side, section by section. Did you miss anything on either
   side?
2. Run `npx tsc --noEmit` — confirm no NEW errors beyond the known 15
   Prisma-fallout ones listed in Part A.
3. Check every WhatsApp CTA's prefilled message text — does it match the
   live site's actual message for that button/context, not a generic one?
4. Check empty-states — does every DB-driven section have a graceful empty
   state, not a blank gap, when there's no data yet?
5. Re-read your own commit message once more — if it contains a hedge like
   "should probably," "likely," or "I think," that's a signal you didn't
   actually verify something. Go verify it or state the uncertainty
   explicitly in PROGRESS.md instead of shipping it silently.
6. Only after all 5 pass, move to the next item and update PROGRESS.md.

Do this loop for every remaining page too (finish Part B's gap first, then
continue any pages not yet matched, if any remain — check PROGRESS.md's
own checklist for what's left).

## Part D — Match Admin Panel & Agent Portal to their REAL reference design
The admin panel and agent portal don't have a live "eastwestpk.com/admin"
equivalent to fetch — but they DO have a real, already-polished reference:
the **legacy production system's actual admin/agent HTML**, which was
specifically redesigned earlier this project (brightened, given proper
shadows/elevation, a highlighted gold balance panel, gradient sidebar) —
not the original flat version, the IMPROVED version. That improved design
is the target, not something to approximate generically.

Reference files (ask the owner for read access to the `eastwestpk` repo —
NOT `ewts` — if you don't already have it; it's the legacy production repo):
- `admin/dashboard.html` — admin panel's actual layout, sidebar, card
  styles, table conventions, modal patterns, color usage
- `agent/dashboard.html` — agent portal's actual layout: dark navy gradient
  sidebar, the highlighted gold-glow balance panel (this is the single most
  visually distinct element — the balance figure has its own bordered
  gradient panel, not just another sidebar row), soft-shadow stat cards
  with hover lift, category+status tab-bar pattern above tables
- `agent/login.html` — login page card style, OTP input boxes, focus-glow
  states

### What to actually do
1. Fetch/read those three files (or ask the owner to paste them if no repo
   access) section by section, the same rigorous way the public pages were
   matched to the live site.
2. Compare against the current `app/admin/*` and `app/agent/*` pages in
   this repo.
3. Rewrite the CSS/Tailwind classes to match: sidebar gradient, card
   shadows (`box-shadow: 0 1px 2px rgba(20,20,43,0.03), 0 8px 24px -8px
   rgba(20,20,43,0.08)` was the exact shadow value used — reuse it), the
   gold-glow balance panel treatment, button hover-lift behavior on primary
   actions, the tab-bar-with-count-badges pattern for the bookings filters.
4. Functionality (routes, auth, data) is already correct and shouldn't
   change — this pass is specifically about visual/CSS fidelity to the
   already-approved reference design, the same way the public site pass was
   about content fidelity to the live site.

## When done
Update PROGRESS.md: one checklist for "public pages — content-matched,"
one for "public pages — client-rendered-gap closed," one for "admin/agent —
visually matched to reference." Be specific about what's verified vs.
still approximate, per Part C's rule against hedged/vague status claims.
