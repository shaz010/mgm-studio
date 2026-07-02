# POLISH BOARD — 2 Jul 2026

## ✅ SHIPPED (round 1)
- sw.js v74 — mirror-hall bug fixed (ignoreSearch + iframe-aware fallback)
- salon.html — self-nesting guard (self-heals into last room)
- appt.html v4.53 — priority NEW BOOKING banner (top of everything, tap → inbox)
- appt.html — "More services" gold + bolder
- book.html v1.9 — bigger section headers, gold "Add your own" / "Been here before", keyboard tap-away
- app.html v1.68 — keyboard tap-away

## ✅ SHIPPED (round 2 — trade flow)
- appt v4.54 + app v1.69 — all 9 trades now LIVE inside Settings ▸ My trade
  (big tap tiles, current one glows holographic, tap = instant switch, no navigation)
- appt v4.54 — Price Book ▸ Change: Back or pick now RETURNS to Price Book
- appt v4.54 — BUG FIX: duplicate id="confirmModal" meant the
  "Approved — let your client know" text-message sheet NEVER showed.
  Renamed to bookConfirmModal — approve flow now offers the SMS sheet.

## 📌 OPEN / FUTURE
- Banner only fires while Appointments is OPEN. True push when closed = Web Push (iOS 16.4+ PWA) — later wall, pairs with Firebase sync.
- Optional: soft chime on new request (needs a user tap first per iOS audio rules).
- app.html "function start" duplicate = known scope-local false positive.
