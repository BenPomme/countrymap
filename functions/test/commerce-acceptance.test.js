'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { FakeFirestore } = require('./helpers/fakeFirestore');
const { createFakeStripe } = require('./helpers/fakeStripe');
const {
  createCreateCheckoutHandler,
  createGetCheckoutStatusHandler,
  createStripeWebhookHandler,
} = require('../lib/checkout');
const { createConsumeRetryHandler } = require('../lib/retries');
const {
  createAdmobRewardedSsvHandler,
  createOffertoroPostbackHandler,
} = require('../lib/providers');

const NOW = new Date('2026-11-02T18:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);
const CODE = 'WT-ACCEPT1';
const CODE_HASH = crypto.createHash('sha256').update(CODE).digest('hex');
const OFFERTORO_SECRET = 'offertoro-acceptance-secret';
const ADMOB_SECRET = 'admob-acceptance-secret';
const context = (uid = 'player-1') => ({ auth: { uid } });

function fixture(options = {}) {
  const stripe = createFakeStripe({
    prices: { price_retry: { id: 'price_retry', product: 'prod_retry' } },
    sessionOverrides: { expires_at: NOW_SECONDS + 1800 },
    ...options.stripeOptions,
  });
  const db = new FakeFirestore(options.seed);
  const now = () => new Date(NOW.getTime());
  return { db, stripe, now };
}

function eventRequest(type, session, id = 'evt_accept_paid') {
  return {
    method: 'POST',
    rawBody: Buffer.from(JSON.stringify({ id, type, data: { object: session } })),
    headers: { 'stripe-signature': 'test-signature' },
  };
}

function sharePromo(overrides = {}) {
  return {
    id: 'promo_accept',
    code: CODE,
    active: true,
    expires_at: NOW_SECONDS + 3600,
    max_redemptions: 1,
    times_redeemed: 0,
    metadata: { uid: 'issuer-1', product: 'truthle_retry_share' },
    coupon: 'coupon_share',
    ...overrides,
  };
}

function shareCoupon(overrides = {}) {
  return {
    id: 'coupon_share',
    valid: true,
    percent_off: 100,
    duration: 'once',
    applies_to: { products: ['prod_retry'] },
    metadata: { product: 'truthle_retry_share' },
    ...overrides,
  };
}

function giftFixture(options = {}) {
  return fixture({
    stripeOptions: {
      promos: { [CODE]: sharePromo(options.promo) },
      coupons: { coupon_share: shareCoupon(options.coupon) },
    },
  });
}

function createCheckout(state) {
  return createCreateCheckoutHandler({
    db: state.db,
    stripe: state.stripe,
    priceId: 'price_retry',
    siteUrl: 'https://theworldtruth.test',
    now: state.now,
  });
}

function signedOffertoroQuery(overrides = {}) {
  const query = {
    user_id: 'player-1',
    oid: 'offer-accept-1',
    amount: '1',
    ...overrides,
  };
  query.sig = crypto.createHash('md5')
    .update(`${query.user_id}${query.oid}${OFFERTORO_SECRET}`)
    .digest('hex');
  return query;
}

function offertoroRequest(query = signedOffertoroQuery(), method = 'GET') {
  return { method, query };
}

function admobRequest(overrides = {}, method = 'GET') {
  return {
    method,
    query: {
      ssv_secret: ADMOB_SECRET,
      user_id: 'player-1',
      transaction_id: 'tx-accept-1',
      reward_amount: '1',
      ...overrides,
    },
  };
}

test('acceptance: delayed paid webhook grants once and duplicate delivery is idempotent', async () => {
  const state = fixture();
  const create = createCheckout(state);
  const status = createGetCheckoutStatusHandler({ db: state.db, stripe: state.stripe, now: state.now });
  const created = await create({ quantity: 2 }, context());

  assert.deepEqual(await status({ sessionId: created.id }, context()), { status: 'pending', credits: 0 });

  const paidSession = {
    ...state.stripe.state.sessions.get(created.id),
    status: 'complete',
    payment_status: 'paid',
    amount_total: 198,
    currency: 'eur',
    metadata: { uid: 'player-1', product: 'truthle_retry', quantity: '2' },
  };
  const webhook = createStripeWebhookHandler({
    db: state.db,
    stripe: state.stripe,
    webhookSecret: 'test-webhook-secret',
    now: state.now,
  });
  const request = eventRequest('checkout.session.completed', paidSession);

  const [first, duplicate] = await Promise.all([webhook(request), webhook(request)]);
  assert.equal(first.status, 200);
  assert.equal(duplicate.status, 200);
  assert.equal(state.db.read('truthle_paid_retries/player-1').credits, 2);
  assert.equal(state.db.read('truthle_paid_retries/player-1').purchasedTotal, 2);
  assert.equal(state.db.read(`stripe_retry_grants/${created.id}`).credits, 2);
  assert.deepEqual(await status({ sessionId: created.id }, context()), { status: 'fulfilled', credits: 2 });
  await assert.rejects(
    status({ sessionId: created.id }, context('player-2')),
    (error) => error.code === 'permission-denied',
  );
});

test('acceptance: checkout status rejects unauthenticated and non-owner callers', async () => {
  const state = fixture({
    seed: {
      'stripe_checkout_sessions/cs_owned': { uid: 'player-1', product: 'truthle_retry', status: 'created' },
      'stripe_retry_grants/cs_owned': { uid: 'player-1', credits: 1 },
    },
  });
  const status = createGetCheckoutStatusHandler({ db: state.db, stripe: state.stripe, now: state.now });

  await assert.rejects(
    status({ sessionId: 'cs_owned' }, {}),
    (error) => error.code === 'unauthenticated',
  );
  await assert.rejects(
    status({ sessionId: 'cs_owned' }, context('player-2')),
    (error) => error.code === 'permission-denied',
  );
  assert.deepEqual(
    await status({ sessionId: 'cs_owned' }, context('player-1')),
    { status: 'fulfilled', credits: 1 },
  );
});

test('acceptance: gift checkout rejects expired, self, and wrong-product codes before checkout', async () => {
  const cases = [
    {
      name: 'expired',
      options: { promo: { expires_at: NOW_SECONDS - 1 } },
      reason: 'share-code-expired',
    },
    {
      name: 'self',
      options: { promo: { metadata: { uid: 'player-1', product: 'truthle_retry_share' } } },
      reason: 'share-code-self',
    },
    {
      name: 'wrong promo product',
      options: { promo: { metadata: { uid: 'issuer-1', product: 'other_product' } } },
      reason: 'share-code-wrong-product',
    },
    {
      name: 'wrong coupon product',
      options: { coupon: { applies_to: { products: ['prod_other'] } } },
      reason: 'share-code-wrong-product',
    },
  ];

  for (const item of cases) {
    const state = giftFixture(item.options);
    const create = createCheckout(state);
    await assert.rejects(
      create({ shareCode: CODE }, context('player-1')),
      (error) => error.code === 'failed-precondition' && error.details.reason === item.reason,
      item.name,
    );
    assert.equal(state.stripe.state.sessionCreateCalls, 0, item.name);
    assert.equal(state.db.paths().length, 0, item.name);
  }
});

test('acceptance: checkout prices and metadata are server-owned', async () => {
  const state = fixture();
  const captured = [];
  const createSession = state.stripe.checkout.sessions.create;
  state.stripe.checkout.sessions.create = async (params) => {
    captured.push(structuredClone(params));
    return createSession(params);
  };
  const create = createCheckout(state);

  await create({
    quantity: 2,
    priceId: 'price_attacker',
    price: 'price_attacker',
    currency: 'usd',
    amount_total: 1,
    line_items: [{ price: 'price_attacker', quantity: 99 }],
    metadata: { uid: 'attacker', product: 'other_product', quantity: '99' },
    payment_intent_data: { metadata: { uid: 'attacker', product: 'other_product' } },
  }, context('player-1'));

  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0].line_items, [{ price: 'price_retry', quantity: 2 }]);
  assert.equal(captured[0].currency, 'eur');
  assert.equal(captured[0].client_reference_id, 'player-1');
  assert.deepEqual(captured[0].metadata, { uid: 'player-1', product: 'truthle_retry', quantity: '2' });
  assert.deepEqual(captured[0].payment_intent_data, {
    metadata: { uid: 'player-1', product: 'truthle_retry' },
  });
  assert.equal(captured[0].allow_promotion_codes, false);
  assert.equal(captured[0].discounts, undefined);

  await assert.rejects(create({ quantity: 0 }, context()), (error) => error.code === 'invalid-argument');
  await assert.rejects(create({ quantity: 11 }, context()), (error) => error.code === 'invalid-argument');
});

