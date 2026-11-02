'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { CommerceError, toSafeError } = require('./lib/util');
const { createCreateCheckoutHandler, createGetCheckoutStatusHandler, createStripeWebhookHandler } = require('./lib/checkout');
const { createMintSharePromoHandler } = require('./lib/promos');
const { createOffertoroPostbackHandler, createAdmobRewardedSsvHandler } = require('./lib/providers');
const {
  createGetRetryStatusHandler,
  createConsumeRetryHandler,
  createSaveRetryAttemptHandler,
} = require('./lib/retries');
const {
  createGetUserCoinsHandler,
  createClaimWalletHandler,
  createRedeemCoinsHandler,
} = require('./lib/wallet');
const {
  createGetEmailPreferencesHandler,
  createUpdateEmailPreferencesHandler,
  createUnsubscribeRemindersHandler,
  createUnsubscribeRemindersHttpHandler,
  createQueueDailyRemindersHandler,
} = require('./lib/reminders');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const config = functions.config();
const stripeConfig = config.stripe || {};
const STRIPE_SECRET_KEY = stripeConfig.secret || process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = stripeConfig.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICE_ID = stripeConfig.price_id || process.env.STRIPE_PRICE_ID || '';
const STRIPE_SHARE_COUPON_ID = stripeConfig.share_coupon_id || process.env.STRIPE_SHARE_COUPON_ID || '';
const SITE_URL = stripeConfig.site_url || process.env.SITE_URL || 'https://theworldtruth.com';
const OFFERTORO_SECRET = (config.offertoro && config.offertoro.secret) || '';
const ADMOB_SSV_SECRET = (config.admob && config.admob.ssv_secret) || '';
const REMINDERS_ENABLED = String((config.reminders && config.reminders.enabled) || process.env.REMINDERS_ENABLED || '')
  .toLowerCase() === 'true';
const REMINDER_UNSUBSCRIBE_URL =
  (config.reminders && config.reminders.unsubscribe_url) ||
  process.env.REMINDER_UNSUBSCRIBE_URL ||
  '';

let stripeClient = null;
function requireStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new CommerceError('failed-precondition', 'Payments are not configured yet', 503);
  }
  if (!stripeClient) stripeClient = require('stripe')(STRIPE_SECRET_KEY);
  return stripeClient;
}

const lazyStripe = new Proxy({}, {
  get(target, property) {
    return requireStripe()[property];
  },
});

function toHttpsError(error) {
  if (error instanceof functions.https.HttpsError) return error;
  const safe = toSafeError(error);
  return new functions.https.HttpsError(safe.code, safe.message, safe.details);
}

function callable(handler) {
  return async (data, context) => {
    try {
      return await handler(data, context);
    } catch (error) {
      throw toHttpsError(error);
    }
  };
}

function sendHttpResult(res, result) {
  res.status(result.status);
  if (typeof result.body === 'string') return res.send(result.body);
  return res.json(result.body);
}

exports.getUserCoins = functions.https.onCall(callable(createGetUserCoinsHandler({ db })));
exports.redeemCoins = functions.https.onCall(callable(createRedeemCoinsHandler({ db })));
exports.claimTruthleWallet = functions.https.onCall(callable(createClaimWalletHandler({ db })));

exports.getTruthleRetryStatus = functions.https.onCall(callable(createGetRetryStatusHandler({ db })));
exports.consumeTruthleRetry = functions.https.onCall(callable(createConsumeRetryHandler({ db })));
exports.saveTruthleRetryAttempt = functions.https.onCall(callable(createSaveRetryAttemptHandler({ db })));

exports.createTruthleRetryCheckout = functions.https.onCall(callable(createCreateCheckoutHandler({
  db,
  stripe: lazyStripe,
  priceId: STRIPE_PRICE_ID,
  siteUrl: SITE_URL,
})));
exports.getTruthleCheckoutStatus = functions.https.onCall(callable(createGetCheckoutStatusHandler({
  db,
  stripe: lazyStripe,
})));
exports.mintTruthleSharePromo = functions.https.onCall(callable(createMintSharePromoHandler({
  db,
  stripe: lazyStripe,
  priceId: STRIPE_PRICE_ID,
  configuredCouponId: STRIPE_SHARE_COUPON_ID,
})));

exports.offertoroPostback = functions.https.onRequest(createOffertoroPostbackHandler({
  db,
  secret: OFFERTORO_SECRET,
}));
exports.admobRewardedSSV = functions.https.onRequest(createAdmobRewardedSsvHandler({
  db,
  secret: ADMOB_SSV_SECRET,
}));

const stripeWebhookHandler = createStripeWebhookHandler({
  db,
  stripe: lazyStripe,
  webhookSecret: STRIPE_WEBHOOK_SECRET,
});
exports.stripeWebhook = functions.https.onRequest(async (request, response) => {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return response.status(503).send('Not configured');
  }
  try {
    const result = await stripeWebhookHandler(request);
    return sendHttpResult(response, result);
  } catch (error) {
    return response.status(500).send('Internal error');
  }
});

exports.getEmailPreferences = functions.https.onCall(callable(createGetEmailPreferencesHandler({ db })));
exports.updateEmailPreferences = functions.https.onCall(callable(createUpdateEmailPreferencesHandler({ db })));
exports.unsubscribeReminders = functions.https.onCall(callable(createUnsubscribeRemindersHandler({ db })));

const unsubscribeHandler = createUnsubscribeRemindersHandler({ db });
const unsubscribeHttpHandler = createUnsubscribeRemindersHttpHandler({ unsubscribe: unsubscribeHandler });
exports.unsubscribeRemindersLink = functions.https.onRequest(async (request, response) => {
  const result = await unsubscribeHttpHandler(request);
  return sendHttpResult(response, result);
});

const queueDailyReminders = createQueueDailyRemindersHandler({
  db,
  enabled: REMINDERS_ENABLED,
  unsubscribeBaseUrl: REMINDER_UNSUBSCRIBE_URL,
});
exports.sendDailyReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(() => queueDailyReminders());
