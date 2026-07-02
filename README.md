# EWTS — East & West Travel Services (rebuild)

Ground-up rebuild of eastwestpk.com: public website + agent portal + admin panel,
in one Next.js repo, backed by PostgreSQL via Prisma.

See the brief files (given alongside this repo) for full specs:
- `0-MASTER-INSTRUCTIONS.md` — shared conventions, schema contract, build order
- `1-public-website-prompt.md`
- `2-agent-portal-prompt.md`
- `3-admin-panel-prompt.md`

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL (Render/Neon) via Prisma ORM
- Custom JWT auth (bcrypt + jsonwebtoken) — no third-party auth provider
- Cloudflare R2 for file/image storage
- Resend (or similar) for OTP emails
- Deploy target: Render (or Vercel for the Next.js app) + Cloudflare DNS/CDN in front

## Structure
```
prisma/schema.prisma   — canonical DB schema (all three apps share this)
lib/prisma.ts          — Prisma client singleton
lib/auth.ts            — password hashing + JWT sign/verify + admin allow-list check
app/                    — public website routes (/, /umrah, /tours, /visa, ...)
app/agent/              — agent portal routes (/agent/login, /agent/dashboard, ...)
app/admin/              — admin panel routes (/admin/login, /admin, ...)
app/api/                — API route handlers
```

## Setup
```bash
npm install
cp .env.example .env      # fill in real values
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Status
- [x] Next.js + TypeScript + Tailwind scaffold
- [x] Canonical Prisma schema (matches existing production field names)
- [x] Auth utility library (JWT + bcrypt + admin allow-list)
- [ ] Public website pages + read-only API routes
- [ ] Agent portal: login, OTP flow (server-side), booking flows, dashboard
- [ ] Admin panel: login, content management, agent management, image upload
- [ ] Cloudflare R2 upload integration
- [ ] Deploy to Render, connect Cloudflare DNS, domain cutover

## Security rules (non-negotiable — see individual briefs for full detail)
- OTP codes are generated AND verified entirely server-side. Never client-side.
- Every write route (agent or admin) verifies a valid JWT server-side before
  touching the database. Admin routes additionally check `ADMIN_EMAILS`.
- Money fields (`balance`, `credit_limit`, `tier`, `commission`) are only ever
  written by admin-authenticated routes — reject any agent-scoped request that
  tries to touch them, regardless of what the client sends.
- All Prisma queries are parameterized by default — never build raw SQL
  strings from request input.