test('acceptance: consumed retry request id keeps one durable receipt across dates and races', async () => {
  let now = new Date(NOW.getTime());
  const db = new FakeFirestore({
    'truthle_paid_retries/player-1': { credits: 1, purchasedTotal: 1, consumedTotal: 0 },
  });
  const consume = createConsumeRetryHandler({ db, now: () => new Date(now.getTime()) });
  const request = { requestId: 'request-accept-0001' };

  const [left, right] = await Promise.all([consume(request, context()), consume(request, context())]);
  assert.deepEqual(left, right);
  assert.equal(left.source, 'paid');
  assert.equal(left.remainingRetries, 0);
  assert.match(left.receiptId, /^rr_[a-f0-9]{64}$/);
  assert.equal(db.read('truthle_paid_retries/player-1').credits, 0);
  assert.equal(db.read('truthle_paid_retries/player-1').consumedTotal, 1);

  now = new Date('2026-11-03T00:05:00.000Z');
  assert.deepEqual(await consume(request, context()), left);
  assert.equal(db.read('truthle_paid_retries/player-1').consumedTotal, 1);
  const receipt = db.read(`truthle_retry_receipts/${left.receiptId}`);
  assert.equal(receipt.uid, 'player-1');
  assert.equal(receipt.requestIdHash, crypto.createHash('sha256').update('request-accept-0001').digest('hex'));
  assert.equal(receipt.requestId, undefined);
});

