# Match EVERY Remaining Page to eastwestpk.com — Exact, Not Approximate

## Why this exists
The home page was already redone by fetching the real live site
(https://www.eastwestpk.com/) and copying its actual structure/copy/colors
section by section — NOT by guessing or building something "inspired by"
it. The owner was unhappy with earlier pages because they were generic
approximations instead of true matches. Do the exact same rigorous process
for every page below. Take as long as you need and use as many tool calls
as necessary — thoroughness matters more than speed here.

## Required process for EACH page (don't skip steps)
1. **Fetch the real live page** — use your web browsing/fetch tool on the
   actual URL (search for it first if your fetch tool requires a prior
   search result, e.g. search "eastwestpk.com/umrah" then fetch the result).
2. **Extract everything**: every section in order, every heading, every
   paragraph of copy word-for-word, every stat/number, every button label
   and where it links to (WhatsApp text varies per page — capture the exact
   prefilled message text), every list item, every FAQ Q&A if present,
   image captions/alt text, color scheme per section (the live site alternates
   dark-navy sections and light ivory sections — note which is which per
   page).
3. **Compare against the current Next.js page** at the matching route in
   this repo (`app/umrah/page.tsx`, `app/visa/page.tsx`, etc.) — note every
   place it's generic/wrong/missing content.
4. **Rewrite the page** to match section-for-section, copy word-for-word,
   using the existing design tokens (already correct — gold `#D4A843`,
   navy `#071120`, Cormorant Garamond + Plus Jakarta Sans, see `app/globals.css`)
   and the same component patterns already established (`HeroImg` pattern
   from `app/page.tsx`, card styles, etc.). Reuse `Navbar`/`Footer` as-is —
   those are already fixed to match.
5. **Where a section pulls from the database** (e.g. package listings,
   blog posts) and the database is currently empty, use the SAME empty-state
   pattern as the home page ("No X available right now. WhatsApp us for
   custom quotes!" + WhatsApp button) rather than leaving a blank gap.
6. **Type-check** (`npx tsc --noEmit`) after each page — only the
   pre-existing Prisma-not-generated implicit-`any` errors are expected/
   acceptable; anything else is a real bug, fix it.
7. Commit each page individually with a clear message, push, move to the
   next page. Don't batch all pages into one giant commit — if something
   breaks, individual commits make it possible to find which page did it.

## Pages to do, in this order
1. `/about` — About Us page
2. `/contact` — Contact page
3. `/umrah` — Umrah packages listing
4. `/tours` — Tour packages listing
5. `/visa` — Visa services listing
6. `/group-tickets` — Group flight ticket listing
7. `/insurance` — Insurance comparison page
8. `/blog` — Blog listing page
9. `/blog/[slug]` — Individual blog post template (fetch one real blog post
   from the live site as a reference for the template structure, since exact
   posts will vary)

## Images
Same situation as the home page: the live site's actual photos aren't
available to you directly. Check `public/images/` in this repo first — a
few images (`makarem_1.jpeg`, `makarem_2.jpeg`, `pullman_1.jpeg`, `logo.jpg`)
were already pulled from the legacy repo and added there for the home page.
For pages needing OTHER images not already present, use a styled
gradient/placeholder block with the correct caption text (matching what the
live site's alt text / caption says) rather than blocking on missing assets
— note in `PROGRESS.md` which images are still needed so the owner can
supply them later.

## What NOT to do
- Don't invent content that isn't on the live site "because it seems right."
  If a section's exact copy isn't visible in what you fetched, say so in
  `PROGRESS.md` rather than making something up.
- Don't change the design tokens (colors/fonts) — those are already correct,
  this is about content/structure matching, not re-theming.
- Don't skip the empty-state handling for DB-driven sections — an empty
  page with no explanation looks broken; the live site's actual empty-state
  message (or the home page's pattern, if a given page has none) should be
  used instead.

## When done
Update `PROGRESS.md` with a clear "pages matched" checklist and flag
anything you couldn't verify (missing images, content you couldn't find on
the live site, etc.) as a specific, honest note — not a vague "mostly done."
