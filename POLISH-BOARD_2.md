# ✨ POLISH-BOARD — Your Salon (ER / app.html)
_Last updated: 2026-07-14_

---

## ✅ Done this session

| Version | What shipped | File |
|---------|-------------|------|
| v2.12 | Ghost picker fix — tutorial picker (cpPickerSheet) opens/closes instantly, no transition, no timing race window | app.html |
| v2.13 | Feedback door in tutorial picker — "Suggest an addition" button → noir overlay → mailto pre-filled to chabokchamejun@gmail.com | app.html |
| v2.14 | iPad scroll fix — `showTab()` resets scroll to top on every tab switch; `setFilter()` scrolls filter-row into view. Fixes "Salon owes me stuck" + filter buttons out of reach | app.html |
| v2.15 | tutAt AT button — holographic gradient border, idle opacity .78→.95, `atGlow` pulse animation, backdrop-filter dropped during drag for smooth tracking on iPad | app.html |

---

## 🧠 Architecture notes (stay sharp)

- **ER tutorial is intentionally simpler than AR** — 4-step fullscreen tour + WIT mode. AR has the full multi-level coach-mark walkthrough. They complement, not duplicate.
- **tutAt z-index: 799** — sits above most panels but below payGate (99990), erase modal (100050), and search overlay (1200). Settings forces it hidden.
- **In-shell behaviour** — when ER loads inside salon.html iframe, `html.in-shell` is set. `showTab('hist')` is forced on load. New booking posts a message to parent instead of opening the booking form.
- **Default tab state** — `cp_tabs_col` in localStorage. Defaults to collapsed (`null !== '0'` = true). This is by design.

---

## 💡 Decisions locked

- **Trial period: 21 days** — long enough to cover 3 full working cycles, short enough to create genuine decision pressure while the habit is fresh. 30 days risks decision fatigue and delayed commitment.
- **Day 14–15 nudge** — warm in-app reminder (not pushy) showing the user their own earnings total as the proof point: "You've tracked $X this month — here's what happens when you unlock." Build this alongside the trial countdown.

---

## 🔲 Outstanding / to watch

- [ ] Engine health: some commission math still hardcodes 60/40 instead of reading `prefs.rate` / `window.MY_RATE` — systematic fix pending
- [ ] Tips colour in summary cards — should have its own distinct colour, not share green with "You"
- [ ] `cp_appts` legacy key retirement — Earnings is transitioning to read from `ap_appts` (Appointments source of truth). Monitor for any remaining cp_appts reads
- [ ] Feedback door (v2.13) — watch for first incoming suggestions, consider whether a native in-app list view is worth adding later
- [ ] earnTabsWrap scroll behaviour — tabs bar is not sticky; on a very long scroll the tab buttons disappear. Low priority for now since earnTabsBar chip + expand is visible. Revisit if users report confusion.
- [ ] **Trial countdown UI** — 21-day free trial timer, visible but not intrusive. Build alongside day 14–15 in-app nudge showing user's own earnings total as the conversion hook.

---

## 🌐 Ops watchlist

| Item | Deadline | Status |
|------|----------|--------|
| Domain renewal (getcommissionpro.com, Namecheap) | ~June 2027 | ✅ Active |
| Firestore security rules | No expiry | ✅ Permanent rules in place |
| SSL / GitHub Pages HTTPS | Ongoing | ✅ |
