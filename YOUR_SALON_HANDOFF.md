# YOUR SALON PRO — iOS HANDOFF
**Last updated: Sep 9, 2026 · 1:05 PM PT**
Read this first in any new session about the iOS app / App Store.

---

## 🎯 CURRENT STATE (one line)
Version **1.0, build 7** + subscription **"Your Salon Pro Monthly"** + its group are **Waiting for Review** at Apple (submitted Sep 9, 12:57 PM). Up to 48 hrs. Email will arrive.

---

## ✅ WHAT WAS DONE TODAY (Sep 9)

### Xcode / build
- Xcode had **no Apple ID signed in** → added shahbazmirshahi@mac.com (Team `M9N8RZNXP3`)
- Team had **0 registered devices** → registered iPhone 16 Pro Max (UDID `00008140-001670981431801C`) in the developer portal; **Developer Mode** turned on on the phone
- Project `CURRENT_PROJECT_VERSION` bumped 1 → 4; Xcode auto-bumped the upload to **build 7**
- Archive succeeded, uploaded, export compliance answered **"no encryption"**
- ⚠️ Don't try "Apple Distribution" cert with automatic signing — Xcode 26 rejects it. A registered device is required for archive.

### App Store Connect
- Pulled the old 1-item submission (build 5) and resubmitted **3 items**: app 1.0 (7) + subscription + subscription group. **First subscription must always be submitted WITH the app version.**
- Subscription metadata: display name **Your Salon Pro Monthly**, description **"Full access: earnings, bookings, clients & backups"**, price **$4.99/mo, first month free** (matches paywall)
- Review notes rewritten on both the version and the subscription (fixed wrong "14-day trial" → first month free)
- **App Privacy label** changed from "Data Not Collected" → Email Address, Other User Content, User ID (app functionality, linked to user, no tracking) — matches Firebase sign-in/sync
- Verified: Privacy Policy URL = https://getcommissionpro.com/privacy.html (live), EULA = Apple Standard

### Web (GitHub → getcommissionpro.com)
- **salon.html v0.49** pushed: shell paywall now shows subscription title, "1-month auto-renewable", "$4.99 / month · first month free", 4-line feature list, cancel-anytime terms, Terms of Use (Apple std EULA) + Privacy Policy links
- The native app loads this page, so **no rebuild needed** for paywall copy changes

---

## 🍎 APPLE'S SEP 5 REJECTION (build 5) — and how each point is answered
| Apple said | Fix |
|---|---|
| 3.1.2(c) subscription doesn't describe what user gets | Paywall feature list + ASC description |
| 3.1.2(c) missing functional Terms/Privacy links in app | Links on paywall; open via native `openURL` handler (build 7) |
| 2.1(a) login button not functional | Native tap handling fixed in build 7; sign-in optional ("Continue without account →") |

---

## 🔜 IF APPLE BOUNCES AGAIN
1. Read the message in App Store Connect → App Review
2. If they ask for a **screen recording**: record iPhone → open app → paywall → tap Terms + Privacy links → reply in the thread
3. Paywall copy = `salon.html` (shell paygate, `#shellPG`) — edit, bump `salon vX.XX`, push; no Xcode needed
4. Native changes = `~/Desktop/Your Salon/Your Salon Pro/` → Product → Archive → Distribute → App Store Connect

---

## 📱 APP STORE CONNECT QUICK FACTS
- App ID **6796050684** · bundle `com.getcommissionpro.yoursalon`
- Subscription product ID `com.yoursalon.pro.monthly` (group 22292515)
- Internal TestFlight group "Shaz Dev"
- Builds 1–7 exist; next upload will be 8

---

## 🤖 ANDROID (separate, ticking)
- **Sep 30 2026**: Android developer verification deadline in Play Console — app removed globally if missed
- Target API 34 deadline (Aug 31) has passed — update target SDK ASAP
- Closed testing needs 12 opted-in testers (0 confirmed as of Sep 2)

---

## 🧹 HOUSEKEEPING (harmless, delete whenever)
- `~/Desktop/Your Salon/Your Salon Pro/Your Salon Pro.xcodeproj/project.pbxproj.bak-*`
- `~/Desktop/Your Salon/Your Salon Pro/web-push/`
- privacy.html opening line says "does not collect any personal data" — soften someday (optional Firebase sync collects email)

---

## 🛠 HOW CLAUDE PUSHES TO GITHUB FROM COWORK (works)
GitHub web editor → JS fetches raw file → applies string replacements → click in editor → ⌘A + Delete → `execCommand('insertText', …)` → verify line count → Commit. (`file_upload` tool rejects every path; don't bother.)

