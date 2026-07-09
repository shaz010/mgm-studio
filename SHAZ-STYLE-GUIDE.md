# SHAZ STYLE GUIDE — Your Salon PWA
> Standing preferences for all three rooms (app.html, appt.html, book.html).
> Apply these **proactively** — no need for Shaz to repeat himself.
> Last updated: 8 Jul 2026

---

## 👁 Eye & Legibility (highest priority)

- **Font weight ceiling: 600.** Never use 700+ for body/price/label text. 800 is acceptable only for section headers or CTA buttons.
- **Chip price badges:** no background, no border, no dollar sign — just the number in `#ffe566`, weight 600, ~11.5px. Bright and thin reads best.
- **All interactive buttons must be obviously tappable.** If it looks like a label it will be ignored. Minimum: visible border or background tint + bold text.
- **Dashed / muted borders = invisible to Shaz.** Never use `1px dashed` + `color:var(--muted)` for anything he needs to find. Use solid border + coloured text minimum.

---

## 🎨 Colour Conventions

| Element | Colour |
|---|---|
| Primary accent / gold | `var(--gold)` = `#d4af37` |
| Advanced settings toggle | `#a78bfa` (purple) — solid border, purple bg wash |
| Booking services section header | `#a78bfa` (purple) — distinct from gold sections |
| Per-group accents (curator + chips) | See palette below |

**Group colour palette** (used in both book.html chips and appt.html curator):

| Group | Colour |
|---|---|
| Cut | `#8FD17A` (green) |
| Color | `#d4af37` (gold) |
| Lights | `#a78bfa` (purple) |
| Styling | `#67e8f9` (cyan) |
| Extensions | `#f5a8ff` (pink) |
| Eyebrow | `#fb923c` (orange) |
| Other Chemical Services | `#4fd1c5` (teal) |
| Beard | `#94a3b8` (slate) |
| Treatments | `#60a5fa` (blue) |

---

## 🔘 Buttons & Controls

- **"Show advanced settings"** — always: `2px solid rgba(167,139,250,.45)`, `background: rgba(167,139,250,.08)`, `color: #a78bfa`, `font-size: 14px`, `font-weight: 800`. Both appt.html and app.html.
- **Per-group "More" expanders** — gold-bordered (`rgba(212,175,55,.38)`), gold bg wash, `font-weight:800`. Must be clearly visible, not muted.
- **Global "More services" pattern** — deprecated in favour of per-group expand (each group shows first 5, rest behind its own expand button).
- **CTA / primary buttons** — large tap target, high contrast, never ghost/outline-only unless secondary action.

---

## 📐 Layout & Spacing

- **Settings sections** — collapsible by default. Each section (`set-sec`) is gold + uppercase, cursor pointer. "Booking services" section gets purple accent to distinguish it.
- **Price pane in appt.html** — bigger/generous padding, readable row height. Not cramped.
- **Service chip groups** — each group collapsible, with group-icon coloured to group accent, chip count badge visible.

---

## ⚠️ Recurring Requests (Parking Points)

Things Shaz has had to ask for more than once — treat these as defaults:

1. **Visibility first.** If something is interactive, it must look interactive. When in doubt, make it bigger and brighter.
2. **No dollar signs on price displays** — just the number.
3. **Per-category colour distinction** — whenever showing a list of categories, give each its own colour so eyes can scan without reading.
4. **Advanced settings toggle** must be prominent in every settings panel — not buried, not muted.
5. **Font weight on badges/prices** — keep at 600, never heavier. Thin + bright > thick + dim.
6. **Collapsible panes** — when there are many items in a group, show a visible subset first with a clearly-labelled expand control.

---

## 🚢 Deploy Order

Always: **appt.html first → then book.html** (GitHub web drag-and-drop, one file at a time).
app.html is independent and can ship in any order.

---

## 🔧 Code Conventions

- VERSION format: `var VERSION='app v1.XX · description'` / `'book v3.XX · ...'` / `'v4.XX · ...'` (appt)
- Syntax check before every ship: extract `<script>` blocks → `/tmp/chk.js` → `node --check`
- Python string replacements: always use slice (`b[:si] + new + b[ei:]`) for multi-line JS blocks — never `.replace()` with inline JS containing quotes
- JS written to temp file (`/tmp/xxx.js`) via heredoc to avoid Python→JS quote-escaping
- `ap_prefs` localStorage = appt-specific prefs; `cp_prefs` = shared price/commission prefs
