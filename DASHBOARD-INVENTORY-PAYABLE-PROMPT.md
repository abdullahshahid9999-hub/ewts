# Admin Dashboard Stats + Seat Inventory + Agent Payable/Top-Up Ledger

## First step
Clone repo (token given separately), read last ~30 lines of `PROGRESS.md`
only. Do not run a general audit — this is one focused task with 3 parts.

## Part 1 — Admin Dashboard shows real numbers
`app/admin/dashboard/page.tsx` currently just links to sections, no live
data. Add a stats row at the top: total agents, total pending agent-bookings
(status='pending' or 'issue_requested' — these need admin attention), total
packages/flights/visas (active count), total revenue this month (sum of
issued AgentBooking.sellPrice), total payable owed by all agents combined
(sum of negative Agent.balance, see Part 3). Pull via a new
`GET /api/admin/dashboard-stats` route (admin-gated, one query per stat,
straightforward Prisma counts/aggregates — don't overengineer this).

## Part 2 — Selling a group flight ticket must decrement seats
Right now, `GroupFlight.seats` never changes when an agent books one.
Fix: when an `AgentBooking` with `serviceType = 'group_ticket'` and a
`groupFlightId` is ISSUED (status changes to `'issued'` — find wherever
that status transition happens, likely an admin "issue" action route),
decrement that flight's `seats` by 1 (or by a passenger-count field if one
exists — check the booking creation flow for how many seats one booking
represents, likely 1 unless there's a travellers count).

**Prevent overselling**: when an agent tries to CREATE a group-ticket
booking, check `seats > 0` on that flight first and reject with a clear
error if sold out — do this check in the existing
`app/api/agent/bookings/route.ts` POST handler. Use a transaction
(`prisma.$transaction`) for the decrement-on-issue step so two simultaneous
issues can't both succeed past the seat limit (race condition).

## Part 3 — Agent payable ledger (this is the core of what's missing)
Business rule (already established earlier in this project, just not fully
wired up): agent collects payment from the customer directly, then OWES the
office the sell price minus their commission. This should show up as a
debt (negative balance / "payable") the moment a booking is ISSUED — not
at booking creation, not at payment. Find wherever the admin "issue" action
sets `AgentBooking.status = 'issued'` and, in that same transaction:
1. Compute `netOwed = sellPrice - commission` (commission is already
   snapshotted on the booking per earlier work — use that, don't
   recompute).
2. Decrement `Agent.balance` by `netOwed` (balance going more negative =
   more owed to office; if agent balance represents credit differently in
   the existing schema, check `Agent.balance`'s actual sign convention in
   PROGRESS.md/schema comments before assuming — match what's already
   there, don't invent a new convention).
3. Create an `AgentTransaction` row: `{ agentId, amount: -netOwed,
   type: 'debit', note: 'Booking issued: ' + bookingRef }` so there's an
   audit trail.

## Part 4 — Agent top-up (paying down what they owe)
This is the reverse flow, and the building block already exists:
`PaymentSlip` (agent submits proof of payment) + `payment-slips` admin
page (admin reviews). Wire it so that when admin APPROVES a payment slip
(find that action in `app/admin/payment-slips/page.tsx` /
`app/api/admin/payment-slips/[id]/route.ts`):
1. Increment `Agent.balance` by the slip's `amount` (reduces what they owe).
2. Create an `AgentTransaction`: `{ agentId, amount: +amount, type: 'credit',
   note: 'Payment slip approved: ' + slipId }`.
If this crediting logic already exists, verify it's correct rather than
duplicating it.

## Rules
- Every balance change must go through `AgentTransaction` — no silent
  `Agent.balance` updates anywhere, the ledger must be reconstructable.
- Use `prisma.$transaction` for any operation that touches both a status
  field and a balance/seats field together, so they can't go out of sync.
- If you find the `status = 'issued'` transition doesn't exist yet as a
  distinct admin action (i.e. admin has no explicit "Issue" button/route),
  that's a bigger gap — stop and note it in PROGRESS.md rather than
  inventing the whole issuance UI speculatively; ask the owner in your
  final message whether that flow needs building first.

## When done
`npx tsc --noEmit` clean, update PROGRESS.md with what was wired up, give
any required `ALTER TABLE` SQL as plain text if a field's sign convention
needed a schema note (not a new column, this should mostly be logic-only).
Commit, push, stop — don't expand into other features.
