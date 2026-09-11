# Your Salon Pro — Apple App Store Handoff
**Last Updated:** September 11, 2026  
**Repo:** shaz010/mgm-studio  
**Live site:** getcommissionpro.com  
**App Store Connect:** appstoreconnect.apple.com (Shahbaz Mirshahi)

---

## 🔑 CHROME ACCESS RULE — READ FIRST EVERY SESSION

**ALWAYS use `mcp__claude-in-chrome__*` tools to access Apple App Store Connect, Google Play Console, Reddit, and any other site where Shaz is already logged in.**

- These tools access Shaz's **real Chrome browser session** — his cookies, his logins, everything.
- The browser panel in the app UI is **isolated** (different session, not logged in) — DO NOT use it or argue about it.
- Do NOT ask Shaz to log in anywhere. Use Chrome tools and navigate directly.
- Load with: `ToolSearch → "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__javascript_tool"`

---

## ⚠️ CRITICAL RULE — NEVER TOUCH APP STORE CONNECT WHILE "WAITING FOR REVIEW"

**Editing ANYTHING in App Store Connect while the app is "Waiting for Review" auto-removes the submission from the queue.** This is why all previous submissions showed "Removed by Shahbaz Mirshahi" — it wasn't intentional, it was caused by editing the listing while in review.

**Once submitted → DO NOT touch App Store Connect until Apple sends a result email.**

---

## Current Status (Sep 10, 2026)

**Submission:** iOS 1.0 — ⏳ Waiting for Review (submitted Sep 10, 2026 at ~1:54 PM)

**3 Items submitted together in one draft:**
- iOS App 1.0 (Build 7)
- Your Salon Pro Monthly — Subscription Group
- Your Salon Pro Monthly — Subscription (com.yoursalon.pro.monthly)

This is the correct format — all 3 items in a single submission. Previous attempts had iOS App submitted alone (missing subscriptions) or subscriptions in a separate draft that couldn't be submitted without an iOS app version.

---

## App + Subscription IDs

- **App ID:** 6796050684
- **Subscription Group ID:** 22292515
- **Subscription ID:** 6798901074 (com.yoursalon.pro.monthly)
- **Build 7 UUID:** b7aba1bf-c95a-4d94-97c6-eaaaabf40f4c

---

## Submission History (all "Removed" = not Apple rejection)

All 6 previous submission history entries show "Removed by Shahbaz Mirshahi" — NOT rejected by Apple. Most likely cause: editing App Store Connect while app was "Waiting for Review" auto-removes it from the queue. This is an Apple system behaviour, not intentional.

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
| 2.3.3 Screenshot metadata issues | ⚠️ NOT YET FIXED — Shaz says ignore for now |

---

## Architecture: Why the IAP Bridge Exists

**The shell/iframe problem:**
- `salon.html` is the top-level WKWebView page (the shell)
- `app.html` loads inside an iframe (`#roomEarn`)
- Swift's `evaluateJavaScript()` runs on the TOP-LEVEL window (salon.html)
- But `onAppleIAPSuccess()` is defined INSIDE the iframe (app.html)
- **Result:** Swift calls the function, it silently fails, nothing unlocks

**The fix (salon.html v0.38):**
```javascript
window.onAppleIAPSuccess = function(productId) {
  var fr = document.getElementById('roomEarn');
  if(fr && fr.contentWindow) {
    try { fr.contentWindow.onAppleIAPSuccess(productId); } catch(e) {}
  }
};
```
This bridge in salon.html forwards the call into the iframe where the real handler lives.

---

## Current File Versions

| File | Version | Key Changes |
|------|---------|-------------|
| `salon.html` | v0.38 | Apple IAP bridge (forwards evaluateJavaScript to iframe) |
| `app.html` | v2.41 | Restore Purchases button + payRestore() function |
| `IAPHandler.swift` | — | Added restore action support (Aug 28) |

---

## IAPHandler.swift (Current — with Restore)

Located at: `Desktop/Your Salon/Your Salon Pro/IAPHandler.swift`

Key change from original — `userContentController` now handles both actions:
```swift
func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    guard message.name == "iapHandler",
          let body = message.body as? [String: String] else { return }
    if body["action"] == "purchase" { purchase() }
    else if body["action"] == "restore" { SKPaymentQueue.default().restoreCompletedTransactions() }
}
```

The `.restored` case in `paymentQueue` already calls `onAppleIAPSuccess()` — so restore fully unlocks.

---

## Paywall Features (app.html)

### Restore Purchases button
```html
<button onclick="payRestore()" style="margin-top:10px;background:none;border:none;color:#555;font-size:11px;cursor:pointer;text-decoration:underline;font-family:inherit;padding:4px 0">Restore Purchases</button>
```

### payRestore() function
```javascript
function payRestore(){
  if(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.iapHandler){
    window.webkit.messageHandlers.iapHandler.postMessage({action:'restore'});
  }else{
    alert('Restore is only available in the App Store version.');
  }
}
```

---

## If Rejected Again — Likely Culprits

1. **2.3.3 Screenshots** — Apple wants real 6.5" iPhone + 13" iPad screenshots. Use your actual device or Xcode simulator at those sizes. Upload under App Information → Screenshots. (Shaz chose to ignore this for now.)

2. **Screen recording for Delete Account** — Apple may ask for proof of 5.1.1(v) account deletion. Record a screen video showing: Settings → Delete Account → confirm. Upload as App Review attachment.

---

## Deployment Flow (How Claude Ships)

**Claude does ALL git operations via the device bridge — Shaz does NOT need to use Terminal or GitHub web UI at all.**

1. Edit web files (`app.html`, `salon.html`, `appt.html`) in Claude
2. Claude saves file directly to `/Users/shahbazmirshahi/mgm-studio/` via device bridge
3. Claude runs `git add / commit / push` via device bridge — done automatically, no Terminal needed
4. Claude confirms the push result in chat
5. Shaz waits ~2 min, then swipe-kills + reopens Safari PWA to pick up changes
6. For native changes: edit Swift in Xcode → ⌘B → Product → Archive → Distribute → App Store Connect

**Note on Shaz's Terminal (for reference only — not needed for deployment):**
- Terminal username shows as `shahbazmirshahimac.com` but git repo lives at `/Users/shahbazmirshahi/mgm-studio/`
- These are different Mac user accounts — Terminal `cd ~/mgm-studio` and `cd /Users/shahbazmirshahi/mgm-studio` both fail from Shaz's shell
- Claude's device bridge can access and push the repo directly — this is the correct flow

---

## Xcode Project Location

```
~/Desktop/Your Salon/Your Salon Pro/
├── IAPHandler.swift      ← StoreKit IAP handler
├── viewController.swift  ← WKWebView setup, injects IS_APPLE_IAP flag
└── Your Salon Pro/
    ├── AppDelegate.swift
    └── SceneDelegate.swift
```

---

## Subscription Product

- **Product ID:** `com.yoursalon.pro.monthly`
- **Price:** $4.99/month
- **Free trial:** 21 days
- **Group:** Your Salon Pro Access

---

## Outstanding Work

- [ ] **2.3.3 Screenshots** — proper 6.5" iPhone + 13" iPad screenshots (Shaz deferring)
- [ ] **Screen recording** — show Delete Account flow for Apple if they ask again
- [ ] **App Store Connect metadata** — Privacy Policy URL + EULA URL fields
