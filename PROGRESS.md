# EWTS Platform — Progress Log

Full development history of the East & West Travel Services Next.js platform (`eastwestpk.com`). Each entry documents what was built, any schema changes, and pending migration SQL.

---

## Current Stack
- **Next.js 15** App Router, TypeScript
- **Tailwind CSS v4** + custom CSS design tokens
- **Prisma 6** ORM → PostgreSQL on Render (Basic 256MB)
- **Cloudflare R2** for all image/file uploads
- **Resend** for transactional email
- **JWT** auth — access token in React state, refresh token in httpOnly cookie
- **TOTP** 2FA via `otplib` + `qrcode`
- **Framer Motion** for scroll-reveal animations
- **tesseract.js** + `mrz` for client-side passport OCR

---

## Feature Log

### Foundation
- Next.js 15 App Router scaffold, Prisma + PostgreSQL setup, Tailwind v4, Cloudflare R2 integration, Resend email, JWT auth (agent + admin), bcrypt password hashing, refresh token rotation.

---

### Public Site

**Home Page**
- Emerald/brass design token system, ticket-stub search widget, per-service filter sidebars with auto-applying checkboxes, scroll-reveal animations via Framer Motion, Trustpilot badge.

**Umrah Packages**
- Package listing with room type filter (Quad/Triple/Double/Single inline to package creation), seat-hold booking modal (2hr atomic hold), auto-email confirmation on booking.

**World Tours**
- Tour package listing + detail pages, per-room-type pricing, booking flow.

**Group Flights**
- Nested airline → route → flight table, filters (region, trip type, departure date, airline), B2C booking modal with PNR capture + 2hr seat hold + auto-email.

**Insurance**
- Live premium calculator, booking form with traveller count.

**Visa**
- Per-traveller wizard, passport OCR auto-fill (tesseract.js + MRZ parsing), image quality pre-check, category/nationality scoped document requirements.

**Blog**
- Admin-managed articles with R2 image upload.

**About**
- Hero slideshow, zigzag milestone timeline (2004–2026).

---

### Agent Portal

**Auth**
- JWT login with bcrypt verify, httpOnly refresh cookie, 15min access token, 30-day refresh, brute-force lockout (5 attempts → 15min lock), password reset via email token.
- **TOTP 2FA** — setup (QR code), enable/disable, verified at login with `__2FA_REQUIRED__` flow.
- **Staff Sub-User Login** — separate `agent_user` JWT role, `loginAsSubUser()` in `agentAuthClient`, "Staff Login" tab on login page. Sub-users share parent agency balance/bookings/commission.

**Dashboard**
- Prominent "Amount Payable" card (negative = owes office), date-range booking stats.

**My Bookings**
- Unified page — all service types, status filter, visual booking status timeline, booking detail expand.

**New Booking Hub**
- Cards routing to per-service booking pages.

**Per-Service Booking Pages**
- `/agent/umrah` — room type select, customer capture, sell price
- `/agent/tours` — tour + room type, traveller details
- `/agent/group-flights` — sticky live bill panel, OTP-gated issue, PNR expiry countdown, Print with/without Fare options, multi-leg aware
- `/agent/insurance` — plan select, sell price, traveller count
- `/agent/visa` — per-traveller wizard, passport OCR, category/nationality scoped docs

**Print Ticket**
- `/agent/bookings/[id]/print` — exact airline-ticket layout (agency logo, barcode, passenger table, itinerary table, T&Cs), pending=amber/issued=green status, multi-leg aware.

**Saved Clients**
- Client profile management with quick-fill on booking forms.

**Payment Slip (Top-up)**
- Agent submits bank transfer confirmation slip (image upload to R2), admin approves → balance credited.

**Finance / Ledger**
- Agent transaction history, running balance.

**Profile + 2FA**
- Profile edit, 2FA setup QR, enable/disable TOTP.

**Notifications**
- In-app bell icon, 30s polling, marks read on open. Triggered on: topup approval, booking issuance, visa decision.

**Mobile Optimisation**
- Topbar collapses at <480px (icon-only sign out, balance label hidden), page headers stack vertically, tables scroll horizontally.

---

### Admin Panel

