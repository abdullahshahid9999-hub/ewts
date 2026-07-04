# EWTS Rebuild — Continuation Brief (hand this to a new AI session)

## How to work through this brief (read this first)
The person giving you this prompt is only giving you **this one message** —
they are not going to keep re-prompting you step by step. Treat this as a
standing goal, not a single task:

1. Work through the "Remaining work" section **in order, one item at a time**.
2. For each item: build it, then verify it (run the build/typecheck, re-read
   your own code for the security rules below), fix anything broken, commit
   with a clear message, and push.
3. When one numbered item is genuinely done and verified, **immediately move
   to the next one** — don't stop and wait to be told "continue." Keep going
   until the whole "Remaining work" list is complete or you hit something you
   truly cannot proceed past.
4. Only stop and ask the person a question when you are **actually blocked**
   — e.g. you need a credential/secret you don't have, or a genuine business
   decision that isn't answered anywhere in this file or the four spec files
   in the repo root. Don't stop to ask permission for things this brief
   already answers, and don't stop just to report minor progress.
5. After each meaningful chunk of work, leave a short status note as a commit
   message and/or a `PROGRESS.md` file in the repo root (create it if it
   doesn't exist) listing what's done, what's next, and anything you got
   stuck on — so the human (or the next AI session, if this one runs out of
   room) can pick up the thread without re-reading all your commits.
6. When truly everything in "Remaining work" is complete and the build is
   green, say so clearly and stop — don't invent extra scope beyond what's
   specified here and in the four spec files.

## What this project is
Full rewrite of **East & West Travel Services** (eastwestpk.com) — a Faisalabad,
Pakistan travel agency (Umrah, tours, group flights, visa, insurance) — from a
legacy vanilla HTML/JS + Supabase site into a modern **Next.js + PostgreSQL +
Prisma** monorepo containing three apps in one: public website, agent portal,
admin panel.

## Repo
- **GitHub**: https://github.com/abdullahshahid9999-hub/ewts
- Clone with: `git clone https://<token>@github.com/abdullahshahid9999-hub/ewts.git`
  (get the token from the project owner directly — never ask them to paste it
  in plain chat if avoidable, and never commit it to any file in the repo)
- **Database**: Render-hosted PostgreSQL, already provisioned and already has
  all 15 tables created and confirmed live (owner will provide the
  `DATABASE_URL` connection string separately — put it in a local `.env` file,
  never commit it)

## Stack (already decided, do not change)
- Next.js (App Router) + TypeScript + Tailwind CSS v4
- PostgreSQL via **Prisma ORM** — schema already fully defined in
  `prisma/schema.prisma`, matching the 15 live tables exactly (packages,
  group_flights, visa_services, insurance_companies/plans/rates, blogs,
  bookings/travellers, agents, agent_bookings, agent_transactions,
  agent_otps, payment_slips, admin_users). **Do not modify field names.**
- Custom JWT auth (bcrypt + jsonwebtoken) — no third-party auth provider.
  Utility functions already written in `lib/auth.ts` (hashPassword,
  verifyPassword, signAccessToken, signRefreshToken, verifyAccessToken,
  verifyRefreshToken, isAllowedAdminEmail).
- Cloudflare R2 for file/image storage (not yet wired up — see remaining work)
- Resend (or similar) for OTP emails (not yet wired up)
- Deploy target: Render, with Cloudflare DNS/CDN in front of the final domain
  (Hostinger is only the domain registrar)

## What's already built (do not redo)
- Next.js scaffold with TypeScript + Tailwind v4
- `prisma/schema.prisma` — full canonical schema
- `lib/prisma.ts` — Prisma client singleton
- `lib/auth.ts` — JWT + bcrypt utilities, admin allow-list check
- `lib/whatsapp.ts` — `wa.me` link helper (public site is WhatsApp-first, no
  booking forms on public pages)
- `app/globals.css` + `app/layout.tsx` — brand design tokens (see below) and
  Google Fonts (Cormorant Garamond + Plus Jakarta Sans) wired up correctly
- `components/Navbar.tsx`, `components/Footer.tsx` — shared public-site chrome
- `app/page.tsx` — home page: hero section + live "Featured Packages" pulled
  from the `Package` Prisma model (`featured: true, status: "active"`),
  revalidated every 120s, plus three service-category link cards
- `next.config.ts` — image remotePatterns (wildcard https for now, tighten to
  the real R2 hostname once known) + basic security headers

**Known unverified state**: the environment this was built in could not reach
`binaries.prisma.sh` (a sandboxed dev environment's network restriction, not a
real production constraint), so `npx prisma generate` and `npm run build` were
never actually run/verified. **Your first task should be running
`npm install && npx prisma generate && npm run build` locally and fixing
whatever surfaces** — treat everything above as "written but not yet build-
verified."

## Design system (preserve exactly — established brand identity)
- Fonts: `Cormorant Garamond` (display/headings, serif, use italic for accents)
  + `Plus Jakarta Sans` (body/UI). Already wired via `next/font/google` as CSS
  variables `--font-cormorant` / `--font-jakarta`, exposed as Tailwind
  `font-display` and default body font.
- Palette (already in `globals.css` as CSS vars + Tailwind theme):
  `--gold: #D4A843`, `--gold-l: #F0C050`, `--navy: #071120`,
  `--bg: #F4F3EF`, `--text: #14142B`, `--muted: #7A7A95`,
  `--bdr: #E4DFD4`. Warm ivory/cream, near-black espresso text, gold accent.
  Premium, understated, not flashy-startup.

## WhatsApp number (business contact, already used in code)
`923336515349` — see `lib/whatsapp.ts`, use `waLink(message)` everywhere a
WhatsApp CTA is needed rather than hardcoding the number again.

## Remaining work, roughly in priority order

### 1. Verify the build actually works
`npm install && npx prisma generate && npm run build` — fix any TypeScript or
Prisma errors that surface. This wasn't possible in the environment that wrote
the code so far.

### 2. Finish the public website
Pages still needed (all read-only, query Prisma directly via Server
Components, no client-side data fetching waterfalls):
- `/umrah`, `/tours` — list from `Package` model filtered by `category`
- `/group-tickets` — list from `GroupFlight` model
- `/visa` — list from `VisaService` model
- `/insurance` — three-level: `InsuranceCompany` → `InsurancePlan` →
  `InsuranceRate`, rates ordered by `pricePkr` ascending
- `/blog` + `/blog/[slug]` — from `Blog` model, only `published: true`
- `/about`, `/contact` — mostly static content
Every listing card needs a WhatsApp CTA via `waLink()`, no login/booking forms
anywhere on the public site.

### 3. Agent Portal (`app/agent/*`)
Full spec was written earlier as a separate brief — key points:
- Custom JWT login (`/agent/login`), bcrypt-verified against `Agent.passwordHash`
- **OTP flow must be entirely server-side** (generate with `crypto.randomInt`,
  store + verify via a Route Handler using the database directly — never
  client-side generation/verification). Rate-limit ~3 requests/10min per
  agent, lock after ~5 failed verify attempts. This was a real security bug
  in the legacy system — do not repeat it.
- Bookings list with combined category + status filters (AND logic, single
  filter state — a legacy bug had these two filters silently overwrite each
  other, don't reintroduce that)
- Balance/credit_limit/tier are agent-read-only, admin-write-only — enforce
  this by never accepting those fields in any agent-authenticated API route,
  not just by hiding the input in the UI
- Booking expiry timers: internal inventory = 30 min, supplier-API-backed =
  supplier's limit minus 3 min buffer
- `service_type` values: exactly `umrah` | `group_ticket` | `insurance`
  (snake_case, matches the Prisma field mapping already)

### 4. Admin Panel (`app/admin/*`)
- Custom JWT login + `isAllowedAdminEmail()` check (already in `lib/auth.ts`)
  on **every single write route, no exceptions**
- Content management for all public-site tables (packages, visas, flights,
  blogs, insurance) with real image upload to Cloudflare R2 (compress
  client-side to ~1280px/JPEG q0.8 before upload; backend route verifies
  admin auth then uploads using R2 server-side credentials)
- Agent management, agent-bookings review/issue flow, payment slips, finance
  reporting
- No "Client Bookings" feature — this existed in the legacy system and was
  deliberately removed, do not reintroduce it

### 5. Cloudflare R2 wiring
Not yet implemented anywhere. Needed for: package/visa/blog images, airline
logos, insurance company logos (admin-uploaded), and potentially agent
document uploads. Use presigned uploads or a backend proxy route — either is
fine, but never expose R2 credentials to the client.

### 6. Deploy
Render (Next.js app + reuse the existing Postgres instance), then Cloudflare
DNS in front, then domain cutover from the legacy site — only after
everything above is tested.

## Security rules (non-negotiable, apply to all new code)
- Every Prisma query is automatically parameterized — never build raw SQL
  strings from request input.
- Every write route (agent or admin) verifies a valid JWT server-side before
  touching the database.
- Admin routes additionally require `isAllowedAdminEmail()` to pass.
- OTP codes: generated server-side, verified server-side, never exposed to
  the client in any response, rate-limited, attempt-limited.
- Refresh tokens go in httpOnly cookies, never localStorage.
- CORS locked to the actual frontend origin, not `*`.

## If anything is ambiguous
Check `0-MASTER-INSTRUCTIONS.md`, `1-public-website-prompt.md`,
`2-agent-portal-prompt.md`, `3-admin-panel-prompt.md` in this repo's root —
they're the original detailed specs this build is following.
