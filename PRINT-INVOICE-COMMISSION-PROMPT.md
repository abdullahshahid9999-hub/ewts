# Print Invoice + Ticketed-On Timestamp + Agent Logo Upload + Commission Fix

## First step
Clone repo (token given separately), read last ~30 lines of PROGRESS.md.
components/PrintTicket.tsx and app/agent/bookings/[id]/print already
exist from the earlier Print Ticket task — read them first, reuse as much
as possible.

## 1. "Ticketed On" timestamp missing
AgentBooking has no field recording WHEN it was actually issued — add:
```prisma
issuedAt DateTime? @map("issued_at")
```
Set this (server-side, new Date()) at the exact moment admin marks a
booking status = 'issued' (same place ticketNumber gets set — find
that code, add issuedAt: new Date() alongside it). On the printed
ticket/invoice, show it as "Ticketed On: [issuedAt]" — if null (not yet
issued), show blank, same as the existing "Not Confirmed" state handling.
Give the owner "ALTER TABLE agent_bookings ADD COLUMN IF NOT EXISTS
issued_at TIMESTAMPTZ;" as plain text.

## 2. Print Invoice — build the complete layout (reference attached separately)
Same header/passenger/itinerary sections as PrintTicket.tsx (reuse that
component's structure, don't duplicate the whole layout — extract shared
pieces into sub-components if that's cleaner, your call), PLUS a new
"Pricing & Fares" section below the itinerary:

Table columns: PAX Type | PAX No. | Per Person Fare | Total | Commission |
Net Payable — three rows (Adult, Child, Infant), then a "Grand Total" line
below the table.

Formulas (per row): Total = PAX No. x Per Person Fare.
Commission shown as "amount x count" (e.g. "15,000 x 1") — this is the
AGENT'S commission being subtracted, i.e. Net Payable = Total -
(commission per pax x PAX No.). Grand Total = sum of all rows' Net
Payable. Pull the actual fare/commission from AgentBooking.sellPrice /
AgentBooking.commission (already snapshotted at booking time — don't
recompute, this project's whole convention is that commission is a
snapshot, not live-recalculated) — if this booking's PAX breakdown
(adults/children/infants) plus a per-type fare isn't already stored in a
way that lets you reconstruct "Per Person Fare," check how sellPrice was
computed at booking creation and derive it consistently, or extend the
booking record if genuinely missing that granularity — note in
PROGRESS.md exactly what you found rather than guessing at numbers.

Wire this to a "Print Invoice" button (the earlier Print Ticket task
stubbed this as "Ticket not issued yet" pre-issuance — keep that same
pre-issuance behavior; this full layout only applies once status ===
'issued').

## 3. Agent logo: field exists, UI doesn't — add it in TWO places
Agent.logoUrl already exists in the schema but there is no way for
anyone to actually set it:
- Admin side (app/admin/agents/page.tsx): add a logo upload field to
  the agent create/edit form — same R2-upload pattern used elsewhere
  (packages, bank accounts): file input, compress client-side, upload
  via a server route using uploadToR2, store the returned URL. This is
  the primary path (admin sets up each agent's branding).
- Agent side (agent's own profile page, if one exists — check
  app/agent/profile or similar): optionally let the agent upload/change
  their own logo too, same pattern, admin-gated fields (balance, tier,
  etc.) stay untouched — only logoUrl is agent-editable here if you add
  this.
Show the logo (if set) next to the agent's name in the admin agents list,
and it should already flow into PrintTicket/PrintInvoice automatically
once set (those already pull Agent.logoUrl per the earlier task).

## 4. Commission workflow — verify and fix
Re-check the full chain end to end and fix anything broken:
1. Admin sets a commission rate per agent per service type
   (AgentCommissionRate — fixed PKR or %).
2. When an agent creates a booking, calculateCommission() (check
   lib/commission.ts) computes and snapshots commission on that
   AgentBooking row at creation time.
3. When admin marks the booking issued, the agent's balance should
   move by sellPrice - commission (net owed to office) — check
   PROGRESS.md for where this was wired (search for "netOwed" or similar)
   and confirm it's actually firing correctly, in a prisma.$transaction
   alongside the status/ticketNumber/issuedAt update, with a matching
   AgentTransaction audit row. Fix anything that doesn't match this.
4. Confirm the Print Invoice numbers (step 2 above) are pulling from this
   same snapshotted commission, not recalculating independently — two
   different commission numbers appearing in two different places would be
   a real bug.

## Rules
- npx tsc --noEmit clean before each commit.
- Commit in chunks: issuedAt field+wiring, Print Invoice component, agent
  logo upload (admin+agent), commission workflow fixes.
- Don't touch the public-facing site or unrelated admin pages.

## When done — explain the workflow back to the owner
In your final message, describe in plain terms how the full commission
flow now works end to end (rate set -> booking created -> snapshot ->
issuance -> balance/ledger update -> invoice display), so the owner has a
clear mental model, not just a changelog. Update PROGRESS.md, give all SQL,
commit, push, stop.
