# East & West Travel — Agent Portal Rewrite (Next.js + Custom Backend)

## Context
You are rebuilding the **Agent Portal** for East & West Travel Services — the tool travel agents use to book Umrah packages, group flight tickets, and insurance on behalf of customers, track their commission balance, and request issuance. Full ground-up rebuild in a **brand-new repo**, engineered to feel like a best-in-class B2B travel platform — fast, bulletproof-secure, and polished enough that agents never want to go back to the old version. This is ONE of three separate rebuilds (public site / agent portal / admin panel) happening independently — do not assume the other two exist in this repo.

## Full stack (required)
- **Frontend**: Next.js (App Router), React.
- **Backend API**: Node.js/Express (or Next.js Route Handlers), hosted on **Render**.
- **Database**: **PostgreSQL** (Render managed or Neon) — shared schema with the other two rebuilds.
- **ORM**: **Prisma** — every query parameterized, no raw SQL string-building from user input, ever.
- **Auth**: custom JWT-based auth — NOT a third-party auth provider. Agent logs in with email/password:
  - Passwords hashed with **bcrypt** (never store or log plaintext).
  - On successful login, issue a short-lived **access token (JWT)** + longer-lived **refresh token**, refresh token stored as an httpOnly, secure, SameSite cookie (never in localStorage — that's readable by any injected script).
  - Every protected API route verifies the JWT server-side (signature + expiry) before touching the database.
- **File/image storage**: Cloudflare R2, for agent-uploaded documents (e.g. traveller passport copies) if applicable — access-controlled, not public, since these are personal documents (unlike the public site's images).

## Design system (preserve exactly)
- `Cormorant Garamond` (display) + `Plus Jakarta Sans` (body/UI).
- White/light theme with a dark navy gradient sidebar (~`#071120` → `#0A1930`) and gold accents (~`#D4A843`). Cards get real elevation (soft shadows, not flat borders only). The balance figure in the sidebar is the single most important number on the page — give it a visually distinct highlighted panel.

## Pages / routes
- `/login` — sign-in + forgot-password (OTP flow, see below)
- `/` — dashboard: balance, quick stats, recent activity
- `/bookings` — bookings list with category tabs (All/Umrah/Group Tickets/Insurance) **AND** status tabs (All/Pending/Confirmed/Issued/Cancelled) combined with proper AND-filter logic — build the combined filter state as one query object from day one, don't let two separate filter functions silently overwrite each other.
- `/book/umrah`, `/book/group-tickets`, `/book/insurance` — booking flows
- `/profile` — agent details, password change

## Core business logic (non-negotiable, hard-won rules from the previous system)
1. **Balance is debited only at actual issuance**, which happens on the admin side — never when the agent first submits a booking. When it does happen, it's the **net amount** (after commission), never gross.
2. **Booking expiry timers**: internal inventory = 30 minutes to request issuance; supplier-API-backed bookings = the supplier's own limit minus a 3-minute safety buffer. Live countdown per booking; expired bookings become non-actionable and visually distinct.
3. **Issue Request is OTP-gated** (see security section — this is the most important part of this brief).
4. **`service_type` values**: exactly `umrah`, `group_ticket`, `insurance` — snake_case, exact strings, consistent with the admin panel's schema.
5. Agents can never write their own `balance`, `credit_limit`, or `tier` — enforce this at the API layer (the route handler simply refuses to accept those fields from an agent-authenticated request), not just by hiding the input in the UI.

## Security requirements — THE most important section in this brief
The old version's OTP flow was generated and verified **client-side**, meaning anyone with browser devtools could read or forge codes, and a separate endpoint could be hit directly to send arbitrary branded emails to any address. Build this correctly from day one:

1. **OTP generation and verification happen entirely on the backend.**
   - `POST /api/agent-otp/request` — authenticated route (valid JWT required). Generates a cryptographically random 6-digit code (`crypto.randomInt`), stores it (with an expiry timestamp and an `attempts` counter) in a database table, and emails it via a transactional email provider (Resend, SendGrid, etc.) to the agent's **registered email on file** — never an email address passed in the request body.
   - `POST /api/agent-otp/verify` — checks the submitted code against the stored value server-side, enforces expiry (~10 min) and a max-attempts lockout (~5 tries), and marks the code used on success. Never expose the correct code to the client in any response.
   - Rate-limit OTP requests per agent (e.g. max 3 per 10-minute window), checked server-side against recent rows, not trusted from the client.
   - For pre-login password-reset OTPs, verify agent identity (agent code + registered email + phone match) server-side first, using a generic "no match found" error either way so the endpoint can't be used to enumerate valid agent codes/emails.
2. **JWT auth on every protected route** — validate signature and expiry server-side on every request; never trust a client-supplied "I am agent X" claim without verifying the token.
3. **All financially sensitive fields are backend-enforced**, not just UI-hidden: the API must reject any attempt by an agent-scoped request to modify balance/credit_limit/tier/commission fields, regardless of what the client sends.
4. Standard hardening: helmet.js-style security headers, CORS locked to your actual frontend origin (not `*`), rate limiting on auth endpoints specifically (login, OTP) to blunt brute-force attempts.

## Database tables this app touches (Prisma models)
- `agents` (own row only — enforced via JWT `agentId` claim matching the row)
- `agent_bookings` (create own, read own, status transitions per the issue-request flow)
- `agent_transactions` (read own — ledger/history)
- `agent_otps` (backend-only, never exposed via any client-reachable query)
- `group_flights`, `packages`, `insurance_plans`/`insurance_rates` (read, to populate booking flows)

## What NOT to build here
- No admin functionality (issuing bookings, managing agents, editing site content) — that's the admin panel rebuild.
- No public marketing pages — that's the public site rebuild.

## Deliverable
A new Next.js + Render/Postgres/Prisma repo with custom JWT auth and a properly backend-only OTP flow, replicating the full booking + issue-request + balance-tracking functionality — secure enough that the security section above is fully satisfied before this is considered done, ready for Cloudflare-fronted domain cutover after testing.
