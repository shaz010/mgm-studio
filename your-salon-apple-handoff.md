# Your Salon Pro — Apple App Store Handoff
**Last Updated:** September 11, 2026  
**Repo:** shaz010/mgm-studio  
**Live site:** getcommissionpro.com  
**App Store Connect:** appstoreconnect.apple.com (Shahbaz Mirshahi)

---

## 🔑 CHROME ACCESS RULE — READ FIRST EVERY SESSION

**ALWAYS use mcp__claude-in-chrome__* tools to access Apple App Store Connect, Google Play Console, Reddit, and any other site where Shaz is already logged in.**

- These tools access Shaz's real Chrome browser session — his cookies, his logins, everything.
- The browser panel in the app UI is isolated (different session, not logged in) — DO NOT use it or argue about it.
- Do NOT ask Shaz to log in anywhere. Use Chrome tools and navigate directly.
- Load with: ToolSearch then select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__javascript_tool

---

## CRITICAL RULE — NEVER TOUCH APP STORE CONNECT WHILE WAITING FOR REVIEW

Editing ANYTHING in App Store Connect while the app is Waiting for Review auto-removes the submission from the queue. This is why all previous submissions showed Removed by Shahbaz Mirshahi — it was caused by editing the listing while in review.

Once submitted — DO NOT touch App Store Connect until Apple sends a result email.

---

## Current Status (Sep 10, 2026)

Submission: iOS 1.0 — Waiting for Review (submitted Sep 10, 2026 at ~1:54 PM)

3 Items submitted together in one draft:
- iOS App 1.0 (Build 7)
- Your Salon Pro Monthly — Subscription Group
- Your Salon Pro Monthly — Subscription (com.yoursalon.pro.monthly)

---

## App + Subscription IDs

- App ID: 6796050684
- Subscription Group ID: 22292515
- Subscription ID: 6798901074 (com.yoursalon.pro.monthly)
- Build 7 UUID: b7aba1bf-c95a-4d94-97c6-eaaaabf40f4c

---

## Submission History (all Removed = not Apple rejection)

All 6 previous entries show Removed by Shahbaz Mirshahi — NOT rejected by Apple. Caused by editing App Store Connect while in review queue.

---

## Rejection History and Fixes Applied

Round 1 (Aug 6):
- 2.1(a) Infinite loading (Stripe in WebView) — Fixed: Replaced with Apple IAP
- 3.1.1 Promo codes unlock Pro — Fixed: Promo button hidden on Apple version

Round 2 (Aug 27):
- 2.1(b) After purchase nothing happens — Fixed: IAP bridge added to salon.html (salon v0.38)
- 3.1.1 No Restore Purchases button — Fixed: Restore button + payRestore() added (app v2.41)
- 3.1.2(c) No EULA/Privacy links — Fixed in v2.40
- 5.1.1(v) No account deletion — Fixed in v2.40
- 2.3.3 Screenshot metadata issues — NOT YET FIXED (Shaz ignoring for now)

---

## Architecture: Why the IAP Bridge Exists

salon.html is the top-level WKWebView. app.html loads inside iframe #roomEarn.
Swift's evaluateJavaScript() runs on salon.html but onAppleIAPSuccess() lives in app.html iframe.
The bridge in salon.html v0.38 forwards the call into the iframe.

---

## Current File Versions

- salon.html v0.38 — Apple IAP bridge
- app.html v2.41 — Restore Purchases button + payRestore()
- IAPHandler.swift — Added restore action support (Aug 28)

---

## IAPHandler.swift (Current with Restore)

Located at: Desktop/Your Salon/Your Salon Pro/IAPHandler.swift

userContentController handles both actions:
- body["action"] == "purchase" -> purchase()
- body["action"] == "restore" -> SKPaymentQueue.default().restoreCompletedTransactions()

The .restored case in paymentQueue calls onAppleIAPSuccess() — so restore fully unlocks.

---

## Paywall Features (app.html)

Restore Purchases button:
  <button onclick="payRestore()" style="margin-top:10px;background:none;border:none;color:#555;font-size:11px;cursor:pointer;text-decoration:underline;font-family:inherit;padding:4px 0">Restore Purchases</button>

payRestore() posts {action:'restore'} to window.webkit.messageHandlers.iapHandler

---

## If Rejected Again — Likely Culprits

1. 2.3.3 Screenshots — Apple wants real 6.5 inch iPhone + 13 inch iPad screenshots. (Shaz deferring.)
2. Screen recording for Delete Account — Record Settings > Delete Account flow. Upload as App Review attachment.

---

## Deployment Flow (How Claude Ships)

Claude does edit + save to Mac via device bridge.
Claude opens GitHub web editor in Chrome and commits updated content directly.
No Terminal needed — Shaz's Terminal can't reach the repo (different Mac user accounts).

Shaz's Terminal shows shahbazmirshahimac.com but repo is owned by shahbazmirshahi.
cd ~/mgm-studio and cd /Users/shahbazmirshahi/mgm-studio both fail from Shaz's shell.
Claude handles all GitHub pushes via Chrome web editor.

After push: wait ~2 min, swipe-kill + reopen Safari PWA to pick up changes.
For native changes: Xcode -> Archive -> Distribute -> App Store Connect.

---

## Xcode Project Location

~/Desktop/Your Salon/Your Salon Pro/
- IAPHandler.swift — StoreKit IAP handler
- viewController.swift — WKWebView setup, injects IS_APPLE_IAP flag
- Your Salon Pro/AppDelegate.swift
- Your Salon Pro/SceneDelegate.swift

---

## Subscription Product

- Product ID: com.yoursalon.pro.monthly
- Price: $4.99/month
- Free trial: 21 days
- Group: Your Salon Pro Access

---

## Outstanding Work

- 2.3.3 Screenshots — proper 6.5 inch iPhone + 13 inch iPad screenshots (Shaz deferring)
- Screen recording — show Delete Account flow for Apple if they ask again
- App Store Connect metadata — Privacy Policy URL + EULA URL fields
