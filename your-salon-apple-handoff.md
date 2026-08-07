# Your Salon Pro — Apple App Store Fix Handoff
**Date:** August 6, 2026  
**Repo:** shaz010/mgm-studio  
**App Store Connect:** appstoreconnect.apple.com (logged in as Shahbaz Mirshahi)

---

## Why Apple Rejected It (Two Issues)

### 1. Guideline 2.1(a) — Infinite Loading Bug
- Tapping "Start free trial — $5/mo after" hangs forever on iPad
- **Root cause:** `payBuy()` in `app.html` does `window.location.href = 'https://buy.stripe.com/...'`
- Stripe's checkout page fails to load inside the iOS App Store WebView
- **Fix:** Replace Stripe call with Apple IAP trigger (see below)

### 2. Guideline 3.1.1 — Promo Codes Unlock Pro
- `payUnlock()` in `app.html` validates hash codes to unlock Pro features
- Apple explicitly flagged this: *"the app uses promo codes to unlock Pro"*
- Any non-Apple unlock mechanism is banned in App Store apps
- **Fix:** Remove or disable promo code entry in the Apple version

---

## The Strategy: Two Versions

| | **Apple Version** | **Web / Everyone Else** |
|--|--|--|
| Payment | Apple IAP (StoreKit) | Stripe |
| Promo codes | Removed | Keep as-is |
| Where it lives | App Store (Xcode project) | getcommissionpro.com |
| File | Modified `app.html` | Current `app.html` (unchanged) |

---

## Part 1 — Changes to `app.html` (Web Side)

### How to detect "running inside Apple App Store app"
The iOS Xcode wrapper needs to inject a flag into the WebView on load.  
In the Swift/WKWebView code, add this to `webView(_:didFinish:)`:

```swift
webView.evaluateJavaScript("window.IS_APPLE_IAP = true;", completionHandler: nil)
```

Then in `app.html`, all payment logic checks this flag first.

### Replace `payBuy()` function
**Current code (around line 3409):**
```javascript
function payBuy(){
  if(!UNLOCK.stripeUrl||UNLOCK.stripeUrl.indexOf('PASTE')===0){
    alert('Payment link is not set up yet — coming soon!');
    return;
  }
  window.location.href=UNLOCK.stripeUrl;
}
```

**Replace with:**
```javascript
function payBuy(){
  if(window.IS_APPLE_IAP){
    // Trigger Apple IAP via native bridge
    if(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iapHandler){
      window.webkit.messageHandlers.iapHandler.postMessage({action:'purchase', productId:'com.yoursalon.pro.monthly'});
    } else {
      alert('Apple payment not available. Please try again.');
    }
    return;
  }
  // Web / Stripe path (unchanged)
  if(!UNLOCK.stripeUrl||UNLOCK.stripeUrl.indexOf('PASTE')===0){
    alert('Payment link is not set up yet — coming soon!');
    return;
  }
  window.location.href=UNLOCK.stripeUrl;
}
```

### Hide promo code unlock in Apple version
Find the "Unlock" button in the payGate HTML (around line 1155):
```html
<button class="pg-unlock" onclick="payUnlock()">Unlock</button>
```

Add this JS after page load to hide it on Apple:
```javascript
// Hide promo unlock on Apple IAP version
if(window.IS_APPLE_IAP){
  var unlockBtn = document.querySelector('.pg-unlock');
  if(unlockBtn) unlockBtn.style.display = 'none';
}
```

### Handle Apple IAP result (success callback)
Apple's native code will call this JS function when purchase succeeds.  
Add this function to `app.html`:
```javascript
// Called by native Swift code after successful Apple IAP purchase
function onAppleIAPSuccess(productId){
  try{ localStorage.setItem('cp_unlocked','1'); }catch(e){}
  try{ sessionStorage.setItem('cp_unlocked','1'); }catch(e){}
  payClose();
  // Show success screen
  var gates = document.querySelectorAll('.pg-screen');
  gates.forEach(function(s){ s.style.display='none'; });
  var success = document.getElementById('pgSuccessScreen');
  if(success) success.style.display='block';
}
```

---

## Part 2 — Xcode Project Changes (Native Side)

> The Xcode project was generated (likely via PWABuilder) and lives on your Mac.  
> Open it in Xcode before making these changes.

