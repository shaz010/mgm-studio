# Your Salon — POLISH-BOARD 🎯

Living roadmap. **Tackle in exact tier order.** Payments/banking are deliberately OUT (PCI/processor licensing — track money, never move it).

_Current builds: 💰 app v1.44 · 📅 appt v4.43 · 🚪 salon v0.8_

---

## 🥇 TIER 1 — Quick wins, big trust (DO FIRST)
- [ ] **Tax-year export** — one tap → clean CSV/PDF of income by year for the accountant
- [ ] **Global search** — find any client or booking instantly
- [ ] **Privacy line + support contact** — "your data's yours, never sold" + support email _(NEED Shaz's email)_
- [ ] **Bulletproof signature redraw** — consent record must never flash blank (timing/canvas-size fix)

## 🥈 TIER 2 — Smart queries / reports
- [ ] **Insights dashboard** — income by month/quarter · top services by revenue · busiest days & times · tips trend · avg ticket
- [ ] **Win-back list** — clients with no visit in 60/90 days
- [ ] **Birthdays this month** — from DOB → personal text → rebookings
- [ ] **Retention** — new vs returning, rebooking rate

## 🥉 TIER 3 — Engine health / reliability
- [ ] **Trade-switch freeze** — _NEED repro detail: does the background animation stutter when it freezes?_ (suspect: WARP starfield pegging CPU during rebuild)
- [ ] **Wire commission % everywhere** — kill leftover hardcoded 60/40 so any split works
- [ ] **Link clients by ID, not name** — stops dupes/mismatches across rooms

## 🛡️ TIER 4 — Handling sensitive data like a pro (now storing consent, health flags, DOB)
- [ ] **Per-client export / delete data** — privacy best practice + trust
- [ ] **Short privacy statement** surfaced in-app
- [ ] **Tighten Firestore rules** + store only what's needed

## 🎨 TIER 5 — Look & feel polish
- [ ] **Consistency pass** — spacing, type scale, colour tokens (eye-safe, no heavy animation)
- [ ] **Teaching empty states** + smooth transitions
- [ ] **Refresh book.html** to match the new brand

## 🌱 TIER 6 — Growth (no payments)
- [ ] **Aftercare / consent PDF** to hand the client
- [ ] **Copy-a-message generator** — win-back / reminder text (no SMS infra)
- [ ] **Review-request nudge**

---

## ⏳ Parked / backlog
- [ ] "Salon owes me" → tap Tips → drill-down of every tip (who/when/how much)
- [ ] "Salon earnings" breakdown duplicated in spots — rethink/replace
- [ ] Legacy cp_appts editing (pencil/trash removed from Earnings ledger)

## ✅ Recently shipped
- Cloud sync (email login, merge-safe) — salon v0.7 → v0.8
- Tap-outside-to-close + keyboard-aware fields — app v1.43 / appt v4.41
- Client profile pane (replaced salon-earnings aggregate) — appt v4.42
- Trade-specific client cards, all 9 trades, research-backed — app v1.44 / appt v4.43
- Hair type/condition now structured (part of trade fields)
- New "Your Salon" home-screen icon (gold tile + dark sparkle)

---

## 📌 Need from Shaz
1. **Support email** (for Tier 1 privacy/trust line)
2. **Freeze repro detail** — next time it happens, does the background animation stutter?

## 🚫 Out of scope (by decision)
- Banking / payment processing / direct deposits (PCI, licensing, liability). Link out to Stripe/Square if ever needed; the app only *tracks*.