**Agents**
- List view with one-click Deactivate/Activate toggle.
- `/admin/agents/new` — create agent.
- `/admin/agents/[id]/edit` — 4-section layout:
  1. **Agency Info** — name, phone, agency name, address, DTS license toggle + number, tier, status
  2. **Financial** — balance (negative = owes), credit limit
  3. **Commission Rates** — visual cards per service (Umrah, Group Ticket, Insurance, World Tour, Visa Services), set/update inline
  4. **Staff / Sub-Users** — add staff members with designation, set permissions per user (checkbox toggles), deactivate/activate, delete. `canIssueTickets` always forced OFF for sub-users.
- `/admin/agents/[id]` — full ledger (transactions + payment slips).

**Agent Bookings**
- All agent bookings across services, approve/issue workflow (ticket number required for group flights), OTP confirmation.

**Direct Bookings**
- Walk-in / public website bookings, tabbed by service type (Umrah / World Tours / Group Flights), per-tab status filter + count badge + Excel export.

**Packages**
- Umrah + tour package CRUD, room-type pricing (Quad/Triple/Double/Single) inline with shared `lib/packagePrice.ts` helper.

**Group Flights**
- Multi-leg flight creation, seat inventory management, region/trip-type tagging.

**Visa Services**
- Category + nationality document configuration, discount tiers.

**Visa Applications**
- Pipeline view — status tracking, tracking link/number, final document upload + email send.

**Insurance**
- Company → Plan → Rate matrix CRUD, application review.

**Payment Slips**
- Approve (credits agent balance) / reject flow.

**Finance**
- Real-time total receivables headline, date-range filtering.

**Bank Accounts**
- Manage bank accounts shown to agents on topup page.

**Blogs**
- Create/edit/delete posts with R2 image upload.

**Suppliers**
- Supplier management + transaction ledger.

**Admin 2FA**
- Admin TOTP setup.

---

## Pending Migration SQL

Run in Render Dashboard → PostgreSQL → Connect before next deploy if not already applied:

```sql
-- Sub-users (staff logins per agency) — REQUIRED for sub-user feature
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

-- Earlier migrations (run if not already applied)
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS ticket_number TEXT;
ALTER TABLE package_room_types ADD COLUMN IF NOT EXISTS available_slots INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS applicant_category TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS passport_expiry TEXT;
ALTER TABLE visa_applicants ADD COLUMN IF NOT EXISTS applicant_category TEXT;
ALTER TABLE visa_applicants ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE visa_applicants ADD COLUMN IF NOT EXISTS passport_expiry TEXT;
ALTER TABLE visa_required_documents ADD COLUMN IF NOT EXISTS applicant_category TEXT;
ALTER TABLE visa_required_documents ADD COLUMN IF NOT EXISTS nationality TEXT;
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
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS arr_time TEXT;
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'international';
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS trip_type TEXT DEFAULT 'oneway';
ALTER TABLE group_flights ADD COLUMN IF NOT EXISTS flight_no TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false;
```

---

## Session — 2026-08-13

### Visa Module Enhancements (commit 7eba462)

**Visa Listing page (`/visa`)**
- Added `VisaSearchBar` component: `Destination | Occupation | Travellers | 🔍` pill bar with pax dropdown (adults/children/infants counters), popular country chips (UAE, Thailand, Malaysia, Turkey, UK), keyboard search (Enter key), and route push with URL params.
- Search bar embedded in hero section; pax counts passed through to visa detail links.

**Visa Detail page (`/visa/[id]`)**
- Complete redesign of right sidebar: **Mosafir-style fare card** with dark header (Fare Details / Service charges included), per-row breakdown (Adult Price × N, Child, Infant, Service Charges = Included), dark total bar with PKR total + person count + Apply Now button, WhatsApp button below total, per-person pricing tiers (Adult/Child/Infant mini cards).
- Pricing section removed from left panel (it was duplicating the right card) — left panel now has: Quick Facts, Services Included checklist, Documents Required, Terms, Refund Policy.
- Apply Now → links to new `/visa/[id]/apply` page (passes pax counts in query).

