# EAST & WEST TRAVEL SERVICES — COMPLETE HANDOFF PROMPT
## For a new AI session starting fresh on this project

---

## 1. BUSINESS CONTEXT

**East & West Travel Services** — a real, operational travel agency based in Faisalabad, Pakistan (est. 2003), IATA/DTS certified. Services: Umrah packages, Hajj, Group Air Tickets, World Tours, Visa Services, Travel Insurance.

The business runs a **B2C public website** (customers browse + enquire via WhatsApp) and a **B2B agent portal** (registered travel sub-agents book on behalf of clients, tracked via a ledger). An admin panel manages everything internally.

This is a **full rebuild** of the live site at `eastwestpk.com` — modernising from a legacy vanilla HTML/Supabase stack to a Next.js 15 monorepo.

---

## 2. TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL on Render |
| ORM | Prisma |
| Auth | Custom JWT (access token in React state, refresh token in httpOnly cookie) |
| Storage | Cloudflare R2 (S3-compatible) |
| Email | Resend |
| Deployment | Render (builds run there — Prisma binaries download fine on Render) |
| Styling | Tailwind + custom CSS (`portal.css`) |

**One repo, three apps in one Next.js project:**
- `/app` — public website (read-only DB access, WhatsApp-first, no login)
- `/app/agent/*` — agent portal (JWT auth, agent-scoped DB access)
- `/app/admin/*` — admin panel (JWT auth + `ADMIN_EMAILS` allowlist)

**GitHub repo:** `abdullahshahid9999-hub/ewts`

---

## 3. ENVIRONMENT VARIABLES (add to `.env` / Render dashboard)

```
DATABASE_URL=              # Postgres connection string (already set on Render)
JWT_SECRET=
JWT_REFRESH_SECRET=
ADMIN_EMAILS=              # Comma-separated, e.g. admin@eastwestpk.com
RESEND_API_KEY=
RESEND_FROM_EMAIL=no-reply@eastwestpk.com
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=             # Public base URL of the R2 bucket (note: R2_PUBLIC_URL not R2_PUBLIC_BASE_URL — this was a bug that was fixed)
```

---

## 4. HOW TO READ THE REPO (where everything lives)

