# Your Salon Pro — Apple App Store Handoff
**Last Updated:** September 1, 2026
**Repo:** shaz010/mgm-studio
**Live site:** getcommissionpro.com
**App Store Connect:** appstoreconnect.apple.com (Shahbaz Mirshahi)

---

## CHROME ACCESS RULE — READ FIRST EVERY SESSION

ALWAYS use mcp__claude-in-chrome__* tools to access Apple App Store Connect, Google Play Console, Reddit, and any site where Shaz is already logged in.

- These tools access Shaz's real Chrome browser session — cookies, logins, everything.
- The browser panel in the app UI is isolated (not logged in) — DO NOT use it or argue about login walls.
- Do NOT ask Shaz to log in. Navigate directly with Chrome tools.
- Load: ToolSearch select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__javascript_tool
- App Store Connect URL: https://appstoreconnect.apple.com/apps

---

## Current Status (Sep 1, 2026)

**Submission:** iOS 1.0 — Waiting for Review (submitted Aug 28 at 4:48 PM)

All known rejection issues fixed and resubmitted. Build 1.0(3) is in review.

---

## Rejection History & Fixes Applied

### Round 1 (Aug 6) — 2 Issues

| Issue | Fix |
|-------|-----|
| 2.1(a) Infinite loading (Stripe in WebView) | Replaced Stripe with Apple IAP |
| 3.1.1 Promo codes unlock Pro | Promo button hidden on Apple version |

### Round 2 (Aug 27) — 5 Issues

| Issue | Fix Applied | Version |
|-------|-------------|---------|
| 2.1(b) After purchase nothing happens | IAP bridge added to salon.html (forwards to iframe) | salon v0.38 |
| 3.1.1 No Restore Purchases button | Restore button + payRestore() added to paywall | app v2.41 |
| 3.1.2(c) No EULA/Privacy links | Already added in v2.40 | app v2.40 |
| 5.1.1(v) No account deletion | Already built in v2.40 | app v2.40 |
| 2.3.3 Screenshot metadata issues | NOT YET FIXED — may come back |

---

## Architecture: Why the IAP Bridge Exists

The shell/iframe problem:
- salon.html is the top-level WKWebView page (the shell)
- app.html loads inside an iframe (#roomEarn)
- Swift's evaluateJavaScript() runs on the TOP-LEVEL window (salon.html)
- But onAppleIAPSuccess() is defined INSIDE the iframe (app.html)
- Result: Swift calls the function, it silently fails, nothing unlocks

The fix (salon.html v0.38): bridge function in salon.html forwards the call into the iframe.

---

## Current File Versions

| File | Version | Key Changes |
|------|---------|-------------|
| salon.html | v0.38 | Apple IAP bridge (forwards evaluateJavaScript to iframe) |
| app.html | v2.41 | Restore Purchases button + payRestore() function |
| IAPHandler.swift | — | Added restore action support (Aug 28) |

---

## IAPHandler.swift — Key Change (with Restore)

Located at: Desktop/Your Salon/Your Salon Pro/IAPHandler.swift

userContentController now handles both purchase and restore:

    if body["action"] == "purchase" { purchase() }
    else if body["action"] == "restore" { SKPaymentQueue.default().restoreCompletedTransactions() }

The .restored case in paymentQueue calls onAppleIAPSuccess() — so restore fully unlocks.

---

## If Rejected Again — Likely Culprits

1. 2.3.3 Screenshots — Apple wants real 6.5" iPhone + 13" iPad screenshots. Upload under App Information → Screenshots.
2. New build not picked up — Aug 28 build may still be processing. If Apple reviewed build 3 (Aug 18), the restore fix won't be in it. May need to resubmit.
3. Screen recording for Delete Account — Apple may ask for proof. Record: Settings → Delete Account → confirm. Upload as App Review attachment.

---

## Deployment Flow (How Shaz Ships)

1. Edit web files (app.html, salon.html, appt.html) in Claude
2. Claude saves directly to ~/mgm-studio/ via device bridge
3. Claude pushes to GitHub via Chrome (GitHub web editor) — NOT drag-and-drop
4. Wait ~2 min, then swipe-kill + reopen Safari PWA
5. For native changes: edit Swift in Xcode → Archive → Distribute → App Store Connect

---

## Xcode Project Location

~/Desktop/Your Salon/Your Salon Pro/
├── IAPHandler.swift      ← StoreKit IAP handler
├── viewController.swift  ← WKWebView setup, injects IS_APPLE_IAP flag
└── Your Salon Pro/
    ├── AppDelegate.swift
    └── SceneDelegate.swift

---

## Subscription Product

- Product ID: com.yoursalon.pro.monthly
- Price: $4.99/month
- Free trial: 21 days
- Group: Your Salon Pro Access

---

## Outstanding Work

- [ ] 2.3.3 Screenshots — proper 6.5" iPhone + 13" iPad screenshots needed
- [ ] Screen recording — show Delete Account flow for Apple if they ask again
- [ ] App Store Connect metadata — Privacy Policy URL + EULA URL fields
