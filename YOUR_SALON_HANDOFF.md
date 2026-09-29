# YOUR SALON PRO — iOS HANDOFF
**Last updated: Sep 29, 2026 · 1:15 PM PT**
Read this first in any new session about the iOS app / App Store.

---

## 🎯 CURRENT STATE (one line)
✅ **RESUBMITTED Sep 29, 2:27 PM** — iOS 1.0 (7) + subscription + group = **Waiting for Review**. Fix for 5.1.1(v) = salon v0.50 real account deletion. 🚫 **HANDS OFF App Store Connect until Apple replies** (any edit pulls it from the queue).

Done Sep 29: salon v0.50 pushed · tested in TestFlight with reviewtest@yoursalon.com · 74-sec recording (Downloads/YourSalon_account_deletion.mp4) sent in Reply to App Review + attached in App Review Information · Notes rewritten (account deletion first, then sign-in, subscription, about).
Tip: ASC attachments reject uppercase `.MP4` — rename to lowercase `.mp4`.

⚠️ App Review emails go to **shahbazmirshahi@mac.com** (NOT the Gmail). Check Mail app → search "App Store Connect".

---

## 📬 APPLE REPLY CHECKLIST (Shaz missed both Sep 14 + Sep 24 rejections)
- App Review emails go to **shahbazmirshahi@mac.com** — NOT the Gmail. Nothing arrives in Gmail
- Fix: install the **App Store Connect** iPhone app + turn on notifications (instant approve/reject push)
- Optional: icloud.com → Mail → Settings → Forwarding → chabokchamejun@gmail.com
- Claude: at session start, if a submission is "Waiting for Review", check mac.com mail (Mail app → search "App Store Connect") or ASC → App Review

## 🧪 TESTING RULE — WE TEST IN TESTFLIGHT
- All iPhone testing happens in the **TestFlight** build of Your Salon Pro (internal group "Shaz Dev"), NOT the Safari PWA
- The TestFlight app loads getcommissionpro.com/salon.html live → web pushes show up in TestFlight after ~2 min + swipe-kill/reopen. No new build needed for web-only changes
- Native (Swift) changes → new Xcode archive (next = build 8) → it appears in TestFlight → test there before submitting
- Apple screen recordings (e.g., account deletion) = record in the TestFlight app on the physical iPhone

## 🆕 SEP 29 SESSION
### Rejection timeline (same submission ID 2e5902ac-e4fd-4c4d-8aa5-513b73907f3c)
| Submitted | Result | Issues |
|---|---|---|
| Sep 10 | ❌ Sep 14 | **3.1.2(c)** "first month free" more prominent than $4.99/mo billed amount · **2.1(a)** iPad Air (M3, iPadOS 27): after purchase + login, app kept routing back to paywall |
| Sep 14 4:08 PM | ❌ Sep 24 | **5.1.1(v)** account deletion — app supports account creation but has no in-app deletion |
- Shaz replied Sep 14 saying both 3.1.2(c) + 2.1(a) were being fixed. Sep 24 only lists 5.1.1 → those two look resolved.

### Why the old "fix" failed
`app.html` → `deleteMyAccount()` (CommissionPro settings, "Delete my account & all data") only runs `localStorage.clear()`. It does **not** delete the Firebase Auth user or the Firestore `users/{uid}` backup, it's buried in a room, and it uses `confirm()`/`alert()` which can silently fail in WKWebView.

### Fix — salon.html v0.50 (SHELL_V v0.38) — built, NOT yet pushed
- New **Delete account** button in the signed-in panel (`#authMe`, opened from the cloud pill), under Sign out
- In-page confirm (`#delAcctBox`) → password re-auth → deletes Firestore `users/{uid}` → `user.delete()` → clears localStorage/sessionStorage → **"Account deleted ✓"** panel (`#delDone`) → Done reloads
- No native popups. Functions: `delAcctStart / delAcctCancel / delAcctConfirm / delErr`
- Web-only change → **no Xcode build needed**

### ▶️ Next steps (in order)
1. Upload salon.html v0.50 to GitHub
2. Test with a **throwaway account** (create → Delete account). If error "Missing or insufficient permissions" → Firestore rules block delete on `users/{uid}`; fix rule
3. Screen-record on a **physical iPhone in the TestFlight build**: open app → create/sign in → cloud pill → Delete account → password → "Account deleted ✓"
4. App Review → **Reply to App Review** with the video + note: "In-app account deletion: tap the cloud/account pill → Delete account."
5. Also add video/steps to **App Review Information → Notes**
6. **Update Review** → then DO NOT touch App Store Connect until Apple replies
7. Later: repoint app.html's old local-only "Delete my account" button to the new flow (so reviewers never hit the half version)

### Also check
- Trial wording must match everywhere: paywall says **first month free**; apple handoff said **21 days** → confirm ASC subscription Introductory Offer = 1 month free

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
- Version board (Sep 29): 💰 app v2.57 · 📅 appt v6.16 · 🚪 salon v0.50 · 🛡️ sw v75 · 📆 book v3.55

---

## 🤖 ANDROID — PARKED (Apple first)
- ✅ Android developer verification: **Registered** (confirmed on screen Sep 29; Sep 30 deadline is a non-issue)
- ✅ No Play Console warnings besides the (done) verification reminder
- Closed testing still needs 12 opted-in testers — Shaz: "no way can get 12" → parked. Android users can install the PWA from Chrome meanwhile
- Pending: "Submit 1 change for review" (Alpha testers → Google Group your-salon-pro-testers@googlegroups.com)

---

## 🧹 HOUSEKEEPING (harmless, delete whenever)
- `~/Desktop/Your Salon/Your Salon Pro/Your Salon Pro.xcodeproj/project.pbxproj.bak-*`
- `~/Desktop/Your Salon/Your Salon Pro/web-push/`
- privacy.html opening line says "does not collect any personal data" — soften someday (optional Firebase sync collects email)

---

## 💻 MAC NOTE
Logged-in Mac user is `shahbazmirshahimac.com`; its ~/Desktop/Your Salon only has an empty .xcodeproj shell. The real Xcode project (Swift files) lives under the other user account `shahbazmirshahi`.

## 💻 PUSH TO GITHUB — CURRENT METHOD (Sep 29, from SHAHZAD_MASTER "File backup rules")
1. Claude writes changed files into **~/Downloads/mgm-push/** (device bridge; Downloads is writable, Desktop is NOT)
2. Shaz pastes ONE line in Terminal:
```
cd ~/Downloads && [ -d mgm-studio ] || git clone https://github.com/shaz010/mgm-studio.git; cd mgm-studio && git pull && cp ../mgm-push/* . && git add -A && git commit -m "update" && git push && mkdir -p ../mgm-pushed && mv ../mgm-push/* ../mgm-pushed/
```
- The final `mv` empties mgm-push after a successful push, so old files never get re-copied over newer ones next time.
- Local clone lives at **~/Downloads/mgm-studio** (Shaz's Terminal owns it). Claude must NOT git-clone there itself — the bridge can't delete git lock files, clone breaks.
- Login prompt: Username `shaz010` · Password = GitHub **personal access token** (not the account password). Keychain remembers it.
- Broken clone attempt from Sep 29 parked in ~/Downloads/_to_delete/ — safe to trash.

## 🛠 HOW CLAUDE PUSHES TO GITHUB FROM COWORK (works)
GitHub web editor → JS fetches raw file → applies string replacements → click in editor → ⌘A + Delete → `execCommand('insertText', …)` → verify line count → Commit. (`file_upload` tool rejects every path; don't bother.)

