'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FakeFirestore } = require('./helpers/fakeFirestore');
const {
  createAdmobRewardedSsvHandler,
  createOffertoroPostbackHandler,
} = require('../lib/providers');

const NOW = new Date('2026-11-02T15:00:00.000Z');
const OFFERTORO_SECRET = 'offertoro-test-secret';
const ADMOB_SECRET = 'admob-test-secret';

function signedOffertoroQuery(overrides = {}) {
  const query = {
    user_id: 'player-1',
    oid: 'offer-123',
    sig: '',
    amount: '1',
    ...overrides,
  };
  query.sig = require('crypto')
    .createHash('md5')
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
      transaction_id: 'tx-offer-123',
      reward_amount: '1',
      ...overrides,
    },
  };
}

test('Offertoro credits a valid postback exactly once across duplicate deliveries', async () => {
  const db = new FakeFirestore();
  const handler = createOffertoroPostbackHandler({
    db,
    secret: OFFERTORO_SECRET,
    now: () => new Date(NOW.getTime()),
  });

  const [left, right] = await Promise.all([
    handler(offertoroRequest()),
    handler(offertoroRequest()),
  ]);

  assert.deepEqual(left, { status: 200, body: '1' });
  assert.deepEqual(right, { status: 200, body: '1' });
  assert.equal(db.read('users/player-1/wallet/balance').coins, 10);
  assert.equal(db.paths().filter((path) => path.startsWith('offertoro_postbacks/')).length, 1);
  const markerPath = db.paths().find((path) => path.startsWith('offertoro_postbacks/'));
  assert.equal(db.read(markerPath).status, 'credited');
  assert.equal(db.read(markerPath).coinsAwarded, 10);
});

test('Offertoro duplicate marker credit stays atomic and does not trust a changed amount', async () => {
  const db = new FakeFirestore();
  const handler = createOffertoroPostbackHandler({
    db,
    secret: OFFERTORO_SECRET,
    now: () => new Date(NOW.getTime()),
  });

  assert.equal((await handler(offertoroRequest(signedOffertoroQuery({ amount: '1' })))).status, 200);
  assert.equal((await handler(offertoroRequest(signedOffertoroQuery({ amount: '50' })))).status, 200);

  assert.equal(db.read('users/player-1/wallet/balance').coins, 10);
  assert.equal(db.paths().filter((path) => path.startsWith('offertoro_postbacks/')).length, 1);
});

test('Offertoro fails closed without its secret or with a bad signature', async () => {
  const db = new FakeFirestore();
  const unconfigured = createOffertoroPostbackHandler({ db, secret: '', now: () => NOW });
  assert.equal((await unconfigured(offertoroRequest())).status, 503);
  assert.equal(db.paths().length, 0);

  const handler = createOffertoroPostbackHandler({ db, secret: OFFERTORO_SECRET, now: () => NOW });
  const badSignature = signedOffertoroQuery();
  badSignature.sig = '0'.repeat(32);
  assert.equal((await handler(offertoroRequest(badSignature))).status, 403);
  assert.equal(db.paths().length, 0);
});

test('Offertoro rejects malformed, negative, non-finite and oversized amounts before credit', async () => {
  const db = new FakeFirestore();
  const handler = createOffertoroPostbackHandler({ db, secret: OFFERTORO_SECRET, now: () => NOW });
  const invalidAmounts = ['0', '-1', 'NaN', 'Infinity', '1e3', '1.2.3', '100000001', '0.00001'];

  for (const amount of invalidAmounts) {
    const result = await handler(offertoroRequest(signedOffertoroQuery({ amount })));
    assert.equal(result.status, 400, amount);
  }
  assert.equal(db.read('users/player-1/wallet/balance'), undefined);
  assert.equal(db.paths().length, 0);

  assert.equal((await handler(offertoroRequest(signedOffertoroQuery(), 'POST'))).status, 405);
  assert.equal((await handler({ method: 'GET', query: { ...signedOffertoroQuery(), user_id: '../bad' } })).status, 400);
});

