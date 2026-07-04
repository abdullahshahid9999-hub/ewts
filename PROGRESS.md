# EWTS Rebuild — Progress Notes

## Blocker on item 1 (build verification) — READ THIS FIRST
This sandbox's network egress is allowlisted to specific domains and does
**not** include `binaries.prisma.sh`. `npx prisma generate` fails with
`403 Forbidden` fetching the schema-engine binary, every time, regardless of
`PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING`. This is the same limitation the
previous session hit — it is a sandbox constraint, not a code problem.

**Action needed from a human or an unrestricted environment**: run
```
npm install && npx prisma generate && npm run build
```
on a machine (or CI runner, e.g. Render's build step) that can reach
binaries.prisma.sh, and fix whatever TypeScript errors surface. I wrote all
new code below against the schema and existing conventions carefully, but
none of it has been through `tsc`/`next build` in this session — treat it as
"written but not yet build-verified," same caveat as before.

npm install itself works fine (registry.npmjs.org is allowlisted) — only the
Prisma engine binary download is blocked.

## Done this session

### Public website (item 2) — complete
- `/umrah`, `/tours` — from `Package` model, filtered by category
- `/group-tickets` — from `GroupFlight`, shows seats-left / sold-out
- `/visa` — from `VisaService`
- `/insurance` — three-level Company → Plan → Rate, rates ordered by
  `pricePkr` ascending
- `/blog`, `/blog/[slug]` — from `Blog`, `published: true` only
- `/about`, `/contact` — static content, real address/phone from Footer
- Every card has a WhatsApp CTA via `waLink()`, no login/booking forms
  anywhere on the public site.

### Agent portal (item 3) — backend foundation only, no UI pages yet
- `lib/apiAuth.ts` — `requireAgent`/`requireAdmin` helpers (verify JWT +
  re-check DB row status), `stripAgentWriteOnlyFields()` to guarantee
  balance/creditLimit/tier/commission can never be set by an agent request
- `lib/rateLimit.ts` — in-memory rate limiter. **Caveat**: only correct on a
  single server instance — if this ever runs across multiple Render
  replicas, swap for a shared store (Redis or DB-backed counter) before
  relying on it.
- `lib/email.ts` — Resend integration for OTP emails, dev-only console
  fallback if `RESEND_API_KEY` unset (fallback throws in production)
- `POST /api/agent/login` — bcrypt verify, JWT + httpOnly refresh cookie,
  rate-limited by IP and by email, generic error (no account enumeration)
- `POST /api/agent/refresh`, `POST /api/agent/logout`
- `POST /api/agent-otp/request` — JWT-authenticated only, generates via
  `crypto.randomInt`, stores server-side, emails only to the agent's own
  registered email (never a client-supplied address), rate-limited 3/10min
- `POST /api/agent-otp/verify` — server-side check, 10-min expiry, 5-attempt
  lockout, marks used, never echoes the code back
- `GET/POST /api/agent/bookings` — **single combined where-clause** built
  from category + status query params (the legacy AND-filter bug this brief
  calls out is specifically guarded against here — see the comment in the
  route)
- `POST /api/agent/bookings/[id]/issue-request` — requires a *server-side
  verified* recent OTP row (not just a client claim that OTP passed) before
  flipping status to `issue_requested`; also checks expiry
- Booking expiry: 30 min for internal-inventory bookings implemented;
  supplier-API-minus-3-min path has the function signature ready
  (`computeExpiresAt`) but there's no real supplier API integrated yet, so
  it currently always takes the 30-min branch — wire in the real supplier
  limit when that integration exists.
- Commission is intentionally left at the schema default (0) on booking
  creation — there's no tier-based commission-rate table/rule yet. Whoever
  picks this up needs to decide where that rule lives before this is
  correct; I did not invent a formula.

**Still needed for item 3** (not started):
- All `/agent/*` UI pages (login form, dashboard, bookings list with the
  category+status tabs calling the API above, booking flows for
  umrah/group-tickets/insurance, profile/password change)
- Password-reset OTP path (pre-login, agent-code + email + phone match,
  generic "no match" response) — only the issue-request OTP path is built
- Agent document upload (if needed) via R2

### Admin panel (item 4) — one content type wired end-to-end as a pattern, rest not started
- `POST /api/admin/login` — same pattern as agent login, plus
  `isAllowedAdminEmail()` check before *and* after the DB lookup
- `GET/POST /api/admin/packages`, `PATCH/DELETE /api/admin/packages/[id]` —
  full pattern for: admin JWT check, multipart form parsing, optional image
  upload to R2, Prisma write. **Use this file as the template** for the
  same CRUD shape on visas, flights, blogs, insurance companies/plans/rates.
- `lib/r2.ts` — S3-compatible client for Cloudflare R2, `uploadToR2()`
  helper, content-type allowlist (jpeg/png/webp only), credentials
  server-side only. Needs these env vars in production: `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`,
  `R2_PUBLIC_BASE_URL`.

**Still needed for item 4** (not started):
- Admin UI pages entirely (login, dashboard, content management screens for
  every model, agent management, agent-bookings review/issue flow, payment
  slips, finance reporting)
- CRUD routes for visas/flights/blogs/insurance-companies/plans/rates
  (copy the packages route pattern)
- Client-side image compression before upload (~1280px/JPEG q0.8) — the
  admin route accepts the file as-is and does not re-compress

### Not started
- Item 5 (R2 wiring) — the `lib/r2.ts` helper exists and is used by the
  packages route, but nothing else uploads through it yet, and no R2
  bucket/credentials have been provisioned as far as I know — confirm with
  whoever owns the Cloudflare account before relying on the env var names
  above.
- Item 6 (deploy) — not started, correctly gated on everything else being
  tested first per the brief.

## Env vars this code now expects (add to `.env` / Render env, not committed)
```
DATABASE_URL=...          (already have this)
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ADMIN_EMAILS=you@example.com,other@example.com
RESEND_API_KEY=...
RESEND_FROM_EMAIL=no-reply@eastwestpk.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_BASE_URL=https://...
```
`JWT_SECRET`/`JWT_REFRESH_SECRET`/`ADMIN_EMAILS` are read by `lib/auth.ts`
which already existed — I didn't find them set anywhere; make sure they're
in the actual deploy environment, not just assumed.

## Honest assessment of what's left
This is still a large amount of work — essentially all of the agent portal
UI and all of the admin panel UI are unbuilt. The backend routes I wrote
give a concrete, security-reviewed pattern to build those UIs against
(especially the OTP flow and the combined-filter bookings query, since
those are the two things this brief explicitly flags as previous bugs), but
someone still needs to build the React pages, wire up forms, and replicate
the CRUD-route pattern across the remaining five content models. I'd
estimate this is roughly 25-35% of the total remaining work described in
the brief, concentrated on the security-sensitive backend pieces first.

## RESOLVED: commission calculation (was blocking item 4)
Answered by the project owner directly:

- Commission is **per-agent, per-service-type**, admin-configured, either a
  **flat PKR amount** (e.g. Amazing Holidays gets 2000 PKR flat per flight
  ticket, 15,000 PKR flat per Umrah booking) or a **percentage** (e.g. 30%
  on insurance).
- Admin can change an agent's rate at any time (relationship improves,
  target hit, etc.) — but changing it **only affects future bookings**.
  Already-created bookings keep the commission they were created with.

Implemented:
- `prisma/schema.prisma`: new `AgentCommissionRate` model — one row per
  `(agentId, serviceType)` (unique constraint), `rateType: "fixed" |
  "percentage"`, `value: Int`. Admin upserts this row to set/change a rate;
  there is no history table because the *booking* itself is the history —
  see below.
- `lib/commission.ts`: `calculateCommission(agentId, serviceType, sellPrice)`
  — looks up the current rate and returns the computed PKR amount. Returns
  0 (with a console warning) if no rate is configured yet for that
  agent+serviceType, rather than throwing — don't let a missing rate config
  block booking creation, but it should be visibly wrong and get noticed.
- `app/api/agent/bookings/route.ts`: now calls `calculateCommission()` once,
  at booking-creation time, and stores the result directly on
  `AgentBooking.commission`. This is a **snapshot** — never recompute it
  later from a booking's serviceType + current rate, that would retroactively
  change historical commission whenever admin updates a rate, which is
  exactly what the owner said should NOT happen.

**Still needed** (admin panel work, not yet built): a UI + API route for
admin to view/set each agent's `AgentCommissionRate` rows per service type
(simple upsert on `(agentId, serviceType)`). Follow the same JWT+allow-list
pattern as the other admin routes.