```
app/
  page.tsx                     — public homepage
  umrah/                       — public Umrah listing + [slug] detail
  tours/                       — public World Tours listing + [slug] detail
  group-tickets/               — public Group Flights listing
  visa/                        — public Visa listing + [id] detail + [id]/apply
  insurance/                   — public Insurance + quote calculator
  blog/                        — public blog listing + [slug]
  booking-form/                — B2C booking form (after room type selection)
  booking-confirmation/        — B2C booking success screen
  agent/
    layout.tsx                 — wraps all agent pages in auth provider
    portal.css                 — ALL agent portal CSS (dark navy sidebar, gold accents)
    login/                     — agent login page
    dashboard/                 — agent dashboard (Amount Payable card + date-range summary)
    bookings/                  — agent booking list (category + status filters)
    new-booking/               — NEW: landing page with 4 service cards (Visa/Group/Umrah/Insurance)
    umrah/                     — agent Umrah package browser
    umrah/[slug]/              — agent Umrah package detail + AgentPackageBookingWidget
    tours/                     — agent World Tours browser
    tours/[slug]/              — agent World Tours detail + AgentPackageBookingWidget
    topup/                     — agent payment slip upload + bank accounts
    bank-accounts/             — agent bank account cards view
    profile/                   — agent profile
    forgot-password/           — pre-login OTP password reset
  admin/
    layout.tsx                 — wraps all admin pages
    portal.css                 — ALL admin portal CSS (light gray, muted gold #B8923A, DM Sans)
    login/                     — admin login
    dashboard/                 — admin dashboard (stats cards + section grid)
    packages/                  — Umrah + Tour package CRUD
    visa-services/             — Visa CRUD + required documents + visa applications review
    group-flights/             — Group Flight CRUD
    insurance/                 — Insurance company → plan → rate CRUD
    blogs/                     — Blog CRUD
    agents/                    — Agent management (create, edit balance/tier/commission rates)
    agent-bookings/            — Agent booking review (filter, mark issued/cancel)
    direct-bookings/           — B2C booking review (Umrah/Tours/Group Flights, Excel export)
    payment-slips/             — Payment slip review (approve credits balance, reject with note)
    bank-accounts/             — Admin CRUD for bank accounts agents see
    finance/                   — Finance dashboard (date-range revenue/commission, total receivable)

api/
  bookings/route.ts            — POST: public B2C package booking (no auth)
  group-flights/book/route.ts  — POST: public B2C group flight booking (no auth)
  visa-applications/route.ts   — POST: public visa application submission (no auth)
  agent/
    login/ refresh/ logout/    — agent auth
    bookings/route.ts          — GET (filtered list) + POST (create booking)
    bookings/[id]/
      issue-request/           — OTP-gated status transition
    topup/route.ts
    bank-accounts/route.ts
    transactions/route.ts
  agent-otp/
    request/ verify/           — OTP generation + verification
  admin/
    login/ refresh/ logout/    — admin auth
    dashboard-stats/           — aggregated stats for admin dashboard cards
    packages/                  — CRUD (+ room-types sub-route)
    visa-services/             — CRUD (+ documents sub-route) + visa applications review
    group-flights/             — CRUD
    insurance/                 — CRUD (companies → plans → rates)
    blogs/                     — CRUD
    agents/                    — agent CRUD + commission rates
    agent-bookings/[id]/       — PATCH (issue/cancel, atomic seat decrement + balance debit)
    direct-bookings/           — list + status PATCH + Excel export
    payment-slips/[id]/        — approve (credits balance atomically) / reject
    bank-accounts/             — CRUD
    finance/                   — date-range revenue report

components/
  AgentSidebar.tsx             — dark navy sidebar, gold-glow balance panel
  AgentTopbar.tsx / AgentShell.tsx
  AgentGuard.tsx               — redirects to /agent/login if not authed
  AdminSidebar.tsx / AdminTopbar.tsx / AdminShell.tsx / AdminGuard.tsx
  BookingFormClient.tsx        — B2C booking form (two-column layout)
  PackageDetailView.tsx        — shared between /umrah/[slug] and /tours/[slug]
  PackageBookingWidget.tsx     — B2C room-type selector + booking calculator
  AgentPackageBookingWidget.tsx — same but agent-specific (sell price editable)
  PackageRoomTypesManager.tsx  — admin inline room type CRUD
  GroupTicketsClient.tsx       — public group tickets page with booking modal
  InsuranceCalculator.tsx      — public insurance quote calculator

lib/
  prisma.ts        — singleton Prisma client
  auth.ts          — JWT sign/verify helpers
  apiAuth.ts       — requireAgent() / requireAdmin() / stripAgentWriteOnlyFields()
  agentAuthClient.tsx — client-side agent auth context + agentFetch()
  adminAuthClient.tsx — client-side admin auth context + adminFetch()
  commission.ts    — calculateCommission(agentId, serviceType, sellPrice)
  email.ts         — Resend wrapper (console fallback in dev)
  r2.ts            — Cloudflare R2 upload helper
  rateLimit.ts     — in-memory rate limiter (single-instance only)
  imageCompression.ts — client-side canvas resize before admin uploads
  packagePrice.ts  — computeDisplayPrice() + syncPackageDisplayPrice()
  whatsapp.ts      — waLink() helper for WhatsApp deep-links
```

---

## 5. DATABASE SCHEMA (current state — all migrations confirmed run)

See `prisma/schema.prisma` in the repo — it is the single source of truth. Key models:

- **Package** — Umrah/Tours packages. Has `roomTypes` (PackageRoomType[]), `flightSectors` (JSON), `itinerary` (JSON), `slug` for detail pages.
- **PackageRoomType** — per-package room pricing. `pricePerPersonPkr`, `pricePerChildPkr`, `pricePerInfantPkr`, `maxAdults`, `maxInfants`, `minAdultsRequired`.
- **GroupFlight** — group air tickets. Has `seats` (inventory), `region`, `tripType`, `arrTime`.
- **VisaService** — visa listings. Has age-tiered pricing (`priceAdult`, `priceChild`, `priceInfant`).
- **VisaRequiredDocument** — per-visa document checklist (child of VisaService).
- **VisaApplication** — public visa application. Has `batchRef` (groups same-session apps), `totalPricePkr` (server-computed, never client-trusted).
- **VisaApplicationDocument** — uploaded file per application slot.
- **InsuranceCompany → InsurancePlan → InsuranceRate** — 3-level hierarchy.
- **Blog** — published blog posts.
- **Booking** — B2C direct bookings (Umrah, Tours, Group Flights share this table). Has `packageId` OR `groupFlightId` (never both). Has `children`, `groupFlightId`, `travelClass`, `seatsRequested`.
- **Traveller** — passenger rows linked to a Booking (required for Umrah).
- **Agent** — travel sub-agents. `balance` (PKR, negative = owes money), `creditLimit`, `tier`, `status`. These fields are **admin-write-only** — the agent API enforces this via `stripAgentWriteOnlyFields()`.
- **AgentCommissionRate** — per-agent per-serviceType commission config. `rateType: "fixed" | "percentage"`, `value: Int`. Unique on `(agentId, serviceType)`.
- **AgentBooking** — agent-created bookings. `commission` is a snapshot computed at creation time and never changed again. Has `customerName`, `customerPhone`, `customerEmail`, `travellers` (JSON), `roomTypeLabel`, `adults`, `children`, `infants`. Status pipeline: `pending → confirmed → issue_requested → issued → cancelled`.
- **AgentTransaction** — ledger entries (debit/credit). Written atomically with booking issue + payment slip approval.
- **AgentOtp** — server-side OTP store (never exposed to client). `attempts` count, `used` flag.
- **PaymentSlip** — agent topup proof. Approve = credits Agent.balance + writes AgentTransaction atomically.
- **BankAccount** — bank accounts shown to agents on topup page.
- **AdminUser** — admin accounts (additionally gated by `ADMIN_EMAILS` env var at the app layer).

**Important DB rules:**
- Seats (`GroupFlight.seats`) only decrement at **issue time** (admin PATCH to `issued`) inside a `$transaction` with a conditional `updateMany({ where: { seats: { gt: 0 } } })`. If zero rows affected → 409. Never at booking-creation time.
- Agent balance is debited at **issue time** in the same transaction. `netOwed = sellPrice - commission`.
- Commission is **snapshotted** at booking creation — never recomputed from the booking later.
- `Agent.balance` = cumulative running total. Negative = agent owes money. No date axis.

---

## 6. KEY BUSINESS RULES

- **Public website is WhatsApp-first** — no public customer login, no payment. B2C bookings go to the DB as `pending` and the business is notified by email. Customer gets a booking reference and a WhatsApp link pre-filled with that ref.
- **Agent portal** — agents browse packages, enter sell price (what they charge their customer), system computes their commission. They never touch balance/tier/commission fields directly. Booking expires in 30 min; they request issuance via OTP-gated flow; admin issues it.
- **Admin panel** is the only place that can: write `balance`, `creditLimit`, `tier`, `commission` rates; issue/cancel bookings; approve/reject payment slips; manage all content.
- **No payment integration yet** — owner's explicit decision ("payment pipeline baad mein"). All bookings record price but no payment is ever collected by the system.

---

## 7. DESIGN SYSTEM

**Agent portal** (dark theme):
- Sidebar: `linear-gradient(160deg, #0A1930, #050C18)` — dark navy
- Gold accent: `#D4A843` (CSS var `--gold`)
- Balance panel: gold-glow card, `rgba(212,168,67,0.14)` bg
- CSS class prefix: `ap-` (e.g. `ap-sb`, `ap-sbn`, `ap-card`, `ap-btn-gold`)
- All styles in `app/agent/portal.css`

**Admin panel** (light theme):
- Background: `#F8F7F4`, sidebar: `#FFFFFF`
- Gold: muted `#B8923A`
- Font: DM Sans
- CSS class prefix: `adp-`
- All styles in `app/admin/portal.css`

**Public website:**
- Warm ivory/espresso palette (Playfair Display + Inter)
- No blue gradients, no generic AI-looking UI
- WhatsApp CTAs everywhere, no login links