test('AdMob grants one daily retry and records its marker in the same transaction', async () => {
  const db = new FakeFirestore();
  const handler = createAdmobRewardedSsvHandler({
    db,
    secret: ADMOB_SECRET,
    now: () => new Date(NOW.getTime()),
  });

  assert.deepEqual(await handler(admobRequest()), { status: 200, body: 'OK' });
  const entitlement = db.read('truthle_retry_entitlements/2026-11-02_player-1');
  assert.equal(entitlement.granted, true);
  assert.equal(entitlement.grantCount, 1);
  assert.equal(entitlement.consumed, false);
  const markerPath = db.paths().find((path) => path.startsWith('ad_reward_events/'));
  assert.equal(db.read(markerPath).granted, true);
  assert.equal(db.read(markerPath).rewardAmount, 1);
});

test('AdMob duplicate and concurrent callbacks do not grant twice', async () => {
  const db = new FakeFirestore();
  const handler = createAdmobRewardedSsvHandler({
    db,
    secret: ADMOB_SECRET,
    now: () => new Date(NOW.getTime()),
  });
  const request = admobRequest();

  const [left, right] = await Promise.all([handler(request), handler(request)]);
  assert.deepEqual(left, { status: 200, body: 'OK' });
  assert.deepEqual(right, { status: 200, body: 'OK' });
  assert.equal(db.read('truthle_retry_entitlements/2026-11-02_player-1').grantCount, 1);
  assert.equal(db.paths().filter((path) => path.startsWith('ad_reward_events/')).length, 1);
});

test('AdMob caps a second distinct daily transaction without a second grant', async () => {
  const db = new FakeFirestore();
  const handler = createAdmobRewardedSsvHandler({
    db,
    secret: ADMOB_SECRET,
    now: () => new Date(NOW.getTime()),
  });

  assert.equal((await handler(admobRequest())).status, 200);
  assert.equal((await handler(admobRequest({ transaction_id: 'tx-offer-456' }))).status, 200);

  const entitlement = db.read('truthle_retry_entitlements/2026-11-02_player-1');
  assert.equal(entitlement.grantCount, 1);
  assert.equal(entitlement.granted, true);
  const markers = db.paths().filter((path) => path.startsWith('ad_reward_events/'));
  assert.equal(markers.length, 2);
  assert.equal(markers.filter((path) => db.read(path).granted === true).length, 1);
});

test('AdMob fails closed without a secret and does not create a random fallback transaction', async () => {
  const db = new FakeFirestore();
  const unconfigured = createAdmobRewardedSsvHandler({ db, secret: '', now: () => NOW });
  assert.equal((await unconfigured(admobRequest())).status, 503);
  assert.equal(db.paths().length, 0);

  const handler = createAdmobRewardedSsvHandler({ db, secret: ADMOB_SECRET, now: () => NOW });
  assert.equal((await handler(admobRequest({ ssv_secret: 'wrong' }))).status, 403);
  const missingTransaction = admobRequest();
  delete missingTransaction.query.transaction_id;
  assert.equal((await handler(missingTransaction)).status, 400);
  assert.equal(db.paths().length, 0);
});

test('AdMob rejects invalid users and non-finite or out-of-range reward amounts', async () => {
  const db = new FakeFirestore();
  const handler = createAdmobRewardedSsvHandler({ db, secret: ADMOB_SECRET, now: () => NOW });

  for (const rewardAmount of ['0', '-1', 'NaN', 'Infinity', '1.5', '1001', '1e3']) {
    assert.equal((await handler(admobRequest({ reward_amount: rewardAmount }))).status, 400, rewardAmount);
  }
  assert.equal((await handler(admobRequest({ user_id: '../bad' }))).status, 400);
  assert.equal((await handler(admobRequest({}, 'POST'))).status, 405);
  assert.equal(db.paths().length, 0);
});

test('AdMob supports the existing custom_data user identifier', async () => {
  const db = new FakeFirestore();
  const handler = createAdmobRewardedSsvHandler({ db, secret: ADMOB_SECRET, now: () => NOW });
  const request = admobRequest({ custom_data: 'player-2' });
  delete request.query.user_id;

  assert.equal((await handler(request)).status, 200);
  assert.equal(db.read('truthle_retry_entitlements/2026-11-02_player-2').granted, true);
});
