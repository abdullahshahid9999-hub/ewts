# East & West Travel Services — Web Platform

Full-stack travel agency management system powering **eastwestpk.com**. Built for East & West Travel Services, Faisalabad — handling Umrah packages, world tours, group flights, insurance, and visa services across a public B2C site, a multi-agent portal, and an internal admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + custom CSS design tokens |
| ORM | Prisma 6 |
| Database | PostgreSQL (Render — Basic 256MB) |
| File Storage | Cloudflare R2 (`lib/r2.ts`) |
| Email | Resend (`lib/email.ts`) |
| Auth | JWT (access token in React state, refresh token in httpOnly cookie) |
| 2FA | TOTP via `otplib` + `qrcode` |
| OCR | `tesseract.js` + `mrz` (client-side passport MRZ scanning) |
| Animations | Framer Motion |
| Deployment | Render (Node server) |

---

## Project Structure

```
app/
  (public)/          — Public B2C site (no login required)
  agent/             — Agent portal (JWT-protected)
  admin/             — Admin panel (JWT + email allowlist)
  api/
    agent/           — Agent API routes
    admin/           — Admin API routes
    (public)/        — Public booking & form routes

components/          — Shared UI components
lib/                 — Auth, Prisma client, R2, email, helpers
prisma/
  schema.prisma      — Full database schema
```

---

## Features

### Public Site (`/`)
- **Home** — Hero, services overview, Trustpilot badge, scroll-reveal animations
- **Umrah** — Package listing with room type filter (Quad/Triple/Double/Single), seat-hold booking modal (2hr hold), auto-email confirmation
- **World Tours** — Tour packages with detail pages, per-room-type booking
- **Group Flights** — Nested airline → route → flight table with filters (region, trip type, date, airline), B2C booking with PNR + 2hr seat hold
- **Insurance** — Live premium calculator, booking form
- **Visa** — Per-traveller wizard with passport OCR auto-fill, document uploads, category/nationality scoping
- **Blog** — Admin-managed articles
- **About** — Hero slideshow, zigzag milestone timeline (2004–2026)
- **Contact** — WhatsApp-first contact form

### Agent Portal (`/agent/*`)
All agent pages mirror public UX but add: sell price capture, customer/traveller detail forms, OTP-confirmed issuance, and live credit tracking.

| Route | Description |
|---|---|
| `/agent/login` | Owner login (with optional TOTP 2FA) + Staff Login tab |
| `/agent/dashboard` | Amount payable card, date-range booking stats |
| `/agent/bookings` | Unified My Bookings — all services, status filter, booking timeline |
| `/agent/new-booking` | Service hub (cards for each service type) |
| `/agent/umrah` | Umrah package booking for clients |
| `/agent/tours` | World tour booking |
| `/agent/group-flights` | Group flight booking — sticky live bill, OTP-gated issue, PNR expiry countdown, Print with/without Fare |
| `/agent/insurance` | Insurance booking |
| `/agent/visa` | Visa application wizard — per-traveller docs, passport OCR, MRZ parse |
| `/agent/saved-clients` | Quick-fill client profile management |
| `/agent/topup` | Payment slip submission (bank transfer confirmation) |
| `/agent/finance` | Agent ledger / transaction history |
| `/agent/profile` | Profile + 2FA setup/disable |
| `/agent/bookings/[id]/print` | Airline-ticket-style print layout (multi-leg aware) |

#### Sub-Users (Staff Logins)
Each agency can have multiple staff sub-users with their own login credentials but sharing the agency's balance, bookings, and commission rates. Permissions are configurable per sub-user by the admin:

- Create Bookings
- View Bookings
- Submit Payment Slips
- View Ledger & Balance
- Manage Saved Clients
- View Notifications
- ~~Issue Tickets~~ (always locked — owner only)

### Admin Panel (`/admin/*`)

| Route | Description |
|---|---|
| `/admin/dashboard` | Business overview stats |
| `/admin/agents` | Agent list — deactivate/activate, link to ledger and edit |
| `/admin/agents/new` | Create new agent account |
| `/admin/agents/[id]/edit` | Edit agent info, financial, commission rates, sub-users |
| `/admin/agents/[id]` | Agent ledger (transactions, payment slips) |
| `/admin/agent-bookings` | All agent bookings — approve/issue (ticket number required for flights) |
| `/admin/direct-bookings` | Walk-in/website bookings — tabbed by type (Umrah / Tours / Group Flights), Excel export |
| `/admin/packages` | Umrah + Tour package CRUD with room-type pricing |
| `/admin/group-flights` | Group flight management (multi-leg, inventory) |
| `/admin/visa-services` | Visa category/nationality document configuration |
| `/admin/visa-applications` | Visa pipeline — status tracking, tracking link, final doc upload |
| `/admin/insurance` | Insurance company + plan + rate management |
| `/admin/insurance-applications` | Insurance application review |
| `/admin/payment-slips` | Agent payment slip approval (credits balance on approval) |
| `/admin/finance` | Real-time receivables, date-range filtering |
| `/admin/bank-accounts` | Bank account management (shown to agents on topup page) |
| `/admin/blogs` | Blog CRUD with R2 image upload |
| `/admin/suppliers` | Supplier management + transaction ledger |
| `/admin/visa-discount-tiers` | Volume discount tiers for visa applications |
| `/admin/2fa-setup` | Admin 2FA configuration |

