# Fix: Agent Balance Doesn't Move On Sale + No Topup Flow + Dashboard Missing Sales Data

## First step
Clone repo, `git log -20` + PROGRESS.md for context. These are 3 confirmed
bugs (verified by reading the code, not guessed) — fix in this order.

## Bug 1: Selling never changes seats/payable (root cause)
`app/api/agent/bookings/route.ts` — booking creation computes `commission`
and stores it on the `AgentBooking` row, but **never touches
`Agent.balance`**. That's why the owner sees no payable change after a
sale. (Seat decrement for group tickets was already fixed in a prior
session — confirm that fix actually reached the live DB: it needs
`price_per_child_pkr`, `flight_sectors`, `bookings.children` migrations
run first, listed in PROGRESS.md. If those never ran, check whether that
blocks unrelated inserts too.)

**Fix**: in the same transaction that creates the `AgentBooking`, increment
`Agent.balance` by the commission amount (this is what the agent is owed
— or, if the business model is "agent collects full sellPrice from
customer and owes the company sellPrice minus commission," clarify which
direction with the owner before coding — **this is a real business-logic
decision, don't guess it**). Write an `AgentTransaction` row alongside it
(model already exists, same pattern as the payment-slip-approval credit
in `app/api/admin/payment-slips/[id]/route.ts` — copy that transaction
pattern).

## Bug 2: No agent topup flow exists at all
Checked: `PaymentSlip` rows are never created anywhere in the codebase.
The admin approve/reject route
(`app/api/admin/payment-slips/[id]/route.ts`) works, but nothing ever
feeds it — it's a dead end.

**Build**:
- `app/api/agent/payment-slips/route.ts` — POST, `requireAgent`-gated.
  Agent submits: amount, and an uploaded slip image (reuse `uploadToR2`
  pattern from admin routes, `folder: "payment-slips"`). Creates a
  `PaymentSlip` row with `status: "pending"`.
- `app/agent/topup/page.tsx` (or a section on `/agent/profile`) — form:
  amount + image upload (client-side `compressImage` before upload, same
  as admin image fields), submit, shows pending/approved/rejected history
  for that agent (`GET` their own slips — add agentId scoping to a new or
  existing route, `requireAgent`, never another agent's slips).
- Confirm the existing admin approval flow
  (`app/api/admin/payment-slips/[id]/route.ts`) actually credits
  `Agent.balance` correctly once real slips exist — re-test it, it was
  built against a flow that never had real data flowing through it.

## Bug 3: Admin dashboard doesn't show sales/receivable data
`/admin/finance` exists and has the numbers, but `/admin/dashboard`
(the actual landing page after login) doesn't surface any of it — the
owner has to know to click into Finance separately.

**Fix**: pull the "Total Receivable" figure (and maybe today's/this
week's booking count) into `/admin/dashboard` itself as a stat card at
the top, above the section-links grid. Don't duplicate the finance
query logic — either fetch from the existing `/api/admin/finance` route,
or extract its core query into a shared function both routes call.

## Order to build in
1. Bug 1 first (balance-on-sale) — the topup flow in Bug 2 is meaningless
   without agents actually accumulating payable balances to top up
   against.
2. Bug 2 (topup flow).
3. Bug 3 (dashboard surfacing) — cosmetic/placement, do last.

## Don't do
- Don't guess the commission-vs-full-price balance direction in Bug 1 —
  ask if PROGRESS.md/schema comments don't already make it unambiguous.
- Don't build a second payment/balance system — reuse `AgentTransaction`
  and the existing `PaymentSlip` approval pattern exactly.

## When done
Type-check clean, test the full loop mentally: agent sells → balance
moves → agent submits topup with slip → admin approves → balance moves
back → dashboard reflects all of it. Update PROGRESS.md, commit in the
3-bug order above, not one giant commit.
