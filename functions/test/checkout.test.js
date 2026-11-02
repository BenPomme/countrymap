'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FakeFirestore } = require('./helpers/fakeFirestore');
const { createFakeStripe } = require('./helpers/fakeStripe');
const {
  createCreateCheckoutHandler,
  createGetCheckoutStatusHandler,
  createStripeWebhookHandler,
  markCheckoutExpired,
  shareClaimDecision,
} = require('../lib/checkout');

const NOW = new Date('2026-11-02T12:00:00.000Z');
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);
const CODE = 'WT-FRIEND1';
const CODE_HASH = require('crypto').createHash('sha256').update(CODE).digest('hex');
const context = (uid = 'recipient-1') => ({ auth: { uid } });

function sharePromo(overrides = {}) {
  return {
    id: 'promo_share_1',
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

function fixture(options = {}) {
  const promos = options.promos || { [CODE]: sharePromo() };
  const coupons = options.coupons || {
    coupon_share: {
      id: 'coupon_share',
      valid: true,
      percent_off: 100,
      duration: 'once',
      applies_to: { products: ['prod_retry'] },
      metadata: { product: 'truthle_retry_share' },
    },
  };
  const stripe = createFakeStripe({
    promos,
    coupons,
    prices: { price_retry: { id: 'price_retry', product: 'prod_retry' } },
    sessionOverrides: { expires_at: NOW_SECONDS + 1800 },
    ...options.stripeOptions,
  });
  const db = new FakeFirestore(options.seed);
  const now = () => new Date(NOW.getTime());
  return { db, stripe, now };
}

function createCheckout(fixtureState, overrides = {}) {
  return createCreateCheckoutHandler({
    db: fixtureState.db,
    stripe: fixtureState.stripe,
    priceId: 'price_retry',
    siteUrl: 'https://theworldtruth.test',
    now: fixtureState.now,
    ...overrides,
  });
}

function eventRequest(type, session, id = 'evt_checkout_1') {
  return {
    method: 'POST',
    rawBody: Buffer.from(JSON.stringify({ id, type, data: { object: session } })),
    headers: { 'stripe-signature': 'test-signature' },
  };
}

function paidSession(overrides = {}) {
  return {
    id: 'cs_paid_1',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 99,
    currency: 'eur',
    client_reference_id: 'player-1',
    metadata: { uid: 'player-1', product: 'truthle_retry', quantity: '1' },
    ...overrides,
  };
}

test('share checkout requires quantity one and validates code product, expiry and issuer', async () => {
  const state = fixture();
  const create = createCheckout(state);
  const created = await create({ quantity: 1, shareCode: CODE, returnTo: 'truthle' }, context());

  const session = state.stripe.state.sessions.get(created.id);
  assert.equal(created.url, session.url);
  assert.equal(session.allow_promotion_codes, false);
  assert.deepEqual(session.discounts, [{ promotion_code: 'promo_share_1' }]);
  assert.deepEqual(session.line_items, [{ price: 'price_retry', quantity: 1 }]);
  assert.equal(session.metadata.product, 'truthle_retry');
  assert.equal(session.metadata.quantity, '1');

  await assert.rejects(
    create({ quantity: 2, shareCode: CODE }, context()),
    (error) => error.code === 'invalid-argument',
  );
});

test('ordinary checkout never offers a hosted promotion-code bypass', async () => {
  const state = fixture();
  const create = createCheckout(state);
  const result = await create({ quantity: 2, returnTo: 'true-false' }, context());
  const session = state.stripe.state.sessions.get(result.id);

  assert.equal(session.allow_promotion_codes, false);
  assert.equal(session.discounts, undefined);
  assert.equal(session.line_items[0].quantity, 2);
  assert.match(session.success_url, /^https:\/\/theworldtruth\.test\/true-false\/\?checkout=success/);
});

test('share checkout rejects self, wrong product, wrong discount, expired and redeemed codes', async () => {
  const cases = [
    {
      name: 'self',
      configure: (promos) => { promos.get(CODE).metadata.uid = 'recipient-1'; },
      reason: 'share-code-self',
    },
    {
      name: 'wrong promo product',
      configure: (promos) => { promos.get(CODE).metadata.product = 'other'; },
      reason: 'share-code-wrong-product',
    },
    {
      name: 'wrong coupon product',
      configure: (promos, coupons) => { coupons.coupon_share.applies_to.products = ['prod_other']; },
      reason: 'share-code-wrong-product',
    },
    {
      name: 'wrong discount',
      configure: (promos, coupons) => { coupons.coupon_share.percent_off = 50; },
      reason: 'share-code-wrong-discount',
    },
    {
      name: 'expired',
      configure: (promos) => { promos.get(CODE).expires_at = NOW_SECONDS - 1; },
      reason: 'share-code-expired',
    },
    {
      name: 'redeemed',
      configure: (promos) => { promos.get(CODE).times_redeemed = 1; },
      reason: 'share-code-redeemed',
    },
    {
      name: 'multi use',
      configure: (promos) => { promos.get(CODE).max_redemptions = 2; },
      reason: 'share-code-not-single-use',
    },
  ];

  for (const testCase of cases) {
    const promos = new Map([[CODE, sharePromo()]]);
    const coupons = {
      coupon_share: {
        id: 'coupon_share',
        valid: true,
        percent_off: 100,
        duration: 'once',
        applies_to: { products: ['prod_retry'] },
        metadata: { product: 'truthle_retry_share' },
      },
    };
    testCase.configure(promos, coupons);
    const state = fixture({ promos, coupons });
    const create = createCheckout(state);
    await assert.rejects(
      create({ shareCode: CODE }, context()),
      (error) => error.code === 'failed-precondition' && error.details && error.details.reason === testCase.reason,
      testCase.name,
    );
  }
});

test('an active share reservation is reused instead of creating another checkout', async () => {
  const state = fixture();
  const create = createCheckout(state);
  const first = await create({ shareCode: CODE }, context());
  const second = await create({ shareCode: CODE }, context());

  assert.deepEqual(second, first);
  assert.equal(state.stripe.state.sessionCreateCalls, 1);
});

test('a legacy active reservation without an expiry is reused only by its recipient', async () => {
  const state = fixture({
    seed: {
      [`truthle_share_claims/sc_${CODE_HASH}`]: {
        codeHash: CODE_HASH,
        product: 'truthle_retry_share',
        recipientUid: 'recipient-1',
        issuerUid: 'issuer-1',
        status: 'reserved',
        sessionId: 'cs_legacy_1',
      },
    },
    stripeOptions: {
      sessions: {
        cs_legacy_1: {
          id: 'cs_legacy_1',
          url: 'https://checkout.stripe.test/cs_legacy_1',
          status: 'open',
        },
      },
    },
  });
  const create = createCheckout(state);

  assert.deepEqual(
    await create({ shareCode: CODE }, context('recipient-1')),
    { url: 'https://checkout.stripe.test/cs_legacy_1', id: 'cs_legacy_1' },
  );
  await assert.rejects(
    create({ shareCode: CODE }, context('recipient-2')),
    (error) => error.details && error.details.reason === 'share-code-reserved',
  );
  assert.equal(state.stripe.state.sessionCreateCalls, 0);

  assert.deepEqual(
    shareClaimDecision({
      claim: { status: 'reserved', recipientUid: 'recipient-1', sessionId: 'cs_legacy_1' },
      recipientUid: 'recipient-1',
      nowMs: NOW.getTime(),
    }),
    { action: 'reuse', sessionId: 'cs_legacy_1' },
  );
  assert.equal(
    shareClaimDecision({
      claim: { status: 'creating', recipientUid: 'recipient-1' },
      recipientUid: 'recipient-1',
      nowMs: NOW.getTime(),
    }).reason,
    'share-code-in-progress',
  );
});

test('expiry releases the same recipient share reservation for a fresh checkout', async () => {
  const state = fixture();
  const create = createCheckout(state);
  const first = await create({ shareCode: CODE }, context());
  const session = state.stripe.state.sessions.get(first.id);

  await markCheckoutExpired({ db: state.db, session, now: state.now });
  assert.equal(state.db.read(`truthle_share_claims/sc_${CODE_HASH}`).status, 'expired');

  const second = await create({ shareCode: CODE }, context());
  assert.notEqual(second.id, first.id);
  assert.equal(state.db.read(`truthle_share_claims/sc_${CODE_HASH}`).status, 'reserved');
});

test('a delayed webhook for an earlier expired gift session still grants once', async () => {
  const state = fixture();
  const create = createCheckout(state);
  const first = await create({ shareCode: CODE }, context());
  const firstSession = state.stripe.state.sessions.get(first.id);
  await markCheckoutExpired({ db: state.db, session: firstSession, now: state.now });

  const second = await create({ shareCode: CODE }, context());
  const claim = state.db.read(`truthle_share_claims/sc_${CODE_HASH}`);
  assert.deepEqual(claim.sessionIds.sort(), [first.id, second.id].sort());

  const handler = createStripeWebhookHandler({
    db: state.db,
    stripe: state.stripe,
    webhookSecret: 'test-webhook-secret',
    now: state.now,
  });
  const giftSession = (id) => paidSession({
    id,
    client_reference_id: 'recipient-1',
    payment_status: 'no_payment_required',
    amount_total: 0,
    metadata: {
      uid: 'recipient-1',
      product: 'truthle_retry',
      quantity: '1',
      shareCodeHash: CODE_HASH,
    },
  });

  assert.equal((await handler(eventRequest('checkout.session.completed', giftSession(first.id)))).status, 200);
  assert.equal((await handler(eventRequest('checkout.session.completed', giftSession(second.id)))).status, 500);
  assert.equal(state.db.read('truthle_paid_retries/recipient-1').credits, 1);
  assert.equal(state.db.read(`truthle_share_claims/sc_${CODE_HASH}`).status, 'redeemed');
});

test('checkout status is owner-only and only a durable grant is fulfilled', async () => {
  const state = fixture();
  state.stripe.state.sessions.set('cs_paid_pending', paidSession({ id: 'cs_paid_pending' }));
  const status = createGetCheckoutStatusHandler({ db: state.db, stripe: state.stripe, now: state.now });

  assert.deepEqual(
    await status({ sessionId: 'cs_paid_pending' }, context('player-1')),
    { status: 'pending', credits: 0 },
  );
  await assert.rejects(
    status({ sessionId: 'cs_paid_pending' }, context('player-2')),
    (error) => error.code === 'permission-denied',
  );

  state.db.write('stripe_retry_grants/cs_paid_pending', { uid: 'player-1', credits: 2 });
  assert.deepEqual(
    await status({ sessionId: 'cs_paid_pending' }, context('player-1')),
    { status: 'fulfilled', credits: 2 },
  );
  await assert.rejects(
    status({ sessionId: 'cs_paid_pending' }, context('player-2')),
    (error) => error.code === 'permission-denied',
  );
});

test('checkout status reports trusted expired and unpaid-failed states', async () => {
  const state = fixture();
  state.stripe.state.sessions.set('cs_expired_1', paidSession({
    id: 'cs_expired_1',
    status: 'expired',
    payment_status: 'unpaid',
  }));
  state.stripe.state.sessions.set('cs_unpaid_1', paidSession({
    id: 'cs_unpaid_1',
    status: 'complete',
    payment_status: 'unpaid',
  }));
  const status = createGetCheckoutStatusHandler({ db: state.db, stripe: state.stripe, now: state.now });

  assert.deepEqual(
    await status({ sessionId: 'cs_expired_1' }, context('player-1')),
    { status: 'expired', credits: 0 },
  );
  assert.deepEqual(
    await status({ sessionId: 'cs_unpaid_1' }, context('player-1')),
    { status: 'failed', credits: 0 },
  );
});

test('webhook grant is idempotent even when duplicate deliveries race', async () => {
  const state = fixture();
  const handler = createStripeWebhookHandler({
    db: state.db,
    stripe: state.stripe,
    webhookSecret: 'test-webhook-secret',
    now: state.now,
  });
  const request = eventRequest('checkout.session.completed', paidSession());

  const [left, right] = await Promise.all([handler(request), handler(request)]);
  assert.equal(left.status, 200);
  assert.equal(right.status, 200);
  assert.equal(state.db.read('truthle_paid_retries/player-1').credits, 1);
  assert.equal(state.db.read('truthle_paid_retries/player-1').purchasedTotal, 1);
  assert.equal(state.db.read('stripe_retry_grants/cs_paid_1').credits, 1);
});

test('a paid webhook without payment does not grant credits', async () => {
  const state = fixture();
  const handler = createStripeWebhookHandler({
    db: state.db,
    stripe: state.stripe,
    webhookSecret: 'test-webhook-secret',
    now: state.now,
  });
  const result = await handler(eventRequest('checkout.session.completed', paidSession({ payment_status: 'unpaid' })));

  assert.equal(result.status, 200);
  assert.equal(state.db.read('truthle_paid_retries/player-1'), undefined);
  assert.equal(state.db.read('stripe_retry_grants/cs_paid_1'), undefined);
});

test('a delayed gift webhook completes an expired local reservation atomically once', async () => {
  let webhookError = null;
  const state = fixture({
    seed: {
      'stripe_checkout_sessions/cs_gift_1': {
        uid: 'recipient-1',
        quantity: 1,
        product: 'truthle_retry',
        status: 'expired',
      },
      [`truthle_share_claims/sc_${CODE_HASH}`]: {
        codeHash: CODE_HASH,
        product: 'truthle_retry_share',
        recipientUid: 'recipient-1',
        issuerUid: 'issuer-1',
        status: 'expired',
        sessionId: 'cs_gift_1',
      },
    },
  });
  const handler = createStripeWebhookHandler({
    db: state.db,
    stripe: state.stripe,
    webhookSecret: 'test-webhook-secret',
    now: state.now,
    onError: (error) => { webhookError = error; },
  });
  const session = paidSession({
    id: 'cs_gift_1',
    client_reference_id: 'recipient-1',
    payment_status: 'no_payment_required',
    amount_total: 0,
    metadata: {
      uid: 'recipient-1',
      product: 'truthle_retry',
      quantity: '1',
      shareCodeHash: CODE_HASH,
    },
  });

  const first = await handler(eventRequest('checkout.session.completed', session));
  assert.equal(first.status, 200, webhookError && webhookError.stack);
  assert.equal((await handler(eventRequest('checkout.session.completed', session))).status, 200);
  assert.equal(state.db.read('truthle_paid_retries/recipient-1').credits, 1);
  assert.equal(state.db.read(`truthle_share_claims/sc_${CODE_HASH}`).status, 'redeemed');
  assert.equal(state.db.read('stripe_checkout_sessions/cs_gift_1').status, 'fulfilled');
});

test('wrong or self gift claims fail closed without a grant', async () => {
  const baseClaim = {
    codeHash: CODE_HASH,
    product: 'truthle_retry_share',
    recipientUid: 'recipient-1',
    issuerUid: 'issuer-1',
    status: 'reserved',
    sessionId: 'cs_gift_bad',
  };
  for (const claim of [
    { ...baseClaim, recipientUid: 'someone-else' },
    { ...baseClaim, issuerUid: 'recipient-1' },
    { ...baseClaim, product: 'other_product' },
  ]) {
    const state = fixture({
      seed: { [`truthle_share_claims/sc_${CODE_HASH}`]: claim },
    });
    const handler = createStripeWebhookHandler({
      db: state.db,
      stripe: state.stripe,
      webhookSecret: 'test-webhook-secret',
      now: state.now,
    });
    const session = paidSession({
      id: 'cs_gift_bad',
      client_reference_id: 'recipient-1',
      payment_status: 'no_payment_required',
      amount_total: 0,
      metadata: {
        uid: 'recipient-1',
        product: 'truthle_retry',
        quantity: '1',
        shareCodeHash: CODE_HASH,
      },
    });

    assert.equal(
      (await handler(eventRequest('checkout.session.completed', session))).status,
      500,
      JSON.stringify(claim),
    );
    assert.equal(state.db.read('truthle_paid_retries/recipient-1'), undefined);
    assert.equal(state.db.read('stripe_retry_grants/cs_gift_bad'), undefined);
    assert.equal(state.db.read(`truthle_share_claims/sc_${CODE_HASH}`).status, 'reserved');
  }
});

test('an expired webhook cannot regress a fulfilled session', async () => {
  const state = fixture();
  const webhook = createStripeWebhookHandler({
    db: state.db,
    stripe: state.stripe,
    webhookSecret: 'test-webhook-secret',
    now: state.now,
  });

  await webhook(eventRequest('checkout.session.completed', paidSession()));
  await webhook(eventRequest('checkout.session.expired', paidSession({ status: 'expired' }), 'evt_expired_1'));

  assert.equal(state.db.read('stripe_checkout_sessions/cs_paid_1').status, 'fulfilled');
  assert.equal(state.db.read('truthle_paid_retries/player-1').credits, 1);
});

test('webhook verification and configuration fail closed', async () => {
  const state = fixture();
  const configured = createStripeWebhookHandler({
    db: state.db,
    stripe: state.stripe,
    webhookSecret: 'test-webhook-secret',
    now: state.now,
  });
  const request = eventRequest('checkout.session.completed', paidSession());

  assert.equal((await configured({ ...request, headers: { 'stripe-signature': 'wrong' } })).status, 400);
  assert.equal((await configured({ ...request, method: 'GET' })).status, 405);
  assert.equal((await configured(request)).status, 200);
  assert.equal(state.db.read('stripe_retry_grants/cs_paid_1').credits, 1);

  const fresh = fixture();
  const unconfigured = createStripeWebhookHandler({
    db: fresh.db,
    stripe: fresh.stripe,
    webhookSecret: '',
    now: fresh.now,
  });
  assert.equal((await unconfigured(request)).status, 503);
  assert.equal(fresh.db.read('truthle_paid_retries/player-1'), undefined);
});
