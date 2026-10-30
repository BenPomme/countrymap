/**
 * Firebase Cloud Functions for Truthle Offer Wall
 *
 * Handles postback requests from Offertoro when users complete offers.
 *
 * Offertoro Postback URL format:
 * https://YOUR_REGION-worldtruth-f9789.cloudfunctions.net/offertoroPostback?
 *   user_id={user_id}&amount={payout}&oid={offer_id}&sig={sig}
 *
 * Setup in Offertoro Dashboard:
 * 1. Go to Apps > Your App > Postback Settings
 * 2. Set Postback URL to: https://us-central1-worldtruth-f9789.cloudfunctions.net/offertoroPostback
 * 3. Add parameters: user_id={user_id}&amount={payout}&oid={offer_id}&sig={sig}
 * 4. Copy your Secret Key and set it in Firebase config
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// Offertoro secret key for signature verification
// Set this with: firebase functions:config:set offertoro.secret="YOUR_SECRET_KEY"
const OFFERTORO_SECRET = functions.config().offertoro?.secret || '';

// Coin conversion rate (1 cent = X coins)
// Offertoro pays in cents, we convert to coins
const CENTS_TO_COINS = 10; // $0.01 = 10 coins, so $1 = 1000 coins
const RETRY_ENTITLEMENT_LIMIT_PER_DAY = 1;

// Optional secret to harden AdMob callback validation.
// Set with: firebase functions:config:set admob.ssv_secret="YOUR_SECRET"
const ADMOB_SSV_SECRET = functions.config().admob?.ssv_secret || '';

// Stripe (paid Truthle retries). Never hardcode keys. Set with:
//   firebase functions:config:set stripe.secret="sk_live_..." stripe.webhook_secret="whsec_..." stripe.price_id="price_..."
// (process.env fallbacks STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_ID for emulator/tests)
const STRIPE_CFG = functions.config().stripe || {};
const STRIPE_SECRET_KEY = STRIPE_CFG.secret || process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = STRIPE_CFG.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICE_ID = STRIPE_CFG.price_id || process.env.STRIPE_PRICE_ID || '';
const SITE_URL = STRIPE_CFG.site_url || process.env.SITE_URL || 'https://theworldtruth.com';
const PAID_RETRIES_PER_UNIT = 1; // 1 purchased unit = 1 extra full Truthle run
const MAX_RETRY_QUANTITY = 10;
let stripeClient = null;
function getStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new functions.https.HttpsError('failed-precondition', 'Payments are not configured yet');
  }
  if (!stripeClient) stripeClient = require('stripe')(STRIPE_SECRET_KEY);
  return stripeClient;
}

/**
 * Verify Offertoro signature
 * sig = md5(user_id + oid + secret_key)
 */
function verifySignature(userId, offerId, signature) {
  if (!OFFERTORO_SECRET) {
    console.warn('Offertoro secret not configured - skipping signature verification');
    return true; // Allow in dev mode
  }

  const expectedSig = crypto
    .createHash('md5')
    .update(userId + offerId + OFFERTORO_SECRET)
    .digest('hex');

  return signature === expectedSig;
}

/**
 * Offertoro Postback Handler
 * Called by Offertoro when a user completes an offer
 */
exports.offertoroPostback = functions.https.onRequest(async (req, res) => {
  // Only allow GET requests (Offertoro uses GET)
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const { user_id, amount, oid, sig } = req.query;

  // Validate required parameters
  if (!user_id || !amount || !oid) {
    console.error('Missing required parameters:', { user_id, amount, oid });
    return res.status(400).send('0'); // Offertoro expects '0' for failure
  }

  // Verify signature
  if (!verifySignature(user_id, oid, sig)) {
    console.error('Invalid signature for user:', user_id);
    return res.status(403).send('0');
  }

  // Convert amount (in cents) to coins
  const amountCents = parseFloat(amount) || 0;
  const coinsToAdd = Math.round(amountCents * CENTS_TO_COINS);

  if (coinsToAdd <= 0) {
    console.error('Invalid amount:', amount);
    return res.status(400).send('0');
  }

  try {
    // Check for duplicate postback (prevent double-crediting)
    const postbackRef = db.collection('offertoro_postbacks').doc(`${user_id}_${oid}`);
    const postbackDoc = await postbackRef.get();

    if (postbackDoc.exists) {
      console.log('Duplicate postback ignored:', { user_id, oid });
      return res.status(200).send('1'); // Return success to avoid retries
    }

    // Record the postback
    await postbackRef.set({
      userId: user_id,
      offerId: oid,
      amountCents: amountCents,
      coinsAwarded: coinsToAdd,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user's coin balance in Firestore
    const userCoinsRef = db.collection('users').doc(user_id).collection('wallet').doc('balance');

    await db.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(userCoinsRef);

      const currentBalance = walletDoc.exists ? (walletDoc.data().coins || 0) : 0;
      const newBalance = currentBalance + coinsToAdd;

      transaction.set(userCoinsRef, {
        coins: newBalance,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    console.log('Coins credited:', { user_id, coinsToAdd, oid });

    // Return '1' for success
    return res.status(200).send('1');
  } catch (error) {
    console.error('Error processing postback:', error);
    return res.status(500).send('0');
  }
});

/**
 * Get user's cloud coin balance
 * Called by the frontend to sync coins from Firestore
 */
exports.getUserCoins = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    const walletRef = db.collection('users').doc(userId).collection('wallet').doc('balance');
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      return { coins: 0 };
    }

    return { coins: walletDoc.data().coins || 0 };
  } catch (error) {
    console.error('Error getting user coins:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get coin balance');
  }
});