---

## 8. CRITICAL CODE PATTERNS — READ BEFORE WRITING ANY ROUTE

### Every GET route must have:
```typescript
export const dynamic = "force-dynamic";
```
Without this, Next.js caches the response and changes won't show up. This caused the "saves but doesn't appear" bug previously.

### Admin routes:
```typescript
import { requireAdmin } from "@/lib/apiAuth";
const admin = await requireAdmin(req);
if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
```

### Agent routes:
```typescript
import { requireAgent, stripAgentWriteOnlyFields } from "@/lib/apiAuth";
const agent = await requireAgent(req);
if (!agent) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
// For POST/PATCH: const body = stripAgentWriteOnlyFields(rawBody);
```

### R2 image upload:
```typescript
import { uploadToR2 } from "@/lib/r2";
// formData = await req.formData();
// file = formData.get("image") as File;
const imageUrl = await uploadToR2(file, "folder-name/");
```

### Commission at booking creation (agent bookings only):
```typescript
import { calculateCommission } from "@/lib/commission";
const commission = await calculateCommission(agent.id, serviceType, sellPrice);
// Then store it on AgentBooking.commission — never recompute later.
```

### Seat decrement + balance debit (ONLY at issue time, inside $transaction):
```typescript
await prisma.$transaction([
  prisma.groupFlight.updateMany({ where: { id: flightId, seats: { gt: 0 } }, data: { seats: { decrement: 1 } } }),
  prisma.agent.update({ where: { id: agentId }, data: { balance: { decrement: netOwed } } }),
  prisma.agentTransaction.create({ data: { agentId, amount: -netOwed, type: "debit", note: `Booking issued: ${ref}` } }),
  prisma.agentBooking.update({ where: { id }, data: { status: "issued" } }),
]);
```

---

## 9. WHAT IS DONE (no need to rebuild)

Everything in `PROGRESS.md` in the repo. Summary:
- Full Prisma schema, all migrations run
- All public pages (homepage, umrah, tours, visa, insurance, group-tickets, blog, about, contact, booking-form, confirmation)
- Full agent portal (login, dashboard, bookings list with filters, new-booking landing page, umrah/tours browse + detail + booking widget, group-tickets + insurance booking forms, topup + bank accounts, profile)
- Full admin panel (login, dashboard with stats, all 8 CRUD pages, agent management + commission rates, agent-bookings issue/cancel flow, direct-bookings with Excel export, payment-slips, bank-accounts, finance dashboard)
- All API routes (public booking, agent CRUD, admin CRUD, finance, export)
- R2 upload helper + client-side image compression
- JWT auth for both agent and admin (access token in React state, refresh in httpOnly cookie)
- Commission snapshot system
- Seat decrement at issue time (atomic, oversell-protected)
- Agent balance debit at issue time (atomic)
- Payment slip approval credits balance atomically

---

## 10. WHAT IS STILL PENDING / KNOWN ISSUES

### A. UMRAH BOOKINGS NOT SAVING (highest priority — owner reported)
The B2C booking flow (`/booking-form → /api/bookings POST → /booking-confirmation`) is coded correctly but **has not been tested against the live database**. Possible causes:
1. **Missing `export const dynamic = "force-dynamic"`** on `app/api/bookings/route.ts` — check this first. The GET route has it; the POST-only file may not need it but verify.
2. **Database schema mismatch** — the `bookings` table may be missing columns added in later migrations (`children`, `group_flight_id`, `travel_class`, `seats_requested`). Run these if not done:
   ```sql
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0;
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_flight_id TEXT REFERENCES group_flights(id);
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS travel_class TEXT;
   ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seats_requested INTEGER;
   ```
3. **Agent bookings** (`/api/agent/bookings POST`) may also fail if these columns are missing:
   ```sql
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS customer_email TEXT;
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS travellers JSONB;
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS room_type_label TEXT;
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 1;
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0;
   ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS infants INTEGER DEFAULT 0;
   ```
4. Check Render logs for the exact Prisma/DB error — that will tell you exactly which column or constraint is failing.

