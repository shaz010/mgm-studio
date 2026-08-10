# Your Salon — Google Play Handoff
**Last updated:** August 10, 2026  
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
| Android device verification | ⚠️ Ticket closed Aug 5 — unclear if resolved |
| Closed testing (20 testers) | 🔄 In progress — Shaz posted r/betatests Aug 7 |
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

Google requires a **physical Android device (Android 10+, non-rooted)** verified via the Play Console mobile app. Shaz asked support (Aug 1–3) whether there was a waiver — there isn't. This ticket was closed Aug 5.

**Unknown:** whether the device verification was actually completed or if it's still blocking. Check: Play Console → left sidebar → "Android developer verification."

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
- How many testers have opted in so far and when did the first one join?
- Was Android device verification completed?
- What track is the app on — Internal or Closed Testing?

---

## Pricing / Monetization

- Google Play Billing policy: similar to Apple — if selling in-app subscriptions via Play Store, must use Google Play Billing (not Stripe) for in-app purchases
- **Current state unknown** — web version uses Stripe; Android version billing setup not confirmed

---

## Next Steps (in order)

1. Check Android developer verification status in Play Console sidebar
2. Confirm how many testers have opted in → share the opt-in link widely if under 20
3. Check if `assetlinks.json` is live (TWA requires this for URL bar to hide)
4. Once 20 testers × 14 days = apply for production access
5. Address Google Play Billing if Apple IAP equivalent is needed

---

## Key Links

- Play Console: https://play.google.com/console/developers/4835349469847474845
- App page: https://play.google.com/console/developers/4835349469847474845/app/4976005086325100849
- r/betatests post: posted Aug 7 (check Reddit for tester count)