/**
 * Redeem coins for a reward
 * This would integrate with a reward fulfillment service
 */
exports.redeemCoins = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { rewardId, coinsRequired } = data;
  const userId = context.auth.uid;

  if (!rewardId || !coinsRequired || coinsRequired <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid reward data');
  }

  try {
    const walletRef = db.collection('users').doc(userId).collection('wallet').doc('balance');

    const result = await db.runTransaction(async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      const currentBalance = walletDoc.exists ? (walletDoc.data().coins || 0) : 0;

      if (currentBalance < coinsRequired) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient coins');
      }

      const newBalance = currentBalance - coinsRequired;
      transaction.update(walletRef, {
        coins: newBalance,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Record redemption
      const redemptionRef = db.collection('redemptions').doc();
      transaction.set(redemptionRef, {
        userId,
        rewardId,
        coinsSpent: coinsRequired,
        status: 'pending',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { newBalance, redemptionId: redemptionRef.id };
    });

    return result;
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Error redeeming coins:', error);
    throw new functions.https.HttpsError('internal', 'Failed to redeem coins');
  }
});

function getUTCDateKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRetryDocId(dateKey, userId) {
  return `${dateKey}_${userId}`;
}

async function grantRetryEntitlement({userId, provider, providerEventId, rewardAmount, rawPayload}) {
  const dateKey = getUTCDateKey();
  const entitlementRef = db.collection('truthle_retry_entitlements').doc(getRetryDocId(dateKey, userId));
  const eventRef = db.collection('ad_reward_events').doc(providerEventId);

  await db.runTransaction(async (transaction) => {
    const eventDoc = await transaction.get(eventRef);
    if (eventDoc.exists) {
      return;
    }

    const entitlementDoc = await transaction.get(entitlementRef);
    const existing = entitlementDoc.exists ? entitlementDoc.data() : null;
    const grantCount = Math.min(
      RETRY_ENTITLEMENT_LIMIT_PER_DAY,
      Math.max(existing?.grantCount || 0, 0) + 1
    );

    transaction.set(entitlementRef, {
      userId,
      date: dateKey,
      granted: grantCount > 0,
      consumed: existing?.consumed || false,
      grantCount,
      lastGrantedAt: admin.firestore.FieldValue.serverTimestamp(),
      provider,
      lastProviderEventId: providerEventId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(existing?.consumedAt ? { consumedAt: existing.consumedAt } : {}),
    }, {merge: true});

    transaction.set(eventRef, {
      provider,
      providerEventId,
      userId,
      rewardAmount: rewardAmount || 1,
      date: dateKey,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      rawPayload,
    }, {merge: true});
  });

  return {date: dateKey, userId};
}

/**
 * AdMob Rewarded SSV callback
 * Idempotent endpoint that grants one Truthle retry entitlement per UTC day.
 */
