# Your Salon — Google Play Handoff
**Last updated:** September 1, 2026  
**Account:** chabokchamejun@gmail.com  
**Developer ID:** 4835349469847474845  
**App:** Your Salon — `com.getcommissionpro.yoursalon`  
**App ID in Play Console:** 4972990211916377897 (Note: earlier docs showed 4976005086325100849 — use 4972990211916377897)

---

## 🔑 CHROME ACCESS RULE — READ FIRST EVERY SESSION

**ALWAYS use `mcp__claude-in-chrome__*` tools to access Google Play Console, Apple App Store Connect, Reddit, and any logged-in site.**

- These tools access Shaz's **real Chrome browser session** — his cookies, his logins, everything.
- The browser panel in the app UI is **isolated** (different session, not logged in) — DO NOT use it or argue about login walls.
- Do NOT ask Shaz to log in anywhere. Use Chrome tools and navigate directly.
- Load tools with ToolSearch: `"select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__javascript_tool"`
- Google Play Console URL: `https://play.google.com/console/developers/4835349469847474845`

---

## Current Status (Sep 1, 2026)

| Item | Status |
|------|--------|
| Google identity verification | ✅ Done (Jul 21) |
| App created in Play Console | ✅ Done |
| Upload key | ✅ Reset Aug 4 → valid from Aug 7 |
| Android device verification | ✅ Confirmed done (Aug 10) |
| Closed testing approved by Google | ✅ Active — Beta 2, 172 countries |
| Closed testing opt-in link | ✅ LIVE |
| Testers opted in | ⏳ 0 of 12 needed |
| Reddit r/betatests post | ✅ Posted (Aug 7 original + Sep 1 new post with live link) |
| Closed testing (12 testers × 14 days) | ⏳ Waiting for testers |
| Production release | ⏳ Blocked until 12 testers × 14 days complete |

---

## Opt-In Links (LIVE — share these)

| Platform | Link |
|----------|------|
| **Android opt-in (recommended)** | https://play.google.com/store/apps/details?id=com.getcommissionpro.yoursalon |
| **Web opt-in** | https://play.google.com/apps/testing/com.getcommissionpro.yoursalon |

> Share the web opt-in link on Reddit, Instagram, TikTok, Facebook. Testers click it, hit "Become a tester", then install the app.

---

## The "Google Test" — What It Is

Google requires new personal accounts to complete **Closed Testing** before production:
- **12 testers** must opt in via the closed testing link (NOTE: earlier docs said 20 — Google confirmed 12 is the minimum)
- They must remain opted in for **14 days**
- Only THEN can Shaz apply for production access

Shaz posted to **r/betatests on Reddit (Aug 7)** — no opt-in link then. New post with live link posted Sep 1.

---

## Android Device Verification

✅ **Confirmed complete (Aug 10).** Play Console home screen shows: *"All of your apps have been successfully registered to meet Android developer verification requirements."* This is no longer a blocker.

---

## App Details

- **Package name:** `com.getcommissionpro.yoursalon`
- **Web origin:** `https://getcommissionpro.com`
- **App type:** TWA (Trusted Web Activity) wrapping the PWA at salon.html
- **Upload key reset:** New fingerprints (valid Aug 7+):
  - MD5: `0A:01:2D:5B:51:BC:10:FF:6F:1D:5B:7D:69:F6:FC:91`
  - SHA1: `17:D6:17:A5:81:64:97:03:3C:CD:39:9B:40:5B:85:C3:F0:CE:B3:89`

---

## Pricing / Monetization

- Google Play Billing policy: similar to Apple — if selling in-app subscriptions via Play Store, must use Google Play Billing (not Stripe) for in-app purchases
- **Current state:** web version uses Stripe; Android version billing setup not confirmed

---

## Next Steps (in order)

1. ✅ ~~Check Android developer verification~~ — confirmed done Aug 10
2. ✅ ~~Wait for Google to approve the closed testing review~~ — Beta 2 active
3. ✅ ~~Get the opt-in link~~ — both links confirmed live Sep 1
4. **Recruit 12 testers** — r/betatests post live Sep 1; update Instagram/TikTok/Facebook with live link
5. **Monitor tester count** — daily monitor scheduled (trigger ID: trig_01MaQbzvrLwWefkXMWmTyFhh) checks Gmail at 9am
6. Once 12 testers × 14 days → apply for production access
7. Check if `assetlinks.json` is live at `https://getcommissionpro.com/.well-known/assetlinks.json` (TWA requires this for URL bar to hide)
8. Address Google Play Billing if Apple IAP equivalent is needed

---

## Monitoring

- **Daily tester monitor** scheduled (trigger ID: trig_01MaQbzvrLwWefkXMWmTyFhh) — checks Gmail at 9am daily, push alert when 12 testers reached

---

## Key Links

- Play Console: https://play.google.com/console/developers/4835349469847474845
- App page: https://play.google.com/console/u/0/developers/4835349469847474845/app/4972990211916377897
- Closed testing track: https://play.google.com/console/u/0/developers/4835349469847474845/app/4972990211916377897/tracks/4700524375083021787?tab=testers
- Reddit post: r/betatests (posted Aug 7, updated Sep 1)
