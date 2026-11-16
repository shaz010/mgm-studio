# YOUR SALON PRO — HANDOFF
**Last updated: Nov 16, 2026 · evening PT**
Read this first in any new session about Your Salon Pro (the live app and the site).

This file is the canonical handoff. Two older copies were **not** rewritten on Nov 16 and still describe September:

- `your-salon-apple-handoff.md` — Sep 29 App Store notes. It still says the app was rejected / waiting on review. That is out of date. Use this file for current status.
- `your-salon-google-play-handoff.md` — Android. Still parked. See the roadmap below.
- `Claude outputs/SHAHZAD_GAME_HANDOFF.md` is the Grain game, not this app.

---

## Current state

**App Store: 1.1 is live**, released around Oct 18–23, 2026. It is not in review. The old rule “hands off App Store Connect until Apple replies” applied while 1.0 was in the queue. That queue is finished. Do not treat “Waiting for Review” as the current state.

**Local Xcode: 1.2, build 8, is on the Mac and is not uploaded.** It is not the live App Store build.

**Web is what the installed app loads.** `main` on GitHub deploys to GitHub Pages at getcommissionpro.com. Merging to `main` goes live. On `main` right now, after the audit log (PR #6): Earnings v2.64, Appointments v6.25, salon v0.53, service worker `yoursalon-v78`, booking v3.55. This change ships when it is merged:

| Room | File | Version in this change |
|---|---|---|
| Earnings | `app.html` | v2.65 |
| Appointments | `appt.html` | v6.26 |
| Shell | `salon.html` | v0.53 (unchanged; `SHELL_V` matches the page) |
| Service worker | `sw.js` | `yoursalon-v79` |
| Booking page | `book.html` | v3.56 |

Shared settlement math: `yoursalon-settle.js`. Check: `yoursalon-settle.test.js`.

Web-only edits show up in TestFlight and the installed app after the page reloads (about a couple of minutes, then swipe-kill and reopen). A native Swift change still needs a new Xcode archive. The next archive would be after the unreleased 1.2 build 8, not “build 8” itself.

App Review mail goes to **shahbazmirshahi@mac.com**, not the Gmail.

---

## Nov 16, 2026 — what PR #2 changed

Settlement only. No native build. No partial payments, no frozen rates, no audit log (those are the next steps).

**Owner’s rule.** Only appointments whose status is `done` count toward what the salon owes him. That is commission **and tips**. Cancelled, no-show, and still-confirmed appointments do not change the owed total, the month rows, the invoice, tax-year income, or the Insights money cards.

**Manual Earnings entries still count.** Rows in `cp_appts` (typed in on the Earnings form) usually have no status. They were logged as finished charges, not as scheduled appointments, so a blank status still counts and old totals stay put. If one of those rows has an explicit status, that status is respected. An Appointments row (`ap_appts`) with no status is treated as confirmed, the way that room already did, and does not count until it is closed.

**Needs closing.** A confirmed appointment whose local date and time have already passed shows a short list in Earnings (under “Salon owes me”) and in Appointments. Each row has one tap: Mark Done, No-show, Cancelled. The tap writes `ap_appts` through the Appointments save path, including the stock update when that room is open, so sync keeps working. If the booking has a duration, the list waits until that window ends, so a client still in the chair is not flagged as forgotten.

**Local dates.** A calendar day or month uses the device’s local date, not `toISOString()`. The owner is in Pacific time. This covers “today”, the default date on a new earnings entry, the week and month filters, and the same date helper in Appointments. “Mark this month paid” was removed when payments were added. The week filter still starts on Sunday, and it starts at local midnight instead of “now”, so a Sunday booking stays in “this week” after noon. `book.html` already used local dates.

**Cents and the split.** “Salon owes me” shows cents and matches the breakdown under it. The stylist’s share is rounded to the cent. The salon’s share is the remainder, so the two shares add up to the charge (a 50% split of $33.33 is $16.67 and $16.66, not two rounded halves). Appointments `takeHome()` uses that same split. The math is integer cents in `yoursalon-settle.js`.

**Small fixes in the same PR.** Changing the commission rate uses the in-app confirm, because `confirm()` can fail silently in the iOS web view. The shell version string was corrected to match the page.

Run the check with `node yoursalon-settle.test.js`. Run it again with `TZ=America/Los_Angeles` to cover the evening of the last day of the month (local November, UTC already December).

---

## Roadmap — not in PR #2

**Step 2 — running-balance ledger. Shipped and live (PR #5).**

Clarified Nov 16, 2026: salon payments are not a monthly settlement. They may arrive daily, weekly, or monthly, for any amount. A payment is the date the money was received and the amount received. It is not tied to a settlement month. A month label, if shown, is derived from that date. It is not required.

- `cp_payments` records, in integer cents: id, `amountCents`, date received (local `YYYY-MM-DD`), method (`cash` / `check` / `transfer` / `other`), optional note, `createdAt`.
- Balance = total owed for Done work (commission + tips) minus payments that have not been voided. The Salon owes me screen shows owed, paid, and still due. A negative balance is a credit.
- Day, week, and month are views of what was earned and what was received in that period. The headline balance stays the all-time number.
- Record a payment defaults the amount to whatever is still due and the date to local today. “Mark this month paid” is gone.
- Void a payment. Do not delete it. A voided row stays in the history (`voided`, reason, `voidedAt`) and drops out of the balance.
- Each old `cp_paid` flag becomes one payment so the balance does not jump. The flag meant that month’s Done total was paid and stored only a timestamp, so the amount is that total and the date is the timestamp already saved. The month is only an optional label. Note: `Migrated from Mark paid`. Id: `mig-cp_paid-YYYY-MM`. Running it again, or on another device, does not add a second copy. New payments do not need a month.
- The split is frozen when an earnings entry is saved or an appointment is marked Done (`splitPct` plus the cent amounts). A later rate change does not rewrite that work. The first time this version runs, existing finished work is stamped with the **current** rate, because nothing older stored a rate and the app had been showing today’s rate on all history. That keeps the numbers he already sees, and only new work follows a new rate.
- Invoices list payments received that month and the all-time balance still due.
- `cp_payments` is in the shell `SYNC_KEYS`. Records merge by id. If both devices have the same payment, the one with the later `updatedAt` wins, so a void is not undone by an older copy.

**Step 3 — audit log. Built in the audit pull request (lands on `main` when that pull request is merged).**

Follow the money for a date: what changed, who was paid, and the balance before and after.

- Append-only. Events are never edited or deleted. They are stored by month (`ys_audit_YYYY-MM`) so one cloud document does not grow without a bound. Months are listed in `ys_audit_months`. Sync unions events by id and keeps the original if both devices have the same id.
- Each event has an id, a timestamp, the device’s local date and time, a type, what it refers to, a plain summary, before/after for the fields that matter, a source (`earn`, `appt`, or `shell`), and an actor (the signed-in email, or “this device”).
- Recorded: creating, editing, and deleting an appointment; status changes, including the needs-closing taps; price and tip changes; a payment recorded or voided; the one-time mark-paid migration; split and name/salon setting changes; backup restore; erasing data on the device; deleting the account.
- “What happened” on the Salon owes me screen: pick a date, and optionally an end date. Events are in time order. That range also shows Done work with the frozen split, tips, payments received, and the running balance before the first day and after the last day.
- CSV export of payments, appointments (with the frozen split and cent amounts), and the audit log, filtered to the same dates. It uses the share sheet when the phone allows files, and a single download otherwise. It does not use `alert()` or `confirm()`.
- Deleted appointments get a tombstone (`ys_tombstones`). Sync unions those by id. After a merge, a tombstoned appointment is removed again, so another device or an older cloud copy does not bring it back. The deletion is also in the audit log.

The existing owner unlock is unchanged. It is not synced, not written into the audit log, and not described in the app.

## Nov 16, 2026 — Stripe and booking deposits removed

Shahbaz sells Your Salon only through the App Store. He does not take booking deposits. The booking page is a request form again: name, phone, service, time, then send. There is no card step.

- `book.html` no longer loads Stripe.js, no longer has the publishable key, and no longer calls `createPaymentIntent`.
- Appointments publish still writes the public salon profile (hours, services, prices, taken slots). The same write now deletes `stripeSk`, `stripePk`, `depositAmount`, and any other field whose name contains “stripe” or “whsec”. That scrub runs the next time the owner publishes, which the appointments page already does when hours or services change. Until then, a secret already stored on `public/{salonId}` is still readable, because rules cannot hide one field.
- `functions-index.js` no longer contains `createPaymentIntent`. The function that is already deployed stays in Firebase until Shahbaz runs:

```
firebase functions:delete createPaymentIntent --project telemetry-eagle
```

Do not deploy functions. Do not deploy rules. Nothing in this change was deployed.

- The App Store paywall stays. On iPhone it buys `com.yoursalon.pro.monthly` through StoreKit. The old Stripe Checkout URL in the paywall was not used by that button; it has been removed. `thankyou.html` no longer links to a Stripe payment page.
- The five-tap owner unlock is unchanged.

**Shahbaz still has to do these by hand:**

1. In the Stripe dashboard, revoke `rk_live_…Z84J` (it is in public git history, in `MGMStudio.html` from June 15, 2026) and any other live or restricted keys for this account.
2. Run the `firebase functions:delete` command above, from a machine where he is logged in.
3. Open the appointments page once while signed in, so the publish scrub deletes Stripe fields off the live `public/{salonId}` document.

Firestore rules are a separate pull request and are not deployed. That request still refuses client writes that set a secret field. Clearing those fields (this publish) has to stay allowed, or the scrub and the rest of the publish would be rejected together.

**Later.**

- Sync delete-tombstones, so a delete on one device is not brought back by an older copy on another.
- Firestore security rules are in a separate pull request. They are not deployed. A secret must not be stored on `public/{salonId}`.
- Google Cloud billing free trial may have expired around **Oct 8, 2026**. If sign-in or sync is down, check billing. The Spark free tier was expected to cost nothing at this scale, but the trial itself needed a billing account on the project.
- Android stays parked. Closed testing still wanted 12 opted-in testers, and that was not pursued. Android users can install the PWA from Chrome. Details from September are in `your-salon-google-play-handoff.md`.

Account deletion that Apple asked for shipped in the shell (salon v0.50, still in the live app): cloud pill → Delete account. The Earnings “Delete my account” button still only clears local storage. It does not delete the Firebase user.

---

## How we test

- iPhone checks happen in the TestFlight build (internal group “Shaz Dev”), which loads getcommissionpro.com/salon.html.
- A web push does not need a new Xcode build.
- Native changes: archive from the real Xcode project, then TestFlight, then the store. Local unreleased build is 1.2 (8).
- Screen recordings for Apple: record in the TestFlight app. App Store Connect rejects an uppercase `.MP4` extension; use lowercase `.mp4`.

---

## App Store Connect facts

- App ID **6796050684** · bundle `com.getcommissionpro.yoursalon`
- Subscription product `com.yoursalon.pro.monthly` (group 22292515), **$4.99/mo, first month free**
- Live store version is **1.1** (about Oct 18–23, 2026). Store builds through 7 were the 1.0 submission. Local Xcode is **1.2 build 8**, not shipped.
- Privacy Policy URL https://getcommissionpro.com/privacy.html · EULA is the Apple standard
- Privacy label: Email Address, Other User Content, User ID (app functionality, linked to the user, no tracking)
- Team `M9N8RZNXP3` · Apple ID on the project is shahbazmirshahi@mac.com
- Don’t use an “Apple Distribution” cert with automatic signing on Xcode 26; it rejects that. A registered device is required to archive.

The September 2026 review (submission `2e5902ac-e4fd-4c4d-8aa5-513b73907f3c`) is history: Sep 14 rejected 3.1.2(c) and 2.1(a); Sep 24 rejected 5.1.1(v) for missing account deletion; salon v0.50 added in-app deletion and 1.1 later shipped. Do not follow the old “upload v0.50, then do not touch App Store Connect” checklist.

---

## Ops

- Domain getcommissionpro.com renews about June 2027 (Namecheap).
- Firestore rules: console only, not this repo. Keep them permanent (no expiring test rules).
- `privacy.html` still opens with “does not collect any personal data”. Optional Firebase sync does collect an email. Soften that line sometime.

---

## Mac and the old push notes

The logged-in Mac user `shahbazmirshahimac.com` has an empty Xcode shell under Desktop. The real project (Swift files) is under the other account `shahbazmirshahi`, at `~/Desktop/Your Salon/Your Salon Pro/`.

The Sep 29 “copy files into ~/Downloads/mgm-push and push from Terminal” bridge is how edits were shipped from that Mac. It is not how this repo’s cloud sessions push. Cloud sessions commit on a branch and open a pull request. **Do not merge to `main` unless the owner asked** — `main` deploys the live site.

Harmless leftovers on the Mac, delete whenever: `project.pbxproj.bak-*` and `web-push/` under the Xcode project, and `~/Downloads/_to_delete/` from a broken clone on Sep 29.
