# Sales Dashboard — Date-wise Money Owed/Receivable (Admin + Agent)

## First step
Clone repo, read `PROGRESS.md` + `git log -20` for context. A basic
`/admin/finance` page already exists (`app/admin/finance/page.tsx` +
`app/api/admin/finance/route.ts`) — read it first, this task extends it,
doesn't replace it.

## The problem, in the owner's words
Right now there's no single place that clearly shows:
- **Admin side**: total money the business is owed right now (across all
  agents, all services) — needs to be visually distinct/obvious ("Total"
  styling, not buried in a table).
- **Agent side**: how much that specific agent currently owes the
  business ("Major" — i.e. the outstanding/payable amount) — same idea,
  needs to be obviously labeled, not just a balance number in a sidebar.
- Both sides need to filter by date range (tenure) — "show me this for
  last week / this month / a custom range," not just an all-time total.

## What to build

### 1. Admin: `/admin/finance` — extend, don't rebuild
Add:
- A date-range filter (from/to, plus quick presets: Today, This Week,
  This Month, All Time) that re-queries the existing breakdown/balances
  data scoped to `AgentBooking.createdAt` within that range.
- A prominent "Total Receivable" figure — sum of outstanding balances
  across all agents with `balance < 0` (i.e. they owe the company) that
  are still unpaid — styled as the clear headline number of the page, not
  just another table column. Use the existing `adp-sc` stat-card pattern,
  but make this one visually the largest/most prominent (e.g. spans two
  columns or sits alone at the top).
- Keep the existing service-wise and per-agent tables below it, just
  scoped to the selected date range.

### 2. Agent: extend `/agent/dashboard` or `/agent/profile`
Add a clearly-labeled **"Amount Payable"** card — the agent's own
outstanding balance owed to the company (this is just their `balance`
when negative, already available via `/api/agent/profile` — no new
backend needed for the number itself, just needs its own prominent card
rather than being one line among several). Add the same date-range filter
scoped to that agent's own `AgentBooking` rows, so they can see "what do
I owe from bookings made in [date range]."

### 3. Backend
`/api/admin/finance` needs a `from`/`to` query param support, filtering
the underlying `AgentBooking.findMany` calls by `createdAt`. Check
whether a similar date-scoped query is needed on the agent side (likely a
small addition to `/api/agent/bookings` — it may already support this,
check first) or a new lightweight endpoint.

## Don't do
- Don't change how balance/commission is calculated — this is a display/
  filtering feature, not a finance-logic change.
- Don't let agents see other agents' figures — every agent-side number
  must be scoped to `requireAgent(req).id`, same as the rest of the agent
  API surface.

## When done
Type-check clean, update PROGRESS.md, commit in logical chunks (backend
date filter first, then admin UI, then agent UI).
