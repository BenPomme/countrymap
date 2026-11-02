'use strict';

// Server-owned prices. These must stay aligned with src/lib/truthle/rewards.ts for
// purchasable virtual items. Unknown ids and non-virtual categories fail closed.
const REWARDS = Object.freeze({
  badge_globe_trotter: { price: 100, category: 'badge' },
  badge_data_nerd: { price: 150, category: 'badge' },
  badge_truth_seeker: { price: 250, category: 'badge' },
  badge_world_champion: { price: 1000, category: 'badge' },
  badge_legendary: { price: 5000, category: 'badge' },
  theme_dark: { price: 200, category: 'theme' },
  theme_ocean: { price: 300, category: 'theme' },
  theme_sunset: { price: 300, category: 'theme' },
  theme_forest: { price: 300, category: 'theme' },
  theme_neon: { price: 500, category: 'theme' },
  theme_gold: { price: 1500, category: 'theme' },
  theme_rainbow: { price: 750, category: 'theme' },
  powerup_streak_freeze: { price: 150, category: 'powerup' },
  powerup_hint: { price: 100, category: 'powerup' },
  powerup_fifty_fifty: { price: 200, category: 'powerup' },
  powerup_time_extend: { price: 75, category: 'powerup' },
  powerup_double_coins: { price: 250, category: 'powerup' },
  profile_frame_bronze: { price: 100, category: 'profile' },
  profile_frame_silver: { price: 300, category: 'profile' },
  profile_frame_gold: { price: 750, category: 'profile' },
  profile_title_expert: { price: 200, category: 'profile' },
  profile_title_master: { price: 500, category: 'profile' },
  profile_title_legend: { price: 2000, category: 'profile' },
});

const VIRTUAL_CATEGORIES = new Set(['badge', 'theme', 'powerup', 'profile']);
const UNFULFILLABLE_CATEGORIES = new Set(['cash', 'giftcard', 'gift_card', 'payout', 'physical', 'voucher']);

function getPurchasableReward(rewardId) {
  if (typeof rewardId !== 'string' || rewardId.length < 1 || rewardId.length > 80) return null;
  const reward = REWARDS[rewardId];
  if (!reward || !isPurchasableReward(reward)) return null;
  return { id: rewardId, price: reward.price, category: reward.category };
}

function isPurchasableReward(reward) {
  return Boolean(reward)
    && Number.isSafeInteger(reward.price)
    && reward.price > 0
    && isVirtualCategory(reward.category)
    && !isUnfulfillableCategory(reward.category);
}

function isVirtualCategory(category) {
  return VIRTUAL_CATEGORIES.has(category);
}

function isUnfulfillableCategory(category) {
  return UNFULFILLABLE_CATEGORIES.has(category);
}

module.exports = {
  REWARDS,
  VIRTUAL_CATEGORIES,
  UNFULFILLABLE_CATEGORIES,
  getPurchasableReward,
  isPurchasableReward,
  isVirtualCategory,
  isUnfulfillableCategory,
};