### B. BUILD NOT VERIFIED IN BROWSER
`npx prisma generate` cannot run in the AI sandbox (binaries.prisma.sh is blocked). All code has passed `tsc --noEmit` but has never been tested in a real browser against the live database. Render's own build step handles `prisma generate` correctly. First full E2E test is still needed.

### C. INSURANCE + VISA ONLINE BOOKING (not yet built)
Currently WhatsApp-enquiry only. A prompt file `VISA-INSURANCE-BOOKING-PROMPT.md` exists in the repo for the next session to pick up. This requires deciding what data to capture and building the flow.

### D. CONTACT FORM BACKEND (not built)
The public `/contact` form composes a WhatsApp message instead of submitting to a backend. If real form-submission storage is wanted, it needs a new DB table + API route.

### E. FINANCE REPORTING (basic version exists, can be extended)
`/admin/finance` shows total receivable + date-range agent activity. More detailed per-booking breakdowns or PDF export could be added.

### F. RATE LIMITER IS SINGLE-INSTANCE ONLY
`lib/rateLimit.ts` uses in-memory storage. If Render ever runs multiple instances, it won't work correctly across them. Swap for Redis or a DB-backed counter if scaling.

### G. NO PAGINATION
All list views load all rows. Fine at current data volume; add pagination when needed.

---

## 11. HOW TO GET THE CODE

```
Token: ask the owner — do NOT commit to the repo or expose in chat
Repo: https://github.com/abdullahshahid9999-hub/ewts
```

To read any file via API:
```bash
curl -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/abdullahshahid9999-hub/ewts/contents/PATH" \
  | python3 -c "import json,sys,base64; d=json.load(sys.stdin); print(base64.b64decode(d['content']).decode('utf-8'))"
```

To push a file (get SHA first if updating existing):
```bash
# Get SHA:
curl -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/abdullahshahid9999-hub/ewts/contents/PATH" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['sha'])"

# Push (include sha for update, omit for new file):
python3 -c "
import base64, json
with open('localfile', 'rb') as f: content = f.read()
payload = {'message': 'commit message', 'content': base64.b64encode(content).decode(), 'branch': 'main', 'sha': 'SHA_HERE'}
with open('/tmp/p.json','w') as f: json.dump(payload,f)
"
curl -s -X PUT -H "Authorization: token TOKEN" -H "Content-Type: application/json" \
  --data @/tmp/p.json \
  "https://api.github.com/repos/abdullahshahid9999-hub/ewts/contents/PATH"
```

---

## 12. OWNER'S INSTRUCTIONS FOR YOU (AI)

- Write clean, working code. If something cannot be verified (no DB access, no browser), say so clearly but do not refuse to write the code.
- Never guess at business logic — if a rule is ambiguous, state your assumption and flag it for the owner to confirm.
- Always add `export const dynamic = "force-dynamic"` to every GET API route.
- Always use `requireAgent(req)` or `requireAdmin(req)` at the top of authenticated routes — never trust client-supplied IDs.
- Never let agent-submitted data touch `balance`, `creditLimit`, `tier`, or `commission` — always strip via `stripAgentWriteOnlyFields()`.
- Seat decrements and balance debits happen ONLY at issue time, inside a single `$transaction`.
- Commission is computed at booking creation and stored as a snapshot — never recomputed later.
- Match the existing portal CSS classes (`ap-*` for agent, `adp-*` for admin) — do not invent new class naming conventions.
- When you finish all tasks, give the owner a final **"Database Query / SQL to Run"** section at the very end of your response listing any `ALTER TABLE` or migration SQL that needs to be run manually in the database. The owner cannot run `prisma migrate` directly — all schema changes must be provided as raw SQL.

---

## 13. TEST CREDENTIALS

- Admin: `abdullahshahid9999@gmail.com` / `Ewtsbv64zo!25`
- Agent: `test-agent@ewts.local` / `Agentnldc37!73` / Code: `TEST01`

---

*This prompt was generated after reading the full repo state: schema.prisma, PROGRESS.md, 0-MASTER-INSTRUCTIONS.md, all key API routes, and all component/page files. It reflects the actual current state of the codebase as of July 2026.*
