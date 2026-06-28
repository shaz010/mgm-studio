# 🎨 Your Salon — Polish Board

*Our shared, never-forget list. Last updated: Jun 28, 2026*

---

## 📋 How this works
- **You** dump points anytime — rough is fine, just get them out of your head.
- **I** organize them here + re-paste the board at the top of each reply.
- **Together** we tackle in agreed order, checking each off ✅.
- This file is yours to keep — the source of truth across days & devices.

---

## 🟢 QUICK POLISH — small, safe, independent
*(can do these now, in any order)*

- [ ] **P1 — Appointments looks messy.** Earnings lands neatly; switching to Appointments looks untidy. → tidy the layout. `appt.html`
- [ ] **P4 — Charge doesn't clear on untap.** Tapping a service drops its charge into the field ✅, but *untapping* leaves the charge stuck until a new service is picked. Want: untap → charge clears cleanly. `app.html (confirm)`
- [ ] **P3a — Bring the "services dance" to Appointments.** Love how services animate onto the Service field in Earnings — want that on the Appointments side too. `appt.html`
- [ ] **P3b — Bring the lit/un-lit selection feedback to Appointments.** The chosen service lights up, untapping un-lights it — clear "here's exactly what you picked." Want this in Appointments too. `appt.html`

---

## 🔴 THE BIG ONE — Unified Data

### 🧭 BLUEPRINT (P5 — DECIDED ✅)
The spine: **two lenses on one shared set of bookings.**

- 📅 **Appointments = "the chair"** (the source record): client card/consent · price (set once) · new booking · inventory (product used per appt) · forward-looking preview stats (Booked/Chair/Expected/Take-home)
- 💰 **Earnings = "the books"** (the money lens): the *actual banked* ledger + money stats — reads from bookings, does the math
- 📦 **ONE shared box** feeds both. *Room-to-room sharing needs NO Firebase* — the rooms already share storage (one installed app). Firebase is only for cross-device (later).

### 🔨 HOW WE BUILD (evolve, don't big-bang)
1. **Design the shared record** — one "booking" shape both rooms agree on
2. **Wire both rooms to it** — Appointments writes, Earnings reads
3. **Remove duplicates** — strip the redundant copy from the wrong room
*Done in safe stages, each tested on phone before the next.*

### Moves to make (per blueprint)
- [ ] Client card/consent → Appointments (strip from Earnings)
- [ ] Price field → one place (Appointments sets it; Earnings reads)
- [ ] New Booking → Appointments (carry the nice Earnings format over)
- [ ] Inventory (product per appt) → stays/lives in Appointments
- [ ] Keep preview stats in Appointments + actual ledger in Earnings (same shared data, never disagree)
- [x] **P2 — bookings flow Appointments → Earnings** ✅ DONE (Stage 1, v1.33) — book in Appointments, shows in Earnings with split math

### Stage progress
- [x] **Stage 1** — Earnings reads the shared booking list ✅ (v1.33)
- [ ] **Stage 2** — One booking desk: Earnings' "New booking" jumps to Appointments
- [ ] **Stage 3** — Add tip + products to the record (settle-to-banked flow)
- [ ] **Stage 4** — Retire old separate list, remove duplicates, tidy

---

## ✅ DONE
- One App shell (salon.html) — Earnings ⇄ Appointments toggle
- Single clean "Your Salon" header, sparkles mark
- Double-decker removed, gear row slimmed
- Update banners hushed inside shell
- Trade syncs across rooms
- Installed to home screen
- Noir default for **both** rooms — v4.29

---

## 🗒️ Parking lot (raised, not yet scheduled)
- Home-screen icon: still the gold scissors — design a neutral "all trades" icon later
- Paywall model: currently gates only Earnings — rethink as ONE unlock for the whole app
- Cross-device sync (book from any device) — Firebase, the "Wall 2" job
- *"more points to cover"* — Shaz has additional items to add
