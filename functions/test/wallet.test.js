'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FakeFirestore } = require('./helpers/fakeFirestore');
const {
  createClaimWalletHandler,
  createGetUserCoinsHandler,
  createRedeemCoinsHandler,
} = require('../lib/wallet');

const context = (uid = 'player-1') => ({ auth: { uid } });
const walletPath = (uid = 'player-1') => `users/${uid}/wallet/balance`;

test('wallet claim is atomic, replay safe and preserves its lost response', async () => {
  const db = new FakeFirestore({
    [walletPath()]: { coins: 27, lastSynced: 'old' },
  });
  const claim = createClaimWalletHandler({
    db,
    now: () => new Date('2026-11-02T08:00:00.000Z'),
  });

  const first = await claim({ requestId: 'claim-request-0001' }, context());
  assert.match(first.claimId, /^wc_[a-f0-9]{64}$/);
  assert.equal(first.coins, 27);
  assert.equal(db.read(walletPath()).coins, 0);
  assert.equal(db.read(walletPath()).lastClaimId, first.claimId);

  const replay = await claim({ requestId: 'claim-request-0001' }, context());
  assert.deepEqual(replay, first);
  assert.equal(db.read(walletPath()).coins, 0);
  assert.equal(db.read(walletPath()).lastClaimId, first.claimId);
});

test('concurrent wallet claims with one request id return one durable result', async () => {
  const db = new FakeFirestore({
    [walletPath()]: { coins: 9 },
  });
  const claim = createClaimWalletHandler({ db });

  const [left, right] = await Promise.all([
    claim({ requestId: 'claim-concurrent-0001' }, context()),
    claim({ requestId: 'claim-concurrent-0001' }, context()),
  ]);

  assert.deepEqual(left, right);
  assert.equal(left.coins, 9);
  assert.equal(db.read(walletPath()).coins, 0);
});

test('wallet claims are scoped to the authenticated owner and require a stable id', async () => {
  const db = new FakeFirestore({
    [walletPath('player-2')]: { coins: 14 },
  });
  const claim = createClaimWalletHandler({ db });

  await assert.rejects(claim({ requestId: 'claim-no-auth-0001' }, {}), (error) => error.code === 'unauthenticated');
  await assert.rejects(claim({}, context('player-2')), (error) => error.code === 'invalid-argument');
  const playerTwo = await claim({ requestId: 'shared-request-0001' }, context('player-2'));
  const playerOne = await claim({ requestId: 'shared-request-0001' }, context('player-1'));

  assert.equal(playerTwo.coins, 14);
  assert.equal(playerOne.coins, 0);
  assert.notEqual(playerOne.claimId, playerTwo.claimId);
  assert.equal(db.read(walletPath('player-2')).coins, 0);
  assert.equal(db.read(walletPath('player-1')).coins, 0);
});

test('redemption uses the server catalogue price instead of a forged client price', async () => {
  const db = new FakeFirestore({
    [walletPath()]: { coins: 500 },
  });
  const redeem = createRedeemCoinsHandler({
    db,
    now: () => new Date('2026-11-02T09:00:00.000Z'),
  });

  const result = await redeem({
    rewardId: 'theme_dark',
    coinsRequired: 1,
    price: 1,
    requestId: 'redeem-request-0001',
  }, context());

  assert.equal(result.newBalance, 300);
  assert.equal(result.coinsSpent, 200);
  assert.equal(db.read(walletPath()).coins, 300);
  const receipt = db.read(`redemptions/${result.redemptionId}`);
  assert.equal(receipt.coinsSpent, 200);
  assert.equal(receipt.userId, 'player-1');
});

test('redemption replay after a lost response does not debit twice', async () => {
  const db = new FakeFirestore({
    [walletPath()]: { coins: 400 },
  });
  const redeem = createRedeemCoinsHandler({ db });

  const first = await redeem({ rewardId: 'theme_ocean', requestId: 'redeem-replay-0001' }, context());
  const replay = await redeem({ rewardId: 'theme_ocean', requestId: 'redeem-replay-0001' }, context());

  assert.deepEqual(replay, first);
  assert.equal(db.read(walletPath()).coins, 100);
});

test('unknown, cash-like and gift-card rewards fail before any debit', async () => {
  const db = new FakeFirestore({
    [walletPath()]: { coins: 10000 },
  });
  const redeem = createRedeemCoinsHandler({ db });

  for (const rewardId of ['unknown_reward', 'cash_10_eur', 'giftcard_amazon_10', 'payout_paypal']) {
    await assert.rejects(
      redeem({ rewardId, coinsRequired: 1, requestId: `blocked-${rewardId}` }, context()),
      (error) => error.code === 'failed-precondition' && error.details.reason === 'reward-unavailable',
    );
  }

  assert.equal(db.read(walletPath()).coins, 10000);
  assert.equal(db.paths().filter((path) => path.startsWith('redemptions/')).length, 0);
});

test('insufficient funds and request-id reuse fail without changing the wallet', async () => {
  const db = new FakeFirestore({
    [walletPath()]: { coins: 199 },
  });
  const redeem = createRedeemCoinsHandler({ db });

  await assert.rejects(
    redeem({ rewardId: 'theme_dark', requestId: 'redeem-no-funds-0001' }, context()),
    (error) => error.code === 'failed-precondition',
  );
  assert.equal(db.read(walletPath()).coins, 199);

  db.write(walletPath(), { coins: 1000 });
  await redeem({ rewardId: 'theme_dark', requestId: 'redeem-reused-0001' }, context());
  const afterFirst = db.read(walletPath()).coins;
  await assert.rejects(
    redeem({ rewardId: 'theme_ocean', requestId: 'redeem-reused-0001' }, context()),
    (error) => error.code === 'invalid-argument',
  );
  assert.equal(db.read(walletPath()).coins, afterFirst);
});

test('wallet reads fail closed on a corrupt balance', async () => {
  const db = new FakeFirestore({
    [walletPath()]: { coins: -1 },
  });
  const read = createGetUserCoinsHandler({ db });
  const claim = createClaimWalletHandler({ db });

  await assert.rejects(read({}, context()), (error) => error.code === 'failed-precondition');
  await assert.rejects(
    claim({ requestId: 'claim-corrupt-0001' }, context()),
    (error) => error.code === 'failed-precondition',
  );
  assert.equal(db.read(walletPath()).coins, -1);
});