**Apply Page (`/visa/[id]/apply`)**
- Full-page multi-step wizard at `/visa/[id]/apply?adults=N&children=N&infants=N`.
- Step 0: Contact info (name, phone, email) + traveller count selector (Adults/Children/Infants with +/− counters, age labels, estimated total preview).
- Steps 1..N: Per-traveller form — **adult order first, then children, then infants**. Each traveller collects: Surname, Given Name(s), Date of Birth, Nationality, Passport Number, Date of Issue, Date of Expiry (with 6-month warning), Passport Issuing Country, Occupation (adults only).
- Per-traveller document uploads with **passport OCR auto-fill** (Tesseract.js MRZ scan) — auto-fills name, passport number, expiry, nationality. All fields remain editable after OCR.
- Documents scoped to applicant category + nationality via `filterDocsForApplicant()` — same logic as agent portal.
- Step bar shows all steps; completed steps shown with ✓.
- Review step: contact summary + per-traveller detail cards (name, passport, nationality, DOB, expiry, issuing country) + charges breakdown (per age group × count) + grand total + "Payment collected in-person" notice.
- Submit → `POST /api/visa-applications` with per-traveller data (trav_0_N_* fields, travdoc_0_N_docId files).
- Success screen with batch reference + WhatsApp follow-up link.

**No schema changes required** — all existing `visa_applications`, `visa_applicants`, `visa_application_documents` tables support this flow.

---

## Rules (apply every session)

- `npx tsc --noEmit` clean before every commit (one pre-existing TS7031 in `app/api/admin/agents/route.ts` is known — ignore)
- Commit as **Abdullah Shahid** (`git config user.name "Abdullah Shahid"`)
- Commit in logical chunks, push after each chunk
- `npx prisma generate` is blocked in sandbox — every schema change needs manual SQL on Render Postgres console
- Always use `UUID` type (not `TEXT`) for columns referencing `id` fields
- Always use `IF NOT EXISTS` in migration SQL
- Never guess business logic — ask if ambiguous
- Never implement payment processing (explicitly out of scope)
- Never trust client-submitted prices — always recompute server-side
- WhatsApp = `wa.me` link only. No automatic sending (no Meta Cloud API)
- All image uploads via `uploadToR2()` in `lib/r2.ts`, env var `R2_PUBLIC_URL`

---

*East & West Travel Services — Faisalabad, Pakistan*
*Developer: Abdullah Shahid*

---

## Session — 2026-08-14

### Umrah Package Card V2 Design (commit ac94fd7)

**Schema** — 15 new columns on `packages` table (see Migration SQL below):
- `card_version` TEXT DEFAULT 'v1'
- `makkah_hotel`, `makkah_hotel_distance`, `makkah_hotel_nights` INT, `makkah_hotel_img`
- `madinah_hotel`, `madinah_hotel_distance`, `madinah_hotel_nights` INT, `madinah_hotel_img`
- `flight_type`, `luggage`, `transport_type`, `total_seats` INT, `seats_booked` INT DEFAULT 0

**New component** — `components/UmrahCardV2.tsx`:
- Seats remaining badge (totalSeats − seatsBooked)
- "UMRAH PACKAGE" badge + tier badge
- Package name + includes subtitle
- 4-pill info row: Duration / Makkah Hotel (+ distance) / Madinah Hotel (+ distance) / Airline + route
- Hotel photo cards side-by-side (R2 images, distance badges, short description)
- Specs block: Airline, Flight Type (pill), Route, Luggage, Transport, Hotel nights + distance, Visa note
- Price + CTA (View Details or WhatsApp)

**Admin form** (`/admin/packages`):
- Card Design Version radio: V1 (classic) / V2 (detail card)
- V2 section (conditionally shown): Makkah Hotel name/distance/nights/photo, Madinah Hotel name/distance/nights/photo, Flight Type, Luggage, Transport Type, Total Seats
- Hotel images uploaded to R2 `packages/hotels/` folder

**Routing logic** (admin-controlled, user cannot override):
- `pkg.cardVersion === "v2"` → renders `UmrahCardV2` on both `/umrah` (public) and `/agent/umrah`
- All other packages → existing V1 card unchanged

---

## Session — 2026-08-19

### Fix: Visa Requirement Doc Edit + Occupation Categories (commit c6e5da9)

**Root cause of client issue:**
Admin had added an NTN document scoped to `business_owner` occupation on the Thailand visa (likely copy-pasted from UAE setup). When a businessman selected "Business Owner" occupation, the NTN doc appeared — but Thailand visa doesn't need NTN. Admin had no way to edit the doc's occupation scope without deleting and recreating it.

**Fix 1 — Edit button for saved requirement docs** (`app/admin/visa-services/page.tsx`):
- Added ✏️ edit button next to each saved requirement doc in the visa edit form
- Clicking it opens an inline edit panel with all fields: icon, name, description, occupation scope (dropdown), nationality scope, required/optional toggle, allowMultiple toggle
- Save calls PATCH `/api/admin/visa-services/[id]/documents/[docId]` (already existed)
- Cancel returns to read view without changes
- State: `editingDocId` + `editingDocForm` added to component

