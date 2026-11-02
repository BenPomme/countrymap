'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FakeFirestore } = require('./helpers/fakeFirestore');
const {
  createConsumeRetryHandler,
  createGetRetryStatusHandler,
  createSaveRetryAttemptHandler,
} = require('../lib/retries');

const context = (uid = 'player-1') => ({ auth: { uid } });

test('paid retry consumes once and replays the durable receipt', async () => {
  const db = new FakeFirestore({
    'truthle_paid_retries/player-1': { credits: 2, purchasedTotal: 2, consumedTotal: 0 },
  });
  const handler = createConsumeRetryHandler({
    db,
    now: () => new Date('2026-11-02T10:00:00.000Z'),
  });

  const first = await handler({ requestId: 'request-paid-0001' }, context());
  assert.deepEqual(first, {
    success: true,
    source: 'paid',
    remainingRetries: 1,
    receiptId: first.receiptId,
  });
  assert.match(first.receiptId, /^rr_[a-f0-9]{64}$/);
  assert.equal(db.read('truthle_paid_retries/player-1').credits, 1);
  assert.equal(db.read('truthle_paid_retries/player-1').consumedTotal, 1);

  const replay = await handler({ requestId: 'request-paid-0001' }, context());
  assert.deepEqual(replay, first);
  assert.equal(db.read('truthle_paid_retries/player-1').credits, 1);
  assert.equal(db.read('truthle_paid_retries/player-1').consumedTotal, 1);
});

test('concurrent retries with the same request id debit only once', async () => {
  const db = new FakeFirestore({
    'truthle_paid_retries/player-1': { credits: 1, consumedTotal: 0 },
  });
  const handler = createConsumeRetryHandler({ db });

  const [left, right] = await Promise.all([
    handler({ requestId: 'request-concurrent-1' }, context()),
    handler({ requestId: 'request-concurrent-1' }, context()),
  ]);

  assert.deepEqual(left, right);
  assert.equal(db.read('truthle_paid_retries/player-1').credits, 0);
  assert.equal(db.read('truthle_paid_retries/player-1').consumedTotal, 1);
});

test('a lost retry response can be replayed after UTC midnight', async () => {
  let now = new Date('2026-11-02T23:59:00.000Z');
  const db = new FakeFirestore({
    'truthle_paid_retries/player-1': { credits: 1, consumedTotal: 0 },
  });
  const handler = createConsumeRetryHandler({ db, now: () => now });

  const first = await handler({ requestId: 'request-midnight-1' }, context());
  now = new Date('2026-11-03T00:01:00.000Z');
  const replay = await handler({ requestId: 'request-midnight-1' }, context());

  assert.deepEqual(replay, first);
  assert.equal(db.read('truthle_paid_retries/player-1').credits, 0);
});

test('legacy calls without a request id replay a free daily retry safely', async () => {
  const db = new FakeFirestore({
    'truthle_retry_entitlements/2026-11-02_player-1': {
      userId: 'player-1',
      date: '2026-11-02',
      granted: true,
      consumed: false,
      grantCount: 1,
    },
  });
  const handler = createConsumeRetryHandler({
    db,
    now: () => new Date('2026-11-02T12:00:00.000Z'),
  });

  const first = await handler({}, context());
  const replay = await handler({}, context());
  assert.deepEqual(replay, first);
  assert.equal(first.source, 'free');
  assert.equal(db.read('truthle_retry_entitlements/2026-11-02_player-1').consumed, true);
});

test('legacy calls without a request id cannot debit paid credits', async () => {
  const db = new FakeFirestore({
    'truthle_paid_retries/player-1': { credits: 3, consumedTotal: 0 },
  });
  const handler = createConsumeRetryHandler({ db });

  await assert.rejects(
    handler({}, context()),
    (error) => error.code === 'failed-precondition' && error.details.reason === 'request-id-required',
  );
  assert.equal(db.read('truthle_paid_retries/player-1').credits, 3);
});

test('retry status and attempt saving stay scoped to the authenticated owner', async () => {
  const db = new FakeFirestore({
    'truthle_retry_entitlements/2026-11-02_player-1': {
      userId: 'player-1',
      date: '2026-11-02',
      granted: true,
      consumed: true,
      grantCount: 1,
    },
    'truthle_paid_retries/player-1': { credits: 2 },
    'truthle_retry_entitlements/2026-11-02_player-2': {
      userId: 'player-2',
      date: '2026-11-02',
      granted: true,
      consumed: false,
      grantCount: 1,
    },
  });
  const now = () => new Date('2026-11-02T13:00:00.000Z');
  const status = createGetRetryStatusHandler({ db, now });
  const save = createSaveRetryAttemptHandler({ db, now });

  const playerOne = await status({}, context('player-1'));
  const playerTwo = await status({}, context('player-2'));
  assert.equal(playerOne.consumed, true);
  assert.equal(playerTwo.consumed, false);
  assert.equal(playerTwo.paidCredits, 0);

  await assert.rejects(
    save({
      score: 5,
      streak: 2,
      results: [true, true, true, true, true],
      times: [1, 2, 3, 4, 5],
    }, context('player-2')),
    (error) => error.code === 'failed-precondition',
  );

  const saved = await save({
    score: 4,
    streak: 2,
    results: [true, true, true, true, false],
    times: [1, 2, 3, 4, 5],
  }, context('player-1'));
  assert.equal(saved.success, true);
  assert.equal(db.read('users/player-1/truthle_retries/2026-11-02').score, 4);
  assert.equal(db.read('users/player-2/truthle_retries/2026-11-02'), undefined);
});

test('retry handlers reject unauthenticated calls and forged saved values', async () => {
  const db = new FakeFirestore();
  const consume = createConsumeRetryHandler({ db });
  const save = createSaveRetryAttemptHandler({ db });

  await assert.rejects(consume({ requestId: 'request-no-auth-1' }, {}), (error) => error.code === 'unauthenticated');
  await assert.rejects(
    save({ score: 'five', streak: 0, results: [true, true, true, true, true], times: [1, 2, 3, 4, 5] }, context()),
    (error) => error.code === 'invalid-argument',
  );
});
