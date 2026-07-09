// Firebase Cloud Function — Your Salon
// Deploy: firebase deploy --only functions
//
// Firestore fields required on public/<SALON_ID>:
//   stripePk     — Stripe publishable key  (pk_live_... or pk_test_...)
//   stripeSk     — Stripe SECRET key       (sk_live_... or sk_test_...)  ← keep secret, never in book.html
//   depositAmount — deposit in dollars (e.g. 50)

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const Stripe    = require('stripe');

admin.initializeApp();

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  const { amount, currency = 'usd', salonId } = data;

  if (!salonId)        throw new functions.https.HttpsError('invalid-argument', 'salonId required');
  if (!amount || amount < 50) throw new functions.https.HttpsError('invalid-argument', 'amount must be >= 50 cents');

  // Fetch the Stripe secret key from Firestore (never expose to client)
  const doc   = await admin.firestore().collection('public').doc(salonId).get();
  const info  = doc.exists ? doc.data() : {};
  const sk    = info.stripeSk;

  if (!sk) throw new functions.https.HttpsError('not-found', 'Stripe secret key not configured for this salon');

  const stripe = Stripe(sk);

  // capture_method: 'manual' = authorize now, capture later (after appointment)
  // Set to 'automatic' if you want to charge immediately at booking
  const intent = await stripe.paymentIntents.create({
    amount:         Math.round(amount),
    currency:       currency.toLowerCase(),
    capture_method: 'manual',
    metadata:       { salonId },
  });

  return { clientSecret: intent.client_secret };
});
