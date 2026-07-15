# POLISH BOARD — updated 15 Jul 2026

## ✅ SHIPPED (round 1)
- sw.js v74 — mirror-hall bug fixed (ignoreSearch + iframe-aware fallback)
- salon.html — self-nesting guard (self-heals into last room)
- appt.html v4.53 — priority NEW BOOKING banner (top of everything, tap → inbox)
- appt.html — "More services" gold + bolder
- book.html v1.9 — bigger section headers, gold "Add your own" / "Been here before", keyboard tap-away
- app.html v1.68 — keyboard tap-away

## ✅ SHIPPED (round 2 — trade flow)
- appt v4.54 + app v1.69 — all 9 trades now LIVE inside Settings ▸ My trade
- appt v4.54 — Price Book ▸ Change: Back or pick now RETURNS to Price Book
- appt v4.54 — BUG FIX: duplicate id="confirmModal" — renamed to bookConfirmModal

## ✅ SHIPPED (round 3 — AT freeze + paygate)
- app.html v2.34 — AT freeze fix on iPhone in ER
  - ROOT CAUSE: `loadAll()` + `renderTable()` full DOM rebuild fired on every
    `roomShown` message, blocking main thread 4–7 seconds on iPhone
  - FIX: localStorage fingerprint (`_apptFP`) — O(1) check of cp_appts +
    ap_appts string lengths + tails. If data unchanged since last load,
    `roomShown` skips `renderTable()` and only runs `calc()` instead
  - WARP canvas was investigated and ruled out (running=false always, never
    causes paint work)
- app.html v2.35 — paygate polish
  - ✂ scissors → ✨ sparkles (brand mark, trade-neutral)
  - Email copy: "emailed to you automatically — usually within minutes"

## ❌ ABANDONED — Zapier automation (15 Jul 2026)
**What we tried:** Stripe payment → Zapier → Google Sheets (lookup + mark used) → Gmail send code

**Why abandoned:** Zapier multi-step Zaps require a PAID plan (~$29/month).
Free tier only supports 1-step Zaps. We didn't find this out until after
building and testing all 4 steps. ~2 hours lost.

**LESSON: Always check pricing/plan limits BEFORE building any third-party
automation. Ask: "does the free tier support multi-step workflows?"**

**What WAS completed (don't redo):**
- Google Sheets "CommissionPro Codes" spreadsheet created with 20 codes
  (VELVET01–GILT20), columns: Code / Used / Buyer Email / Date
- Zapier Zap built and tested successfully (all 4 steps passed)
- ⚠️ VELVET01 was marked TRUE during testing — reset it to FALSE in Google
  Sheets before going live

## 📌 OPEN — Code delivery automation (free alternatives to explore)

### Option A — Make (formerly Integromat) — FREE TIER
- Make's free plan supports multi-step scenarios (1000 ops/month)
- Same flow: Stripe trigger → Google Sheets lookup → Sheets update → Gmail
- Worth trying first since the Sheets + Gmail logic is already tested

### Option B — Google Apps Script + Stripe Webhook — FULLY FREE
- Apps Script is free, built into Google Sheets
- Stripe sends a webhook (POST) on payment
- Need a public URL to receive it — options:
  - Google Apps Script Web App (deploy as web app = free public URL ✅)
- Script: receive webhook → find next unused row → mark used → send email via
  MailApp (built-in, free)
- More setup but zero ongoing cost, no third-party dependency

### Option C — n8n (self-hosted) — FREE but complex
- Open-source Zapier alternative, can self-host for free
- Overkill for this use case

**Recommended path:** Try Option A (Make) first — easiest, free tier covers
low volume. If it has limits that hurt, fall back to Option B (Apps Script).

## 📌 OPEN / FUTURE (ongoing)
- Banner only fires while Appointments is OPEN. True push when closed = Web
  Push (iOS 16.4+ PWA) — later wall, pairs with Firebase sync
- Optional: soft chime on new request (needs a user tap first per iOS audio rules)
- app.html "function start" duplicate = known scope-local false positive

## ⚠️ OPS WATCHLIST
| Item | Deadline | Notes |
|------|----------|-------|
| 🌐 Domain renewal | ~June 2027 | getcommissionpro.com, Namecheap |
| 📧 ICANN email verify | 15 days from new domain | Missed once → site suspended |
| 🛡️ Firestore rules | No expiry allowed | Test-mode rules expire |
| 🔒 SSL / GitHub Pages | HTTPS enforced | If DNS reverts → domain issue not code |
| 💳 Stripe account | Health / payout status | Paywall depends on it |

## Engine health (fix when opportunity arises)
- Some commission math still hardcodes 60/40 instead of reading prefs.rate
- Tips colour in ER summary cards needs its own distinct colour (not green)
- cp_appts legacy key retirement — monitor for remaining reads
- earnTabsWrap not sticky — low priority
