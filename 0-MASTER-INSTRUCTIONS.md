# EAST & WEST TRAVEL — MASTER INSTRUCTIONS FOR PARALLEL REBUILD
(Give this file to ALL THREE AI sessions, in addition to their individual brief)

## What's happening
East & West Travel Services (eastwestpk.com) is being rebuilt from scratch as three
separate Next.js applications, each in its own new GitHub repo, each being built by
a different AI session in parallel:

1. **Public Website** — marketing site (brief: `1-public-website-prompt.md`)
2. **Agent Portal** — agent booking tool (brief: `2-agent-portal-prompt.md`)
3. **Admin Panel** — internal control panel (brief: `3-admin-panel-prompt.md`)

All three share ONE PostgreSQL database. They are being built in parallel by
different AI sessions that cannot see each other's work directly — this file exists
so all three stay compatible with each other.

## Reference-only: existing live production repo
This is the CURRENT vanilla-JS site, for reference only (to see current field names,
business logic, page structure). **Do NOT push code here. Do NOT modify this repo.
Clone it read-only if you need to check something, nothing more.**

- Repo: https://github.com/abdullahshahid9999-hub/eastwestpk
- Token: **shared separately, out-of-band (chat/DM) — never committed to this repo.**
  Ask the project owner directly for read-only access if you need to inspect
  the live production repo.

## Your new repo
[Fill in once created — one line per rebuild:]
- Public Website repo: `PASTE_LINK_HERE`
- Agent Portal repo: `PASTE_LINK_HERE`
- Admin Panel repo: `PASTE_LINK_HERE`

## THE MOST IMPORTANT RULE: shared database schema
All three apps read/write the same PostgreSQL database via Prisma. If each AI
session invents its own field names or table structure, none of the three apps
will work together. To prevent this:

**The Admin Panel rebuild owns the canonical Prisma schema** (`schema.prisma`),
since it touches the most tables. Build the Admin Panel's schema FIRST, using the
table/field names below (taken directly from the existing production system —
do not rename these, other parts of the system and the existing data depend on
them):

- `packages` — id, category (umrah|tours), name, duration, price, price_note,
  destination, dep_date, ret_date, airline, route, hotels, includes, excludes,
  image_url, featured (bool), status
- `group_flights` — id, flight_no, airline, airline_code, route, dep_date,
  arr_date, dep_time, baggage, meal, price, airline_logo_url, seats, status
- `visa_services` — id, title, country, type, price, days, validity, max_stay,
  processing_time, requirements, country_flag, country_image, status
- `insurance_companies` — id, name, logo_url, description
- `insurance_plans` — id, company_id (FK), name, description
- `insurance_rates` — id, plan_id (FK), price_pkr, coverage_details (order by
  price_pkr ascending — there is no separate sort field)
- `blogs` — id, title, category, cover_image, excerpt, content, published (bool)
- `bookings`, `travellers` — direct/walk-in customer bookings
- `agents` — id, agent_code, full_name, email, phone, password_hash,
  balance, credit_limit, tier, status, logo_url
- `agent_bookings` — id, agent_id (FK), service_type (umrah|group_ticket|insurance
  — exact snake_case strings, do not invent variants), status
  (pending|confirmed|issue_requested|issued|cancelled), sell_price, commission,
  expires_at, issue_requested_at, issue_requested_by, created_at, updated_at
- `agent_transactions` — id, agent_id (FK), amount, type, note, created_at
- `agent_otps` — id, agent_id (FK), otp_code, purpose (issue_request|
  password_reset), expires_at, used (bool), attempts (int), created_at
- `payment_slips` — id, agent_id (FK), amount, slip_image_url, status, note

Once the Admin Panel session finalizes `schema.prisma`, **paste that exact file
into the other two sessions** and tell them to use it as-is (or the relevant
subset of models). Do not let the Public Website or Agent Portal sessions
independently invent their own schema.

## Shared conventions (all three must follow these)
- **Env var names** — use the same names across all three so deployment config
  is consistent:
  - `DATABASE_URL` — Postgres connection string
  - `JWT_SECRET` — for signing access tokens (Agent Portal + Admin Panel only)
  - `JWT_REFRESH_SECRET` — for refresh tokens
  - `RESEND_API_KEY` (or equivalent email provider key) — Agent Portal only
    (OTP emails)
  - `ADMIN_EMAILS` — comma-separated allow-list — Admin Panel only
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
    `R2_BUCKET_NAME` — Cloudflare R2 storage — Agent Portal + Admin Panel
- **Design tokens** — all three must use the exact same palette/fonts (see each
  brief's design system section) so the three apps feel like one product to
  end users, even though they're deployed separately.
- **No app writes outside its own lane**: Public Website is read-only against
  the database, full stop. Agent Portal can only write its own agent's rows
  (enforced via JWT). Admin Panel is the only app with unrestricted writes,
  and even there every write route must check the JWT + `ADMIN_EMAILS`
  allow-list — see the security section in `3-admin-panel-prompt.md`, it is
  non-negotiable.
- **Money fields** (`balance`, `credit_limit`, `tier`, `commission`) are only
  ever written by the Admin Panel's backend. If the Agent Portal session's API
  design lets an agent-authenticated request touch these fields, that's a bug —
  it should be rejected server-side regardless of what the client sends.

## Build order recommendation
1. Admin Panel finalizes `schema.prisma` + runs the first migration against the
   shared Postgres database.
2. Agent Portal and Public Website sessions pull that schema and build against it.
3. Test each app independently against the shared dev database before any
   production domain cutover.
4. Domain cutover (Hostinger domain → Cloudflare DNS → new hosting) happens only
   after all three are tested — do this last, together, not per-app.

## When in doubt
If a business rule isn't covered in your individual brief or this file, check the
reference repo above (read-only) for how the current live system handles it
before inventing new behavior.
