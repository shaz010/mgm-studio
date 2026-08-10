# Your Salon — Google Play Handoff
**Last updated:** August 10, 2026 (11:15am — closed testing submitted for review)  
**Account:** chabokchamejun@gmail.com  
**Developer ID:** 4835349469847474845  
**App:** Your Salon — `com.getcommissionpro.yoursalon`  
**App ID in Play Console:** 4976005086325100849

---

## Current Status (as of Aug 10)

| Item | Status |
|------|--------|
| Google identity verification | ✅ Done (Jul 21) |
| App created in Play Console | ✅ Done |
| Upload key | ✅ Reset Aug 4 → valid from Aug 7 |
| Android device verification | ✅ Confirmed done (Aug 10) |
| Closed testing submitted for review | ✅ Submitted Aug 10 — awaiting Google approval (1–7 days) |
| Closed testing opt-in link | ⏳ Will go live once Google approves the review |
| Closed testing (20 testers × 14 days) | ⏳ Blocked until opt-in link is live |
| Production release | ⏳ Blocked until 20 testers × 14 days complete |

---

## The "Google Test" — What It Is

Google requires new personal accounts to complete **Closed Testing** before production:
- **20 testers** must opt in via the closed testing link
- They must remain opted in for **14 days**
- Only THEN can Shaz apply for production access

Shaz posted to **r/betatests on Reddit (Aug 7)** to recruit testers. The clock only starts once testers click the opt-in link.

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

## Unknown / Needs Confirmation from Shaz

- How was the Android app built? (Bubblewrap? PWABuilder? Android Studio?)
- Is `assetlinks.json` deployed at `https://getcommissionpro.com/.well-known/assetlinks.json`?
- ~~Was Android device verification completed?~~ ✅ Yes — confirmed Aug 10
- ~~What track is the app on?~~ ✅ Closed testing – Alpha track, submitted for review Aug 10

---

## Pricing / Monetization

- Google Play Billing policy: similar to Apple — if selling in-app subscriptions via Play Store, must use Google Play Billing (not Stripe) for in-app purchases
- **Current state unknown** — web version uses Stripe; Android version billing setup not confirmed

---

## Next Steps (in order)

1. ✅ ~~Check Android developer verification~~ — confirmed done Aug 10
2. **Wait for Google to approve the closed testing review** (1–7 days from Aug 10)
3. Once approved → get the opt-in link from Play Console → Testing → Closed testing → Alpha → Testers tab → "Copy link"
4. Update social media posts (Instagram, TikTok, Facebook, Reddit r/betatests) with the live opt-in link
5. Recruit 20 testers — daily monitor scheduled to push alert when 20 reached
6. Once 20 testers × 14 days = apply for production access
7. Check if `assetlinks.json` is live at `https://getcommissionpro.com/.well-known/assetlinks.json` (TWA requires this for URL bar to hide)
8. Address Google Play Billing if Apple IAP equivalent is needed

## Monitoring

- **Daily tester monitor** scheduled (trigger ID: trig_01MaQbzvrLwWefkXMWmTyFhh) — checks Gmail at 9am daily, push alert when 20 testers reached

---

## Key Links

- Play Console: https://play.google.com/console/developers/4835349469847474845
- App page: https://play.google.com/console/developers/4835349469847474845/app/4976005086325100849
- r/betatests post: posted Aug 7 (check Reddit for tester count)
