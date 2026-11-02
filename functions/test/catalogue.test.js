'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  REWARDS,
  getPurchasableReward,
  isPurchasableReward,
  isUnfulfillableCategory,
  isVirtualCategory,
} = require('../lib/catalogue');

test('catalogue exposes only positive-priced virtual rewards', () => {
  for (const [rewardId, reward] of Object.entries(REWARDS)) {
    assert.equal(isVirtualCategory(reward.category), true, rewardId);
    assert.equal(isUnfulfillableCategory(reward.category), false, rewardId);
    assert.equal(isPurchasableReward(reward), true, rewardId);
    assert.deepEqual(getPurchasableReward(rewardId), {
      id: rewardId,
      price: reward.price,
      category: reward.category,
    });
  }

  assert.equal(isPurchasableReward({ price: 100, category: 'cash' }), false);
  assert.equal(isPurchasableReward({ price: 100, category: 'giftcard' }), false);
  assert.equal(isPurchasableReward({ price: 0, category: 'theme' }), false);
  assert.equal(isPurchasableReward({ price: 1.5, category: 'theme' }), false);
  assert.equal(getPurchasableReward('unknown_reward'), null);
});
