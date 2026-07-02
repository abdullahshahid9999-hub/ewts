# East & West Travel — Admin Panel Rewrite (Next.js + Custom Backend)

## Context
You are rebuilding the **Admin Panel** for East & West Travel Services — the control panel staff use to manage site content, manage agents and their balances, review/issue agent bookings, record payments, and handle finance reporting. Full ground-up rebuild in a **brand-new repo**, built to a standard where the security model alone is a competitive advantage — this panel controls money (agent balances, commissions) and public-facing content, so it has to be airtight, not just functional. This is ONE of three separate rebuilds (public site / agent portal / admin panel) happening independently — do not assume the other two exist in this repo.

## Full stack (required)
- **Frontend**: Next.js (App Router), React.
- **Backend API**: Node.js/Express (or Next.js Route Handlers), hosted on **Render**.
- **Database**: **PostgreSQL** (Render managed or Neon) — same shared schema as the other two rebuilds.
- **ORM**: **Prisma** — every query parameterized, no raw SQL string-building from user input, anywhere, ever. This panel touches money; there is zero tolerance for injection risk here.
- **Auth**: custom JWT-based auth (same pattern as the agent portal — bcrypt-hashed passwords, short-lived access token + httpOnly refresh cookie), PLUS an **admin allow-list**: even a valid JWT isn't enough — the authenticated user's email must also match an `ADMIN_EMAILS` allow-list (env var) before any admin route does anything.
- **File/image storage**: **Cloudflare R2** for package photos, airline logos, blog covers, insurance company logos — uploaded through the backend (never a direct client-to-storage upload), so every upload passes through the same admin-auth check as every other write.

## Design system (preserve exactly)
- `Cormorant Garamond` (display) + `Plus Jakarta Sans` (body/UI). Light/white admin theme (distinct from the agent portal's navy sidebar). Status filters that are simple two-state toggles can stay as dropdowns per admin convention; multi-category filters (like service type across bookings) should be tab/pill groups with live count badges.

## Pages / sections
- `/login` — admin sign-in + forgot password
- `/` — dashboard: overview stats, recent bookings widget
- `/bookings` — direct bookings
- `/agents` — agent management (create/edit, balance/credit_limit/tier — admin-write-only fields)
- `/agent-bookings` — review agent-submitted bookings; category tabs (All/Umrah/Group Tickets/Insurance with live counts) **AND** status filter, combined with real AND-logic filter state from day one (not two independent filter functions that silently clobber each other)
- `/payment-slips` — record/review agent payment slips
- `/finance` — P&L / reporting
- `/content/umrah`, `/content/tours`, `/content/visa`, `/content/group-tickets`, `/content/blog` — content management with real image upload (see below)
- `/content/insurance` — three-level management: companies → plans → rates (rates ordered by price ascending)

Note: there is intentionally **no "Client Bookings" section** — a legacy feature, deliberately not rebuilt.

## Image uploads (real feature)
Every image field (package photo, visa country image, airline logo, blog cover, insurance company logo) gets an actual file-upload flow, not a URL-paste-only field:
- Client-side: compress/resize before upload (cap ~1280px longest edge, JPEG quality ~0.8).
- Backend route: verify admin auth (JWT + allow-list) → upload to Cloudflare R2 using server-side credentials (never exposed to the browser) → return the public/CDN URL.
- Show a live preview thumbnail; allow pasting an external URL as a fallback, but upload should be the primary path.

## Security requirements — THE most important section in this brief
Every mutation in this panel — content edits, agent balance changes, payment approvals — represents either public-facing content or real money. Build the security model first, features second:

1. **Every single write route (POST/PUT/PATCH/DELETE, no exceptions) must**:
   - Verify a valid JWT (signature + expiry).
   - Verify the authenticated user's email is on the `ADMIN_EMAILS` allow-list.
   - Only then execute the database write, using Prisma (parameterized, never raw string SQL).
2. **Public reads stay genuinely public** (the public-site rebuild reads this same database directly for its own read-only API) — but this admin app's own API surface should not expose an unauthenticated write path for anything, ever. Treat "no auth check on a mutation" as a shipped vulnerability, not an oversight to fix later.
3. Financially sensitive fields (`balance`, `credit_limit`, `tier`, commission rates) should have the tightest checks of all — consider a dedicated audit log table (who changed what, when) for these specifically, since this is money.
4. Standard hardening: security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS), CORS locked to the actual admin frontend origin, rate limiting on the login endpoint, `Cache-Control: no-store` on all API responses.
5. Image upload endpoint goes through the exact same JWT + allow-list check as every other write — no separate, looser path for "just uploading a file."

## Database tables this app touches (Prisma models)
- Full read/write (via admin-auth-gated routes only): `packages`, `visa_services`, `group_flights`, `blogs`, `bookings`, `travellers`, `insurance_companies`, `insurance_plans`, `insurance_rates`, `agents`, `agent_bookings`, `agent_transactions`, `payment_slips`
- File storage: Cloudflare R2 bucket for admin-uploaded images

## What NOT to build here
- No agent-facing booking flows — that's the agent portal rebuild.
- No public marketing pages — that's the public site rebuild.
- No "Client Bookings" feature — deliberately removed, do not reintroduce.

## Deliverable
A new Next.js + Render/Postgres/Prisma repo where every write path is gated behind verified JWT auth + an admin allow-list from the very first commit (this is the single most important requirement in this brief, above any feature) — a control panel good enough, and secure enough, that it's a genuine differentiator against every other agency running an unlocked spreadsheet-with-a-login. Ready for Cloudflare-fronted domain cutover after testing.