exports.admobRewardedSSV = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const {
    user_id,
    custom_data,
    transaction_id,
    reward_amount,
    ad_network,
    ssv_secret,
  } = req.query;

  const userId = user_id || custom_data;
  const providerEventId = transaction_id || `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  if (!userId) {
    console.error('Missing user identifier in AdMob SSV callback');
    return res.status(400).send('Missing user identifier');
  }

  if (ADMOB_SSV_SECRET && ssv_secret !== ADMOB_SSV_SECRET) {
    console.error('Invalid AdMob SSV shared secret');
    return res.status(403).send('Forbidden');
  }

  try {
    await grantRetryEntitlement({
      userId,
      provider: ad_network || 'admob',
      providerEventId,
      rewardAmount: parseInt(reward_amount, 10) || 1,
      rawPayload: req.query,
    });

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing AdMob SSV callback:', error);
    return res.status(500).send('Internal error');
  }
});

/**
 * Returns today retry entitlement for authenticated user.
 */
exports.getTruthleRetryStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const date = getUTCDateKey();
  const entitlementRef = db.collection('truthle_retry_entitlements').doc(getRetryDocId(date, userId));

  try {
    const [docSnap, paidSnap] = await Promise.all([
      entitlementRef.get(),
      db.collection('truthle_paid_retries').doc(userId).get(),
    ]);
    const paidCredits = paidSnap.exists ? Math.max(paidSnap.data().credits || 0, 0) : 0;
    const entitlement = docSnap.exists ? docSnap.data() : {};
    const granted = !!entitlement.granted;
    const consumed = !!entitlement.consumed;

    return {
      date,
      granted,
      consumed,
      paidCredits,
      canConsume: (granted && !consumed) || paidCredits > 0,
      source: docSnap.exists || paidSnap.exists ? 'backend' : 'none',
    };
  } catch (error) {
    console.error('Error getting retry entitlement:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get retry status');
  }
});

/**
 * Consumes one retry entitlement for the authenticated user.
 */
exports.consumeTruthleRetry = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const date = getUTCDateKey();
  const entitlementRef = db.collection('truthle_retry_entitlements').doc(getRetryDocId(date, userId));

  try {
    const result = await db.runTransaction(async (transaction) => {
      const paidRef = db.collection('truthle_paid_retries').doc(userId);
      const snap = await transaction.get(entitlementRef);
      const paidSnap = await transaction.get(paidRef);
      const paidCredits = paidSnap.exists ? Math.max(paidSnap.data().credits || 0, 0) : 0;

      const data = snap.exists ? snap.data() : {};
      const granted = !!data.granted;
      const consumed = !!data.consumed;

      if (!granted || consumed) {
        // Free (ad) retry not available: fall back to a purchased credit.
        if (paidCredits > 0) {
          transaction.set(paidRef, {
            credits: paidCredits - 1,
            consumedTotal: admin.firestore.FieldValue.increment(1),
            lastConsumedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
          return {success: true, source: 'paid', remainingRetries: paidCredits - 1};
        }
        throw new functions.https.HttpsError('failed-precondition', 'No retry available');
      }

      transaction.set(entitlementRef, {
        consumed: true,
        consumedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      return {success: true, source: 'free', remainingRetries: paidCredits};
    });

    return result;
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('Error consuming retry entitlement:', error);
    throw new functions.https.HttpsError('internal', 'Failed to consume retry');
  }
});

/**
 * Creates a Stripe Checkout Session for paid Truthle retries.
 * Callable from the static site; returns {url} to redirect to.
 */
exports.createTruthleRetryCheckout = functions.https.onCall(async (data, context) => {
  const returnPath = (data && data.returnTo === 'true-false') ? '/true-false/' : '/truthle/';
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!STRIPE_PRICE_ID) {
    throw new functions.https.HttpsError('failed-precondition', 'Payments are not configured yet');
  }
  const quantity = Math.min(Math.max(parseInt(data?.quantity, 10) || 1, 1), MAX_RETRY_QUANTITY);
  const uid = context.auth.uid;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{price: STRIPE_PRICE_ID, quantity}],
    allow_promotion_codes: true,
    client_reference_id: uid,
    metadata: {uid, product: 'truthle_retry', quantity: String(quantity)},
    payment_intent_data: {metadata: {uid, product: 'truthle_retry'}},
    success_url: `${SITE_URL}${returnPath}?checkout=success&paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}${returnPath}?checkout=cancel`,
  });
  await db.collection('stripe_checkout_sessions').doc(session.id).set({
    uid, quantity, status: 'created', createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return {url: session.url, id: session.id};
});

/**
 * Share-to-friend promo: mints a single-use Stripe Promotion Code (100% off one Extra Attempt),
 * one per uid per UTC day. Idempotent: returns today's existing code if already minted.
 */
const SHARE_COUPON_ID_CFG = STRIPE_CFG.share_coupon_id || process.env.STRIPE_SHARE_COUPON_ID || '';
let shareCouponIdCache = null;
async function getShareCouponId(stripe) {
  if (shareCouponIdCache) return shareCouponIdCache;
  if (SHARE_COUPON_ID_CFG) return (shareCouponIdCache = SHARE_COUPON_ID_CFG);
  for await (const c of stripe.coupons.list({limit: 100})) {
    if (c.valid && c.metadata?.product === 'truthle_retry_share') return (shareCouponIdCache = c.id);
  }
  const price = await stripe.prices.retrieve(STRIPE_PRICE_ID);
  const productId = typeof price.product === 'string' ? price.product : price.product.id;
  const coupon = await stripe.coupons.create({
    percent_off: 100, duration: 'once', name: 'Truthle Extra Attempt — share gift',
    applies_to: {products: [productId]}, metadata: {product: 'truthle_retry_share'},
  });
  return (shareCouponIdCache = coupon.id);
}

exports.mintTruthleSharePromo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!STRIPE_PRICE_ID) {
    throw new functions.https.HttpsError('failed-precondition', 'Payments are not configured yet');
  }
  const uid = context.auth.uid;
  const deviceKey = typeof data?.deviceKey === 'string' ? data.deviceKey.slice(0, 64) : null;
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const endOfDay = new Date(`${day}T23:59:59Z`);
  const ref = db.collection('truthle_share_promos').doc(`${uid}_${day}`);

  // Reserve the uid/day slot in a transaction so concurrent calls can't double-mint.
  const reserved = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) return snap.data();
    tx.set(ref, {uid, day, deviceKey, status: 'minting', createdAt: admin.firestore.FieldValue.serverTimestamp()});
    return null;
  });
  if (reserved) {
    if (reserved.code) return {code: reserved.code, expiresAt: reserved.expiresAt};
    const ageMs = Date.now() - (reserved.createdAt?.toMillis?.() || 0);
    if (ageMs < 30000) throw new functions.https.HttpsError('aborted', 'Code is being generated, try again');
    // stale reservation (previous mint failed) — fall through and mint
  }

  try {
    const stripe = getStripe();
    const couponId = await getShareCouponId(stripe);
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let promo = null;
    for (let i = 0; i < 4 && !promo; i++) {
      let suffix = '';
      const bytes = require('crypto').randomBytes(6);
      for (const b of bytes) suffix += alphabet[b % alphabet.length];
      try {
        promo = await stripe.promotionCodes.create({
          coupon: couponId, code: `WT-${suffix}`, max_redemptions: 1,
          expires_at: Math.floor(endOfDay.getTime() / 1000),
          metadata: {uid, day, product: 'truthle_retry_share'},
        });
      } catch (e) {
        if (e?.code !== 'resource_already_exists' && !/already exists/i.test(e?.message || '')) throw e;
      }
    }
    if (!promo) throw new Error('Could not allocate unique code');
    const expiresAt = endOfDay.toISOString();
    await ref.set({code: promo.code, promoId: promo.id, couponId, expiresAt, status: 'minted',
      mintedAt: admin.firestore.FieldValue.serverTimestamp()}, {merge: true});
    return {code: promo.code, expiresAt};
  } catch (error) {
    console.error('mintTruthleSharePromo failed:', error);
    await ref.delete().catch(() => {});
    throw new functions.https.HttpsError('internal', 'Could not create friend code');
  }
});

/**
 * Grants paid retry credits for a completed Checkout Session. Idempotent per session id.
 */
async function grantPaidRetriesForSession(session, eventId) {
  if (session.metadata?.product !== 'truthle_retry') return 'ignored';
  // 100%-off promo checkouts complete with amount_total 0 and payment_status 'no_payment_required'.
  const freeCheckout = session.payment_status === 'no_payment_required' ||
    (session.status === 'complete' && session.amount_total === 0);
  if (session.payment_status !== 'paid' && !freeCheckout) return 'unpaid';
  const uid = session.client_reference_id || session.metadata?.uid;
  if (!uid) return 'no_uid';
  const quantity = Math.min(Math.max(parseInt(session.metadata?.quantity, 10) || 1, 1), MAX_RETRY_QUANTITY);
  const credits = quantity * PAID_RETRIES_PER_UNIT;
  const grantRef = db.collection('stripe_retry_grants').doc(session.id);
  const paidRef = db.collection('truthle_paid_retries').doc(uid);
  return db.runTransaction(async (tx) => {
    const g = await tx.get(grantRef);
    if (g.exists) return 'duplicate';
    tx.set(grantRef, {
      uid, credits, eventId, amountTotal: session.amount_total || null, currency: session.currency || null,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.set(paidRef, {
      credits: admin.firestore.FieldValue.increment(credits),
      purchasedTotal: admin.firestore.FieldValue.increment(credits),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    return 'granted';
  });
}
exports._grantPaidRetriesForSession = grantPaidRetriesForSession;

/**
 * Stripe webhook. Endpoint: https://us-central1-worldtruth-f9789.cloudfunctions.net/stripeWebhook
 * Events: checkout.session.completed, checkout.session.async_payment_succeeded
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  if (!STRIPE_WEBHOOK_SECRET) return res.status(503).send('Not configured');
  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).send('Bad signature');
  }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const result = await grantPaidRetriesForSession(event.data.object, event.id);
      console.log('Stripe retry grant', event.id, result);
    }
    return res.status(200).json({received: true});
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(500).send('Internal error'); // Stripe retries
  }
});

/**
 * Calculate Truthle day number (days since launch)
 */
function getTruthleDay() {
  const launchDate = new Date('2024-12-16');
  const now = new Date();
  const diffTime = now.getTime() - launchDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Get today's date string in UTC (YYYY-MM-DD)
 */
function getTodayDateString() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Daily Email Reminder Function
 * Runs every day at 9am UTC to send reminder emails to subscribers
 * who haven't played today's Truthle yet.
 *
 * Uses Firebase Extension "Trigger Email" which watches the 'mail' collection
 * and sends emails via SendGrid.
 *
 * Setup:
 * 1. Install Firebase Extension: firebase ext:install firebase/firestore-send-email
 * 2. Configure SendGrid API key during installation
 * 3. Set up email template in Firestore 'email_templates' collection
 */
exports.sendDailyReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const today = getTodayDateString();
    const truthleDay = getTruthleDay();

    console.log(`Sending daily reminders for Truthle #${truthleDay} (${today})`);

    try {
      // Get all enabled email subscribers
      const subscribersSnapshot = await db.collection('email_subscribers')
        .where('enabled', '==', true)
        .get();

      if (subscribersSnapshot.empty) {
        console.log('No subscribers found');
        return null;
      }

      console.log(`Found ${subscribersSnapshot.size} subscribers`);

      // Check each subscriber
      const emailPromises = [];

      for (const doc of subscribersSnapshot.docs) {
        const subscriber = doc.data();
        const userId = doc.id;

        // Check if user has played today
        const attemptRef = db.collection('truthle').doc('daily').collection(today).doc(userId);
        const attemptDoc = await attemptRef.get();

        if (attemptDoc.exists) {
          // User has already played today, skip
          console.log(`User ${userId} already played today, skipping`);
          continue;
        }

        // Queue email for sending via Firebase Extension
        const emailDoc = {
          to: subscriber.email,
          template: {
            name: 'truthle_daily_reminder',
            data: {
              userName: subscriber.displayName || 'Truthle Player',
              truthleDay: truthleDay,
              playUrl: 'https://theworldtruth.com/truthle',
              unsubscribeUrl: `https://theworldtruth.com/truthle?unsubscribe=${userId}`,
            },
          },
        };

        emailPromises.push(
          db.collection('mail').add(emailDoc)
            .then(() => console.log(`Queued email for ${subscriber.email}`))
            .catch((err) => console.error(`Failed to queue email for ${subscriber.email}:`, err))
        );
      }

      await Promise.all(emailPromises);

      console.log(`Finished processing ${emailPromises.length} reminder emails`);
      return null;
    } catch (error) {
      console.error('Error sending daily reminders:', error);
      throw error;
    }
  });

/**
 * Update email subscription preferences
 */
exports.updateEmailPreferences = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { enabled } = data;
  const userId = context.auth.uid;

  if (typeof enabled !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'enabled must be a boolean');
  }

  try {
    const subscriberRef = db.collection('email_subscribers').doc(userId);

    await subscriberRef.set({
      enabled,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true, enabled };
  } catch (error) {
    console.error('Error updating email preferences:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update preferences');
  }
});

/**
 * Get user's email subscription status
 */
exports.getEmailPreferences = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    const subscriberRef = db.collection('email_subscribers').doc(userId);
    const subscriberDoc = await subscriberRef.get();

    if (!subscriberDoc.exists) {
      return { enabled: false, email: null };
    }

    const data = subscriberDoc.data();
    return {
      enabled: data.enabled || false,
      email: data.email || null,
    };
  } catch (error) {
    console.error('Error getting email preferences:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get preferences');
  }
});
