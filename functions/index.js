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