### Step 1 — Create the Subscription in App Store Connect
1. Go to appstoreconnect.apple.com → Your Salon Pro → Monetization → Subscriptions
2. Create a **Subscription Group** (e.g. "Your Salon Pro Access")
3. Create a subscription:
   - **Product ID:** `com.yoursalon.pro.monthly`
   - **Price:** $4.99/month (closest to your $5)
   - **Free trial:** 21 days
4. Add a **Localization** (English) with name and description
5. Submit for review (subscriptions need their own review)

### Step 2 — Add StoreKit to Xcode
1. In Xcode, select your project target
2. Go to **Signing & Capabilities** → **+ Capability** → add **In-App Purchase**
3. Add `StoreKit.framework` to **Linked Frameworks**

### Step 3 — Add the IAP Handler Swift file
Create a new Swift file `IAPHandler.swift` in the project:

```swift
import StoreKit
import WebKit

class IAPHandler: NSObject, SKProductsRequestDelegate, SKPaymentTransactionObserver, WKScriptMessageHandler {
    
    weak var webView: WKWebView?
    let productID = "com.yoursalon.pro.monthly"
    var product: SKProduct?
    
    override init() {
        super.init()
        SKPaymentQueue.default().add(self)
        fetchProduct()
    }
    
    func fetchProduct() {
        let request = SKProductsRequest(productIdentifiers: [productID])
        request.delegate = self
        request.start()
    }
    
    // WKScriptMessageHandler — receives messages from JS
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iapHandler",
              let body = message.body as? [String: String],
              body["action"] == "purchase" else { return }
        purchase()
    }
    
    func purchase() {
        guard let product = product else {
            fetchProduct()
            return
        }
        guard SKPaymentQueue.canMakePayments() else {
            webView?.evaluateJavaScript("alert('Payments are disabled on this device.');", completionHandler: nil)
            return
        }
        let payment = SKPayment(product: product)
        SKPaymentQueue.default().add(payment)
    }
    
    // SKProductsRequestDelegate
    func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        product = response.products.first
    }
    
    // SKPaymentTransactionObserver
    func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        for transaction in transactions {
            switch transaction.transactionState {
            case .purchased, .restored:
                SKPaymentQueue.default().finishTransaction(transaction)
                // Tell the web app purchase succeeded
                DispatchQueue.main.async {
                    self.webView?.evaluateJavaScript(
                        "onAppleIAPSuccess('\(self.productID)');",
                        completionHandler: nil
                    )
                }
            case .failed:
                SKPaymentQueue.default().finishTransaction(transaction)
                DispatchQueue.main.async {
                    self.webView?.evaluateJavaScript(
                        "alert('Purchase failed. Please try again.');",
                        completionHandler: nil
                    )
                }
            default:
                break
            }
        }
    }
}
```

### Step 4 — Wire it up in your ViewController
In your main `ViewController.swift` (or wherever WKWebView is set up), add:

```swift
// At the top of the class
var iapHandler: IAPHandler?

// In viewDidLoad(), after creating webView:
iapHandler = IAPHandler()
iapHandler?.webView = webView

// Add the JS message handler
webView.configuration.userContentController.add(iapHandler!, name: "iapHandler")

// Inject the Apple flag after page loads
func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    webView.evaluateJavaScript("window.IS_APPLE_IAP = true;", completionHandler: nil)
}
```

---

## Resubmission Checklist

- [ ] Subscription created in App Store Connect and approved
- [ ] Xcode project updated with StoreKit + IAPHandler
- [ ] `app.html` updated with new `payBuy()` + `onAppleIAPSuccess()`
- [ ] Promo code button hidden on Apple version
- [ ] Tested on real device (not simulator) — IAP doesn't work on simulator
- [ ] New build uploaded via Xcode → Product → Archive → Distribute
- [ ] Resubmit in App Store Connect → "Resubmit App Review"

---

## Files That Change

| File | What Changes | Who does it |
|------|-------------|-------------|
| `app.html` | `payBuy()`, hide promo btn, add `onAppleIAPSuccess()` | Can be done here |
| `IAPHandler.swift` | New file — full StoreKit logic | In Xcode on your Mac |
| `ViewController.swift` | Wire up IAPHandler + inject JS flag | In Xcode on your Mac |
| App Store Connect | Create subscription product | appstoreconnect.apple.com |

---

## Note on the Web Version
**Do not change the web version of `app.html`.** Stripe + promo codes stay exactly as they are for getcommissionpro.com users. Only the Xcode-packaged Apple build gets these changes — because `window.IS_APPLE_IAP` is only injected by the native wrapper, the web version automatically keeps its existing flow.
