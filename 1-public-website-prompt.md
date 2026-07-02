# East & West Travel — Public Website Rewrite (Next.js + Custom Backend)

## Context
You are rebuilding the public-facing marketing website for **East & West Travel Services**, a Faisalabad, Pakistan-based IATA/DTS-certified travel agency (est. 2003). This is a full ground-up rebuild in a **brand-new repo**, engineered to feel like a category-leading, best-in-class travel platform — not a template, not a typical agency site. The goal is a site that makes competitors look amateur: fast, polished, trustworthy, and technically airtight. This is ONE of three separate rebuilds (public site / agent portal / admin panel) happening independently — do not assume the other two exist in this repo.

## Full stack (required)
- **Frontend**: Next.js (App Router), React, deployed on Vercel or Render static/edge hosting.
- **Backend API**: Node.js/Express (or Next.js Route Handlers if you prefer one deployable unit), hosted on **Render**.
- **Database**: **PostgreSQL** (Render managed Postgres, or Neon — relational, because this business's data genuinely is relational: packages, flights, visas, insurance company→plan→rate hierarchies).
- **ORM**: **Prisma** — gives type-safe, automatically parameterized queries (this is the main defense against SQL injection; never hand-build raw SQL strings from request input).
- **File/image storage**: **Cloudflare R2** (S3-compatible object storage) for package photos, airline logos, blog covers, etc.
- **DNS/CDN**: **Cloudflare** in front of everything — domain is registered at Hostinger, but DNS is managed through Cloudflare for CDN caching, DDoS protection, and speed. Static assets and images should be cached aggressively at the edge.
- **Fonts**: `Cormorant Garamond` (display/headings, elegant serif, use italic weights for accents) + `Plus Jakarta Sans` (body/UI sans-serif) via Google Fonts or self-hosted for speed.

## Design system (preserve exactly — established brand identity)
- **Palette**: warm ivory/cream base (~`#F4F3EF`/`#FAFAF7`), near-black espresso text (~`#14142B`), gold accent (~`#D4A843`, hover `#F0C050`), soft warm-grey borders (~`#E4DFD4`).
- **Tone**: premium, trustworthy, understated. A 20+ year established family travel agency, not a flashy startup.
- Every interaction (hover, page transition, image load) should feel deliberate and smooth — this is where "market product, nobody can compete" actually gets built: not through gimmicks, through relentless polish (correct loading states, no layout shift, real skeleton loaders, optimized images via Next.js `<Image>`, sub-second perceived load times).

## Pages / routes
- `/` — Home: hero, Featured Packages (from `packages` where `featured = true`), service category highlights, trust signals (IATA/DTS certification, years in business, testimonials)
- `/umrah`, `/tours` — package listings (`packages` table, filtered by category)
- `/group-tickets` — group flight listings (`group_flights` table: route, dates, airline, seats, price)
- `/visa` — visa services (`visa_services` table)
- `/insurance` — insurance comparison, three-level: `insurance_companies` → `insurance_plans` → `insurance_rates` (ordered by price ascending — design the query with `ORDER BY price_pkr ASC`)
- `/blog` + `/blog/[slug]` — blog listing + individual posts (`blogs` table, only `published = true`)
- `/about`, `/contact` — company info, WhatsApp-first contact (no login/booking forms on public pages — every CTA opens `wa.me/<number>` with a prefilled message naming the specific package)

## API design (backend on Render)
Build a clean REST (or tRPC, if you want end-to-end type safety with the frontend) API:
- `GET /api/packages?category=umrah|tours&featured=true`
- `GET /api/group-flights`
- `GET /api/visa-services`
- `GET /api/insurance/companies`, `/api/insurance/plans`, `/api/insurance/rates`
- `GET /api/blogs`, `GET /api/blogs/:slug`

All of these are **public read-only** endpoints — no auth required, but still: use Prisma parameterized queries (never string-concatenate SQL), validate/sanitize any query params (category filters, pagination), rate-limit at the edge (Cloudflare) to prevent scraping/abuse, and only ever return rows where `status = 'active'` / `published = true`.

## Performance requirements (this is where you win against competitors)
- Server-render (SSG/ISR) the package listings and blog posts — revalidate periodically (e.g. every few minutes) since admin edits content, rather than client-side fetching everything on load.
- Optimize every image (Next.js `<Image>`, served from Cloudflare R2 via a CDN path, WebP/AVIF where supported).
- Featured Packages carousel on mobile: proper scroll-snap or a real carousel library — must pause cleanly on user touch, never fight the user's scroll gesture.
- Real Core Web Vitals discipline: no layout shift, fast LCP, minimal JS shipped to the client for pages that don't need interactivity.

## What NOT to build here
- No login, no booking forms, no OTP flows, no agent/admin functionality — those are the other two rebuilds.
- No writes to the database from this app at all — read-only public API.

## Deliverable
A new Next.js + Render/Postgres/Prisma repo that reads from the shared database (same schema used by the agent portal and admin panel rebuilds), production-grade in performance and polish, ready for Cloudflare-fronted domain cutover after testing.
