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
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iapHandler",
              let body = message.body as? [String: String],
              body["action"] == "purchase" else { return }
        purchase()
    }
    
    func purchase() {
        guard let product = product else { fetchProduct(); return }
        guard SKPaymentQueue.canMakePayments() else {
            webView?.evaluateJavaScript("alert('Payments are disabled on this device.');", completionHandler: nil)
            return
        }
        SKPaymentQueue.default().add(SKPayment(product: product))
    }
    
    func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        product = response.products.first
    }
    
    func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        for transaction in transactions {
            switch transaction.transactionState {
            case .purchased, .restored:
                SKPaymentQueue.default().finishTransaction(transaction)
                DispatchQueue.main.async {
                    self.webView?.evaluateJavaScript("onAppleIAPSuccess('\(self.productID)');", completionHandler: nil)
                }
            case .failed:
                SKPaymentQueue.default().finishTransaction(transaction)
                DispatchQueue.main.async {
                    self.webView?.evaluateJavaScript("alert('Purchase failed. Please try again.');", completionHandler: nil)
                }
            default:
                break
            }
        }
    }
}