---

## Database Models

```
Agent                  — Agency account (owner login)
AgentUser              — Staff sub-user (shared agency balance)
AgentBooking           — All agent-created bookings
AgentCommissionRate    — Per-service commission rates per agency
AgentTransaction       — Balance ledger entries
AgentOtp               — OTP codes for booking issuance
AgentNotification      — In-app bell notifications (30s polling)
AgentSavedClient       — Quick-fill client profiles
PaymentSlip            — Agent top-up requests
Package                — Umrah + tour packages
PackageRoomType        — Room type slots + pricing per package
Booking                — Public/direct bookings
Traveller              — Per-traveller details on bookings
GroupFlight            — Group flight inventory (multi-leg)
VisaService            — Visa category configuration
VisaRequiredDocument   — Required docs per category/nationality
VisaApplication        — Agent visa applications
VisaApplicant          — Per-traveller visa applicant
VisaApplicationDocument— Uploaded documents per applicant
VisaDiscountTier       — Volume discount tiers
InsuranceCompany       — Insurance providers
InsurancePlan          — Insurance plans
InsuranceRate          — Rate matrix per plan
InsuranceApplication   — Insurance booking records
Blog                   — Blog posts
BankAccount            — Agency bank accounts (for topup)
Supplier               — Suppliers (tickets, hotels)
SupplierTransaction    — Supplier ledger
AdminUser              — Admin panel accounts
PasswordResetToken     — Password reset flow
```

---

## Key Architecture Decisions

- **Balance** is negative when agent owes the office. Deducted at **issue** time (`sellPrice - commission`), credited when admin approves a payment slip.
- **Commission** is snapshotted at booking creation — never retroactively changed.
- **Image uploads** go to Cloudflare R2 via `lib/r2.ts`. Env var: `R2_PUBLIC_URL`.
- **Agent access token** in React state only (never localStorage). Refresh token in httpOnly cookie at `/api/agent/refresh`.
- **Sub-user tokens** use `role: "agent_user"` in JWT; `requireAgent()` in `lib/apiAuth.ts` handles both and always returns the parent agency's `id` so all existing routes work unchanged.
- **WhatsApp** is `wa.me` deep-link only — no Meta Cloud API (paid). Never promise automatic WhatsApp sending.
- **Payment processing** is out of scope — agents do bank transfers, admin manually approves slips.
- **Inventory holds** — group-ticket seats and Umrah room-type slots decrement atomically at booking creation (2hr hold, auto-released if not confirmed).
- **Email** via Resend (`lib/email.ts`). Triggered on: booking confirmation, visa status updates, payment slip approval.

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/abdullahshahid9999-hub/ewts.git
cd ewts

# 2. Install
npm install

# 3. Environment — copy and fill in values
cp .env.example .env.local

# 4. Generate Prisma client
npx prisma generate

# 5. Run dev server
npm run dev
```

### Required Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
ADMIN_EMAILS=
RESEND_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

---

## Deployment

Hosted on **Render** as a Node.js web service. PostgreSQL also on Render (Basic 256MB plan). Static assets and images on Cloudflare R2.

> ⚠️ `npx prisma generate` is blocked in the Render build environment on the free tier. Every schema change requires a manual `ALTER TABLE` or `CREATE TABLE` run via the Render Postgres console **before** deploying. Always use `IF NOT EXISTS` and `UUID` type (not `TEXT`) for columns referencing `id` fields — production Postgres uses native UUID columns.

---

## Pending Migration SQL

Run these in the Render Postgres console if not already applied:

```sql
-- Sub-users (staff logins per agency)
CREATE TABLE IF NOT EXISTS agent_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  designation TEXT,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  permissions JSONB NOT NULL DEFAULT '{}',
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_users_agent_id ON agent_users(agent_id);
```

---

*Built and maintained by Abdullah Shahid — East & West Travel Services, Faisalabad.*