**Fix 2 — Occupation categories expanded** (`lib/visaApplicantCategory.ts`):
- `business_owner` label changed to "Business Owner / Businessman" (same value, no DB change)
- Added `self_employed` → "Self Employed / Freelancer"
- Added `housewife` → "Housewife"
- Covers more real-world cases that were being shoe-horned into "Other"

**No schema changes. No SQL needed.**

**Immediate action for owner:**
1. Go to Admin → Visa Services → Edit Thailand visa
2. Find the NTN / business document in the requirements list
3. Click ✏️ → change "Occupation" scope to "All occupations" (blank) OR delete it entirely
4. Save — that client can resubmit without the NTN block


---

## Session — 2026-08-21

### Context
Pulled remote (10 commits ahead) — remote already had applied_via/supplier_name/applied_notes text panel AND a full email system, upload token, /visa/track page. Merged those in and reconciled schema conflict (removed my FK-based supplierId approach, kept remote's simpler text-based supplier_name).

### SQL to run on Render (if not already run for remote commits)
Check if columns exist before running — remote commits may have already prompted these:

```sql
ALTER TABLE visa_applications
  ADD COLUMN IF NOT EXISTS applied_via     TEXT,
  ADD COLUMN IF NOT EXISTS supplier_name   TEXT,
  ADD COLUMN IF NOT EXISTS applied_notes   TEXT,
  ADD COLUMN IF NOT EXISTS upload_token    TEXT;
```

### What this session fixed (commits 147f7bc, c6e5da9, b9ad0e4, 563474f)
- visa apply 500 error: uuid cast fix in raw SQL
- allowMultiple doc uploads: File[] array, indexed form keys
- Edit button for visa requirement docs
- Occupation categories expanded (Businessman, Self Employed, Housewife)
- Merged remote applied_via supplier panel + email system


---
## Session — Umrah Listing Overhaul (commit b31c661)

### What was built
- **Slug**: 6-char random alphanumeric auto-generated on form open (same format as PNR). Regenerate button. Manually editable, max 12 chars. API also generates if blank.
- **Room types — create mode**: Fixed 4 rows (Quad 4 pax / Triple 3 pax / Double 2 pax / Sharing 6+ pax). Leave price blank = room not offered, not saved to DB. Display price = lowest filled price, auto-computed.
- **Room types — edit mode** (`PackageRoomTypesManager`): Same 4 canonical rows with per-row Save button. Blank price on an existing row = prompts delete. Custom/legacy room types shown in a separate table below.
- **Image upload/URL toggle**: Cover image, Makkah hotel photo, Madinah hotel photo — all three have 📁 Upload / 🔗 URL toggle. Both POST and PATCH API routes handle `imageUrl`, `makkahHotelImgUrl`, `madinahHotelImgUrl` as URL fallbacks when no file is uploaded.

### No SQL needed
All changes are frontend/API only — no schema changes.

---
## Session — Umrah Listing Overhaul (commit b31c661)

### What was built
- **Slug**: 6-char random alphanumeric auto-generated on form open (PNR-style). Regenerate button. Manually editable, max 12 chars. API generates if blank.
- **Room types — create mode**: Fixed 4 rows (Quad / Triple / Double / Sharing). Blank price = not offered, not saved. Display price = lowest filled, auto-computed.
- **Room types — edit mode** (PackageRoomTypesManager): Same 4 canonical rows, per-row Save. Blank price on existing row = delete. Custom/legacy rows in separate table.
- **Images Upload+URL**: Cover, Makkah hotel, Madinah hotel — all have Upload/URL toggle. POST + PATCH APIs handle imageUrl / makkahHotelImgUrl / madinahHotelImgUrl as URL fallbacks.

### No SQL needed — no schema changes.

---
## Session — Flight System (commit ce80ad6)

### What was built
- **Airport autocomplete** — 7000+ airports offline (OpenFlights dataset), instant search by IATA/city/name
- **Airline logos** — Kiwi CDN, auto-detect from flight number prefix (PK→PIA, EK→Emirates etc.)
- **FlightSectorsEditor** — Departure/Via/Arrival rows, + button for via flights, flight no → airline logo, 🔍 lookup button calls AviationStack → auto-fills time + airports
- **FlightStatusBadge** — live status badge on B2C + B2B detail pages (Scheduled/In Air/Landed/Cancelled)
- **AviationStack multi-key rotation** — add AVIATIONSTACK_API_KEY_2, _3 etc. for more quota
- Admin packages form now shows flight sectors for ALL categories (was hidden for umrah)

### Render env var to add
AVIATIONSTACK_API_KEY=11af670c1dcde301c3c1135b34c30740

### No SQL needed.

---
## Session — Umrah Step Library (commit 8f0464a)

### What was built
- **Umrah Step Library** `/admin/umrah-steps` — list page, drag-to-reorder, show/hide, delete
- **New/Edit step** — title, description, image (upload or URL), tag (makkah/madinah/transit/activity/flight/hotel), sort order
- **Package itinerary editor** — datalist dropdown suggestions from library, ↓ button auto-fills description
- AdminSidebar: "📋 Umrah Steps" link added under Packages

### SQL to run on Render (PostgreSQL → Connect):
```sql
CREATE TABLE IF NOT EXISTS umrah_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tag TEXT NOT NULL DEFAULT 'activity',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---
## Session — Packages Form Overhaul (commit ce6894d)

### What was built
- **packages/page.tsx** — list only, "New Package" button top-right, inline Rooms manager toggle
- **packages/new** — step 1: category (Umrah/Tours/Custom) + card style (V1 Classic/V2 Detail Hotel) selector, then form
- **packages/[id]/edit** — edit page using shared PackageForm
- **PackageForm component** — clean sectioned form:
  - Flight sectors auto-derive duration/dates/airline/route/destination/departureCity
  - V1: text hotels + includes/excludes; V2: hotel name/pic/distance/nights per city, no includes/excludes
  - Room pricing in create mode only (edit = use Rooms button on list page)
  - Itinerary with library autocomplete datalist
  - Images: upload + URL toggle everywhere
- **Umrah Steps page** — tag filter chips, emoji icon fallbacks, better empty state

### No new SQL needed.

---
## Session — 2026-08-31

### Fix: Hotel images lost on edit + Child with/without bed split pricing (commit 9aa7ad8)

**Bug 1 — Hotel images not showing in V2 card**

Root cause: `PackageForm.tsx` initialized `makkahHotelImgUrl` and `madinahHotelImgUrl` as `""` 
(hardcoded blank) regardless of whether editing an existing package. On any edit save without 
re-uploading the photo, nothing was sent to the API, and `makkahHotelImg: undefined ?? undefined` 
caused Prisma to skip the field — image URL wiped from DB.

Fixes:
- Pre-populate `makkahHotelImgUrl`/`madinahHotelImgUrl` from `existing?.makkahHotelImg` on load
- Send logic simplified: always send URL if present (new file upload takes priority), 
  regardless of upload/url mode toggle — preserves existing R2 URL on edit

**Bug 2 — Child with/without bed prices not captured**

Root cause: Admin form had single "Price/Child" field → always saved as:
  `pricePerChildWithBedPkr = perChild, pricePerChildWithoutBedPkr = 0 (hardcoded)`
Users booking a child without bed always saw price Rs. 0 — misleading or wrong.

Fixes in `PackageForm.tsx` + `PackageRoomTypesManager.tsx`:
- `RoomPrices` / `RowState` types: replaced `perChild` with `perChildWithBed` + `perChildWithoutBed`
- Room pricing UI: 5 columns now (Person / Child WITH Bed / Child WITHOUT Bed / Infant / Slots)
- Grid template updated in both components
- Payload assembly maps both values to `pricePerChildWithBedPkr` and `pricePerChildWithoutBedPkr`
- API routes (`room-types/route.ts`, `room-types/[roomTypeId]/route.ts`) already handled both 
  fields correctly — no API changes needed

**No schema changes. No SQL needed.**

**Action for owner:**
- Go to Admin → Packages → edit any V2 package → re-save room types with correct 
  Child WITH Bed and Child WITHOUT Bed prices
- Hotel images: if they went missing, re-upload once — will persist on all future edits

**Other bugs noted (not crashes, deferred):**
- `package.seatsBooked` (V2 card badge) only incremented by agent bookings, not B2C bookings.
  B2C uses `packageRoomType.availableSlots` instead. Seat display may be under-counted.
  Low priority — can align later if needed.
