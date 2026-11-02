'use strict';

const crypto = require('crypto');
const { getPurchasableReward } = require('./catalogue');
const {
  CommerceError,
  requireAuth,
  requireRequestId,
  requireString,
  readStoredCoins,
  sha256,
  snapshotData,
} = require('./util');

function optionalRequestId(data) {
  if (!data || data.requestId === undefined || data.requestId === null || data.requestId === '') return null;
  return requireRequestId(data.requestId);
}

function createGetUserCoinsHandler(options) {
  const { db } = options;

  return async function getUserCoins(data, context) {
    const uid = requireAuth(context);
    const walletSnap = await db.collection('users').doc(uid).collection('wallet').doc('balance').get();
    const wallet = snapshotData(walletSnap) || {};
    return { coins: readStoredCoins(wallet.coins) };
  };
}

function createClaimWalletHandler(options) {
  const { db, now = () => new Date() } = options;

  return async function claimTruthleWallet(data, context) {
    const uid = requireAuth(context);
    const requestId = requireRequestId(data && data.requestId);
    const requestIdHash = sha256(`${uid}\0${requestId}`);
    const claimId = `wc_${requestIdHash}`;
    const receiptRef = db.collection('wallet_claim_receipts').doc(claimId);
    const walletRef = db.collection('users').doc(uid).collection('wallet').doc('balance');
    const nowDate = now();

    return db.runTransaction(async (transaction) => {
      const receiptSnap = await transaction.get(receiptRef);
      const receipt = snapshotData(receiptSnap);
      if (receipt) {
        if (receipt.uid !== uid || receipt.status !== 'claimed') {
          throw new CommerceError('failed-precondition', 'Wallet claim receipt is unavailable', 409);
        }
        return { claimId, coins: readStoredCoins(receipt.coins, 'claim coins') };
      }

      const walletSnap = await transaction.get(walletRef);
      const wallet = snapshotData(walletSnap) || {};
      const coins = readStoredCoins(wallet.coins);
      transaction.set(receiptRef, {
        uid,
        requestIdHash,
        claimId,
        coins,
        status: 'claimed',
        claimedAt: nowDate,
      });
      transaction.set(walletRef, {
        coins: 0,
        lastClaimId: claimId,
        lastSynced: nowDate,
        updatedAt: nowDate,
      }, { merge: true });
      return { claimId, coins };
    });
  };
}

function createRedeemCoinsHandler(options) {
  const { db, now = () => new Date(), makeId = () => crypto.randomBytes(16).toString('hex') } = options;

  return async function redeemCoins(data, context) {
    const uid = requireAuth(context);
    const rewardId = requireString(data && data.rewardId, 'rewardId', { min: 1, max: 80 });
    const requestId = optionalRequestId(data);
    const reward = getPurchasableReward(rewardId);
    if (!reward) {
      throw new CommerceError('failed-precondition', 'Reward is unavailable', 412, { reason: 'reward-unavailable' });
    }

    const requestIdHash = requestId ? sha256(`${uid}\0${requestId}`) : null;
    const redemptionId = requestId ? `rd_${requestIdHash}` : `rd_${makeId()}`;
    const redemptionRef = db.collection('redemptions').doc(redemptionId);
    const walletRef = db.collection('users').doc(uid).collection('wallet').doc('balance');
    const nowDate = now();

    return db.runTransaction(async (transaction) => {
      const redemptionSnap = await transaction.get(redemptionRef);
      const existing = snapshotData(redemptionSnap);
      if (existing) {
        if (existing.userId !== uid || existing.rewardId !== reward.id || existing.requestIdHash !== requestIdHash) {
          throw new CommerceError('invalid-argument', 'requestId was reused for another redemption', 409);
        }
        return {
          success: true,
          newBalance: readStoredCoins(existing.balanceAfter, 'redemption balance'),
          redemptionId,
          rewardId: reward.id,
          coinsSpent: readStoredCoins(existing.coinsSpent, 'redemption price'),
          status: existing.status,
        };
      }

      const walletSnap = await transaction.get(walletRef);
      const wallet = snapshotData(walletSnap) || {};
      const currentBalance = readStoredCoins(wallet.coins);
      if (currentBalance < reward.price) {
        throw new CommerceError('failed-precondition', 'Insufficient coins', 412);
      }
      const newBalance = currentBalance - reward.price;
      transaction.set(walletRef, {
        coins: newBalance,
        lastUpdated: nowDate,
        updatedAt: nowDate,
      }, { merge: true });
      transaction.set(redemptionRef, {
        userId: uid,
        rewardId: reward.id,
        category: reward.category,
        coinsSpent: reward.price,
        balanceAfter: newBalance,
        requestIdHash,
        status: 'redeemed',
        timestamp: nowDate,
        createdAt: nowDate,
      });
      return {
        success: true,
        newBalance,
        redemptionId,
        rewardId: reward.id,
        coinsSpent: reward.price,
        status: 'redeemed',
      };
    });
  };
}

module.exports = {
  createGetUserCoinsHandler,
  createClaimWalletHandler,
  createRedeemCoinsHandler,
};