test('acceptance: Offertoro callback auth and finite amount fail closed, duplicates credit once', async () => {
  const db = new FakeFirestore();
  const handler = createOffertoroPostbackHandler({
    db,
    secret: OFFERTORO_SECRET,
    now: () => new Date(NOW.getTime()),
  });

  for (const amount of ['', '0', '-1', 'NaN', 'Infinity', '1e309', '1e3', '0.00001']) {
    assert.equal((await handler(offertoroRequest(signedOffertoroQuery({ amount })))).status, 400, amount);
  }
  const badSignature = signedOffertoroQuery();
  badSignature.sig = '0'.repeat(32);
  assert.equal((await handler(offertoroRequest(badSignature))).status, 403);
  assert.equal(db.paths().length, 0);

  const [left, right] = await Promise.all([
    handler(offertoroRequest()),
    handler(offertoroRequest()),
  ]);
  assert.deepEqual(left, { status: 200, body: '1' });
  assert.deepEqual(right, { status: 200, body: '1' });
  assert.equal(db.read('users/player-1/wallet/balance').coins, 10);
  assert.equal(db.paths().filter((item) => item.startsWith('offertoro_postbacks/')).length, 1);
});

test('acceptance: AdMob callback auth and finite amount fail closed, duplicates grant once', async () => {
  const db = new FakeFirestore();
  const handler = createAdmobRewardedSsvHandler({
    db,
    secret: ADMOB_SECRET,
    now: () => new Date(NOW.getTime()),
  });

  assert.equal((await handler(admobRequest({ ssv_secret: 'wrong' }))).status, 403);
  for (const rewardAmount of ['0', '-1', 'NaN', 'Infinity', '1e309', '1.5', '1001']) {
    assert.equal((await handler(admobRequest({ reward_amount: rewardAmount }))).status, 400, rewardAmount);
  }
  assert.equal(db.paths().length, 0);

  const [left, right] = await Promise.all([handler(admobRequest()), handler(admobRequest())]);
  assert.deepEqual(left, { status: 200, body: 'OK' });
  assert.deepEqual(right, { status: 200, body: 'OK' });
  assert.equal(db.read('truthle_retry_entitlements/2026-11-02_player-1').grantCount, 1);
  assert.equal(db.paths().filter((item) => item.startsWith('ad_reward_events/')).length, 1);
});

test('acceptance: Firestore rules keep authority collections server-only', () => {
  const rulesPath = path.join(__dirname, '..', '..', 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  const block = (marker) => {
    const start = rules.indexOf(marker);
    assert.notEqual(start, -1, `missing rule: ${marker}`);
    const end = rules.indexOf('\n    }', start);
    assert.notEqual(end, -1, `unterminated rule: ${marker}`);
    return rules.slice(start, end);
  };

  const serverOnly = [
    'match /offertoro_postbacks/{document=**}',
    'match /ad_reward_events/{document=**}',
    'match /truthle_paid_retries/{document=**}',
    'match /truthle_retry_receipts/{document=**}',
    'match /truthle_retry_usage/{document=**}',
    'match /wallet_claim_receipts/{document=**}',
    'match /stripe_retry_grants/{document=**}',
    'match /stripe_checkout_sessions/{document=**}',
    'match /truthle_share_promos/{document=**}',
    'match /truthle_share_claims/{document=**}',
    'match /mail/{document=**}',
    'match /mail_delivery_receipts/{document=**}',
    'match /email_unsubscribe_tokens/{document=**}',
  ];
  for (const marker of serverOnly) {
    assert.match(block(marker), /allow read, write: if false;/, marker);
  }

  for (const marker of [
    'match /truthle_retry_entitlements/{document=**}',
    'match /redemptions/{document=**}',
    'match /users/{userId}/truthle_retries/{date}',
    'match /users/{userId}/wallet/{document=**}',
    'match /truthle/stats/{date}',
  ]) {
    assert.match(block(marker), /allow (?:write|update, delete): if false;/, marker);
  }
});
