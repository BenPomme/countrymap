'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FakeFirestore } = require('./helpers/fakeFirestore');
const { createFakeStripe } = require('./helpers/fakeStripe');
const { createMintSharePromoHandler } = require('../lib/promos');

const NOW = new Date('2026-11-02T10:00:00.000Z');
const context = (uid = 'issuer-1') => ({ auth: { uid } });

function mintHandler(state, overrides = {}) {
  return createMintSharePromoHandler({
    db: state.db,
    stripe: state.stripe,
    priceId: 'price_retry',
    configuredCouponId: 'coupon_share',
    now: () => new Date(NOW.getTime()),
    ...overrides,
  });
}

function fixture(options = {}) {
  const stripe = createFakeStripe({
    prices: { price_retry: { id: 'price_retry', product: 'prod_retry' } },
    coupons: {
      coupon_share: {
        id: 'coupon_share',
        valid: true,
        percent_off: 100,
        duration: 'once',
        applies_to: { products: ['prod_retry'] },
        metadata: { product: 'truthle_retry_share' },
      },
    },
    ...options.stripeOptions,
  });
  return { db: new FakeFirestore(options.seed), stripe };
}

test('share mint returns one stable code per user and UTC day', async () => {
  const state = fixture();
  const mint = mintHandler(state);
  const first = await mint({ deviceKey: 'device-a' }, context());
  const replay = await mint({ deviceKey: 'device-a' }, context());

  assert.match(first.code, /^WT-[A-Z2-9]{10}$/);
  assert.equal(first.expiresAt, '2026-11-03T00:00:00.000Z');
  assert.deepEqual(replay, first);
  assert.equal(state.stripe.state.promoCreateCalls, 1);
  assert.equal(state.stripe.state.promos.size, 1);
  assert.equal(state.stripe.state.promos.get(first.code).max_redemptions, 1);
  assert.equal(state.stripe.state.promos.get(first.code).metadata.uid, 'issuer-1');
  assert.equal(state.stripe.state.promos.get(first.code).metadata.day, '2026-11-02');
  assert.equal(state.stripe.state.promos.get(first.code).metadata.product, 'truthle_retry_share');
});

test('concurrent share mint calls cannot create two provider codes', async () => {
  const state = fixture();
  const mint = mintHandler(state);
  const results = await Promise.allSettled([
    mint({ deviceKey: 'device-a' }, context()),
    mint({ deviceKey: 'device-a' }, context()),
  ]);

  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
  assert.equal(results.find((result) => result.status === 'rejected').reason.code, 'aborted');
  assert.equal(state.stripe.state.promoCreateCalls, 1);
  assert.equal(state.stripe.state.promos.size, 1);
  assert.equal(state.db.read('truthle_share_promos/issuer-1_2026-11-02').status, 'minted');
});

test('a stale mint reservation reuses provider idempotency and the same code', async () => {
  const state = fixture({
    seed: {
      'truthle_share_promos/issuer-1_2026-11-02': {
        uid: 'issuer-1',
        day: '2026-11-02',
        status: 'minting',
        startedAtMs: NOW.getTime() - 60000,
        attempt: 1,
        candidateCode: 'WT-RECOVER1',
        providerIdempotencyKey: 'persisted-idempotency-key',
      },
    },
  });
  const recoveredPromo = {
    id: 'promo_recovered',
    code: 'WT-RECOVER1',
    active: true,
    expires_at: Math.floor(NOW.getTime() / 1000) + 3600,
    max_redemptions: 1,
    times_redeemed: 0,
    metadata: { uid: 'issuer-1', day: '2026-11-02', product: 'truthle_retry_share' },
    coupon: 'coupon_share',
  };
  state.stripe.state.idempotency.set('persisted-idempotency-key', recoveredPromo);

  const result = await mintHandler(state)({}, context());
  assert.equal(result.code, 'WT-RECOVER1');
  assert.equal(state.stripe.state.promoCreateCalls, 1);
  assert.equal(state.db.read('truthle_share_promos/issuer-1_2026-11-02').status, 'minted');
  assert.equal(state.db.read('truthle_share_promos/issuer-1_2026-11-02').promoId, 'promo_recovered');
});

test('a provider code collision falls back once and can still mint safely', async () => {
  const state = fixture({
    seed: {
      'truthle_share_promos/issuer-1_2026-11-02': {
        uid: 'issuer-1',
        day: '2026-11-02',
        status: 'minting',
        startedAtMs: NOW.getTime() - 60000,
        attempt: 1,
        candidateCode: 'WT-COLLIDE1',
        providerIdempotencyKey: 'collision-idempotency-key',
      },
    },
  });
  state.stripe.state.promos.set('WT-COLLIDE1', {
    id: 'promo_other',
    code: 'WT-COLLIDE1',
    active: true,
    expires_at: Math.floor(NOW.getTime() / 1000) + 3600,
    max_redemptions: 1,
    times_redeemed: 0,
    metadata: { uid: 'issuer-2', day: '2026-11-02', product: 'truthle_retry_share' },
    coupon: 'coupon_share',
  });

  const result = await mintHandler(state)({}, context());
  assert.notEqual(result.code, 'WT-COLLIDE1');
  assert.match(result.code, /^WT-[A-Z2-9]{10}$/);
  assert.equal(state.stripe.state.promoCreateCalls, 2);
  assert.equal(state.stripe.state.promos.get(result.code).metadata.uid, 'issuer-1');
});

test('share mint remains scoped per user and rejects forged device keys or missing config', async () => {
  const state = fixture();
  const mint = mintHandler(state);
  const first = await mint({}, context('issuer-1'));
  const second = await mint({}, context('issuer-2'));

  assert.notEqual(first.code, second.code);
  assert.equal(state.stripe.state.promos.size, 2);
  await assert.rejects(
    mint({ deviceKey: 'x'.repeat(65) }, context()),
    (error) => error.code === 'invalid-argument',
  );
  await assert.rejects(mint({}, {}), (error) => error.code === 'unauthenticated');

  const unconfigured = fixture();
  await assert.rejects(
    mintHandler(unconfigured, { priceId: '' })({}, context()),
    (error) => error.code === 'failed-precondition',
  );
  assert.equal(unconfigured.stripe.state.promoCreateCalls, 0);
  assert.equal(unconfigured.db.paths().length, 0);
});

test('provider failure leaves a retryable failed reservation without returning a code', async () => {
  const failure = new Error('provider unavailable');
  const state = fixture({ stripeOptions: { failPromoCreate: failure } });

  await assert.rejects(
    mintHandler(state)({}, context()),
    (error) => error.code === 'internal',
  );
  assert.equal(state.db.read('truthle_share_promos/issuer-1_2026-11-02').status, 'failed');
  assert.equal(state.db.read('truthle_share_promos/issuer-1_2026-11-02').code, undefined);
});
