# EWTS Handoff Prompt — East & West Travel Services

## First step (mandatory)
```bash
git clone https://ewadmin:GITHUB_TOKEN@github.com/abdullahshahid9999-hub/ewts.git
cd ewts
npm install
```
Replace `GITHUB_TOKEN` with the token the owner provides.
Then: `git log --oneline -10` and `tail -150 PROGRESS.md` for full context.
**Do NOT redo what's already done — read before building.**

## What this project is
Full travel agency web app: `eastwestpk.com` (live on Render).
- Public B2C site (no accounts — WhatsApp-first)
- Agent portal (`/agent/*`) — travel agents book for clients, earn commission
- Admin panel (`/admin/*`) — business owner manages everything

**Stack**: Next.js 15 App Router, TypeScript, Tailwind v4, Prisma, PostgreSQL (Render), Cloudflare R2 (images), Resend (email).

## What's already built (do NOT rebuild)
1. **Public site** — Home, About, Contact, Umrah, Tours (detail pages + room-type booking + 2hr seat hold), Group Tickets (nested airline/route table, filters, B2C booking with PNR + 2hr seat hold + auto email), Insurance (calculator + booking), Visa (per-traveller wizard, OCR passport scan, category/nationality scoped docs), Blog
2. **Agent portal** — Login, Dashboard (payable, date-range stats), My Bookings (unified page, service filter), New Booking hub (cards for each service), per-service booking pages: `/agent/umrah`, `/agent/tours`, `/agent/group-flights`, `/agent/insurance`, `/agent/visa` — each mirrors the public UX but adds agent sell price + customer/traveller capture
3. **Admin panel** — all content CRUD (packages, visa, group flights, insurance, blogs, bank accounts), agents management, agent bookings (approve/issue — requires ticket number for group tickets), payment slips, direct bookings, finance page
4. **Inventory holds** — group-ticket seats and Umrah room-type slots both decrement atomically at booking creation (2hr hold, auto-released if not confirmed)
5. **Print Ticket** — `/agent/bookings/[id]/print` — exact airline-ticket layout (agency logo, barcode, passenger table, itinerary table, T&Cs), pending=amber/issued=green status, multi-leg aware
6. **Trustpilot badge** — on Home + About pages
7. **Domain live** — `eastwestpk.com` and `www.eastwestpk.com` on Render

## Key architecture decisions (don't change without reason)
- Agent `balance` is negative when agent owes the office. Deducted at **issue** time (`sellPrice - commission`), credited when admin approves a payment slip.
- Commission is snapshotted at booking creation — never retroactively changed.
- All image uploads go to Cloudflare R2 via `lib/r2.ts` (`uploadToR2()`). Env var is `R2_PUBLIC_URL` (not `R2_PUBLIC_BASE_URL`).
- Agent access token in React state only (never localStorage). Refresh token in httpOnly cookie.
- Email via Resend (`lib/email.ts`). "Automatic WhatsApp" is NOT implemented — no paid Business API. All WhatsApp is `wa.me` link (user taps Send). Don't promise automatic WhatsApp.

## Pending DB migrations (run before testing new features)
Owner runs these via Render dashboard → PostgreSQL → Connect:
```sql
-- Group flights / bookings
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS ticket_number TEXT;
ALTER TABLE package_room_types ADD COLUMN IF NOT EXISTS available_slots INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Visa category/nationality
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS applicant_category TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS passport_expiry TEXT;
ALTER TABLE visa_applicants ADD COLUMN IF NOT EXISTS applicant_category TEXT;
ALTER TABLE visa_applicants ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE visa_applicants ADD COLUMN IF NOT EXISTS passport_expiry TEXT;
ALTER TABLE visa_required_documents ADD COLUMN IF NOT EXISTS applicant_category TEXT;
ALTER TABLE visa_required_documents ADD COLUMN IF NOT EXISTS nationality TEXT;

-- Visa tracking
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS tracking_country TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS tracking_link TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS final_document_url TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS final_document_sent_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS visa_discount_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_travellers INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Agent details
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS room_type_label TEXT;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS insurance_plan_label TEXT;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 1;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS infants INTEGER DEFAULT 0;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS travellers JSONB;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP;

-- Insurance
CREATE TABLE IF NOT EXISTS insurance_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_id UUID NOT NULL REFERENCES insurance_rates(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  travellers INTEGER NOT NULL DEFAULT 1,
  total_price_pkr INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Group flights
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS arr_time TEXT;
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'international';
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS trip_type TEXT DEFAULT 'oneway';
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS flight_no TEXT;
```

## Known open items / stubs
- **Print Invoice** — layout stubbed. Owner will send a reference image. See `app/agent/bookings/[id]/print/page.tsx` — `handlePrintInvoice()` shows a placeholder, `// TODO` comment is there.
- **Automatic WhatsApp** — not possible without Meta Cloud API credentials (paid). Don't build it speculatively.
- **Test data cleanup** — owner wants to clear test bookings. SQL: `TRUNCATE TABLE bookings, agent_bookings, agent_transactions, agent_otps, payment_slips, travellers, visa_applications, insurance_applications CASCADE;`

## Rules (followed by every session before this one)
- `npx tsc --noEmit` clean before every commit (the one pre-existing TS7031 in `app/api/admin/agents/route.ts` is known, harmless, ignore it)
- Commit in logical chunks, push after each chunk
- Update `PROGRESS.md` at session end with what was built + any new migration SQL
- Never guess business logic — ask the owner if a rule is ambiguous
- Never implement payment processing (explicitly out of scope — "payment pipeline baad mein jorenge")
- Don't trust client-submitted prices for anything that touches the DB — always recompute server-side
