'use strict';

const { retryEntitlementId } = require('./retries');
const {
  CommerceError,
  md5,
  parseAmountCents,
  parseRewardAmount,
  readStoredCoins,
  safeEqualHex,
  safeEqualText,
  sha256,
  snapshotData,
  utcDateKey,
} = require('./util');

const CENTS_TO_COINS = 10;
const MAX_DAILY_AD_REWARDS = 1;
const PROVIDER_ID_PATTERN = /^[A-Za-z0-9._:-]{1,200}$/;
const PROVIDER_USER_PATTERN = /^[A-Za-z0-9._:-]{1,256}$/;

function queryValue(value) {
  return typeof value === 'string' ? value : null;
}

function providerResponse(status, body) {
  return { status, body };
}

function createOffertoroPostbackHandler(options) {
  const { db, secret, now = () => new Date() } = options;

  return async function offertoroPostback(request) {
    if (!request || request.method !== 'GET') return providerResponse(405, '0');
    if (typeof secret !== 'string' || secret.length < 1) return providerResponse(503, '0');

    const query = request.query || {};
    const userId = queryValue(query.user_id);
    const offerId = queryValue(query.oid);
    const signature = queryValue(query.sig);
    const amount = queryValue(query.amount);
    if (!userId || !PROVIDER_USER_PATTERN.test(userId) || !offerId || !PROVIDER_ID_PATTERN.test(offerId)) {
      return providerResponse(400, '0');
    }
    if (!signature || !/^[a-fA-F0-9]{32}$/.test(signature)) return providerResponse(403, '0');

    const expectedSignature = md5(`${userId}${offerId}${secret}`);
    if (!safeEqualHex(signature.toLowerCase(), expectedSignature)) return providerResponse(403, '0');

    let coinsToAdd;
    try {
      const amountCents = parseAmountCents(amount);
      coinsToAdd = Math.round(amountCents * CENTS_TO_COINS);
      if (!Number.isSafeInteger(coinsToAdd) || coinsToAdd < 1 || coinsToAdd > 1000000000) {
        return providerResponse(400, '0');
      }
    } catch (error) {
      return providerResponse(400, '0');
    }

    const markerId = `ot_${sha256(`${userId}\0${offerId}`)}`;
    const postbackRef = db.collection('offertoro_postbacks').doc(markerId);
    const walletRef = db.collection('users').doc(userId).collection('wallet').doc('balance');
    const nowDate = now();

    try {
      const result = await db.runTransaction(async (transaction) => {
        const postbackSnap = await transaction.get(postbackRef);
        if (postbackSnap.exists) return 'duplicate';
        const walletSnap = await transaction.get(walletRef);
        const wallet = snapshotData(walletSnap) || {};
        const currentCoins = readStoredCoins(wallet.coins);
        const newBalance = currentCoins + coinsToAdd;
        if (!Number.isSafeInteger(newBalance)) {
          throw new CommerceError('failed-precondition', 'Wallet balance is out of range', 409);
        }
        transaction.set(postbackRef, {
          userId,
          offerIdHash: sha256(offerId),
          amountCents: parseAmountCents(amount),
          coinsAwarded: coinsToAdd,
          provider: 'offertoro',
          status: 'credited',
          processedAt: nowDate,
        });
        transaction.set(walletRef, {
          coins: newBalance,
          lastUpdated: nowDate,
          updatedAt: nowDate,
        }, { merge: true });
        return 'credited';
      });
      if (result !== 'credited' && result !== 'duplicate') return providerResponse(500, '0');
      return providerResponse(200, '1');
    } catch (error) {
      return providerResponse(500, '0');
    }
  };
}

function createAdmobRewardedSsvHandler(options) {
  const {
    db,
    secret,
    now = () => new Date(),
    maxDailyRewards = MAX_DAILY_AD_REWARDS,
  } = options;

  return async function admobRewardedSsv(request) {
    if (!request || request.method !== 'GET') return providerResponse(405, 'Forbidden');
    if (typeof secret !== 'string' || secret.length < 1) return providerResponse(503, 'Not configured');

    const query = request.query || {};
    const suppliedSecret = queryValue(query.ssv_secret);
    if (!safeEqualText(suppliedSecret, secret)) return providerResponse(403, 'Forbidden');

    const userId = queryValue(query.user_id) || queryValue(query.custom_data);
    const transactionId = queryValue(query.transaction_id);
    if (!userId || !PROVIDER_USER_PATTERN.test(userId)) return providerResponse(400, 'Missing user identifier');
    if (!transactionId || !PROVIDER_ID_PATTERN.test(transactionId)) {
      return providerResponse(400, 'Missing transaction identifier');
    }

    let rewardAmount;
    try {
      rewardAmount = parseRewardAmount(query.reward_amount);
    } catch (error) {
      return providerResponse(400, 'Invalid reward amount');
    }
    const rawNetwork = queryValue(query.ad_network);
    const provider = rawNetwork && /^[A-Za-z0-9._:-]{1,40}$/.test(rawNetwork) ? rawNetwork : 'admob';
    const nowDate = now();
    const date = utcDateKey(nowDate);
    const eventId = `ad_${sha256(`${provider}\0${transactionId}`)}`;
    const eventRef = db.collection('ad_reward_events').doc(eventId);
    const entitlementRef = db.collection('truthle_retry_entitlements').doc(retryEntitlementId(date, userId));

    try {
      await db.runTransaction(async (transaction) => {
        const eventSnap = await transaction.get(eventRef);
        if (eventSnap.exists) return;
        const entitlementSnap = await transaction.get(entitlementRef);
        const entitlement = snapshotData(entitlementSnap) || {};
        const existingCount = readStoredCoins(entitlement.grantCount, 'ad grant count');
        const alreadyGranted = entitlement.granted === true;
        const effectiveCount = Math.max(existingCount, alreadyGranted ? 1 : 0);
        const granted = effectiveCount < maxDailyRewards;
        const grantCount = granted ? effectiveCount + 1 : existingCount;
        transaction.set(eventRef, {
          provider,
          providerEventIdHash: sha256(transactionId),
          userId,
          rewardAmount,
          date,
          granted,
          processedAt: nowDate,
        });
        transaction.set(entitlementRef, {
          userId,
          date,
          granted: granted || alreadyGranted,
          consumed: entitlement.consumed === true,
          grantCount,
          ...(granted ? { lastGrantedAt: nowDate } : {}),
          provider,
          lastProviderEventIdHash: sha256(transactionId),
          updatedAt: nowDate,
          ...(entitlement.consumedAt ? { consumedAt: entitlement.consumedAt } : {}),
        }, { merge: true });
      });
      return providerResponse(200, 'OK');
    } catch (error) {
      return providerResponse(500, 'Internal error');
    }
  };
}

module.exports = {
  CENTS_TO_COINS,
  MAX_DAILY_AD_REWARDS,
  createOffertoroPostbackHandler,
  createAdmobRewardedSsvHandler,
};
