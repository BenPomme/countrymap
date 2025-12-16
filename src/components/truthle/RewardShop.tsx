'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ALL_REWARDS,
  BADGES,
  THEMES,
  POWERUPS,
  PROFILE_ITEMS,
  getRewardById,
  RARITY_COLORS,
  RARITY_LABELS,
  VirtualReward,
  RewardCategory
} from '@/lib/truthle/rewards'
import {
  ALL_ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  RARITY_CONFIG,
  AchievementRarity,
  Achievement
} from '@/lib/truthle/achievements'
import {
  getCoins,
  getLocalState,
  purchaseReward,
  equipItem,
  getEquippedItems,
  addPowerup,
  ownsItem,
  syncCloudCoins
} from '@/lib/truthle/storage'
import OfferWall from './OfferWall'

// Check if Offertoro is configured
const OFFERTORO_ENABLED = !!process.env.NEXT_PUBLIC_OFFERTORO_PUBID

type TabType = 'earn' | 'all' | 'badges' | 'themes' | 'powerups' | 'profile' | 'achievements'

export default function RewardShop() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [coins, setCoins] = useState(0)
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [achievementCategory, setAchievementCategory] = useState<string | 'all'>('all')
  const [achievementRarity, setAchievementRarity] = useState<AchievementRarity | 'all'>('all')
  const [achievementSearch, setAchievementSearch] = useState('')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  const [equippedItems, setEquippedItems] = useState<ReturnType<typeof getEquippedItems>>({
    theme: null,
    badge: null,
    frame: null,
    title: null,
  })
  const [purchaseMessage, setPurchaseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load state on mount and sync cloud coins
  useEffect(() => {
    async function loadState() {
      const state = getLocalState()
      setCoins(state.coins)
      setOwnedItems(state.ownedItems)
      setUnlockedAchievements(state.unlockedAchievements || [])
      setEquippedItems(getEquippedItems())

      // Sync coins from cloud (offer wall earnings)
      try {
        const cloudCoins = await syncCloudCoins()
        if (cloudCoins > 0) {
          setCoins(getCoins()) // Refresh after sync
        }
      } catch (e) {
        console.error('Failed to sync cloud coins:', e)
      }
    }
    loadState()
  }, [])

  // Filter achievements based on search/filters
  const filteredAchievements = useMemo(() => {
    let filtered = ALL_ACHIEVEMENTS

    // Category filter
    if (achievementCategory !== 'all') {
      filtered = filtered.filter(a => a.category === achievementCategory)
    }

    // Rarity filter
    if (achievementRarity !== 'all') {
      filtered = filtered.filter(a => a.rarity === achievementRarity)
    }

    // Search filter
    if (achievementSearch) {
      const search = achievementSearch.toLowerCase()
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(search) ||
        a.description.toLowerCase().includes(search)
      )
    }

    // Unlocked only filter
    if (showUnlockedOnly) {
      filtered = filtered.filter(a => unlockedAchievements.includes(a.id))
    }

    return filtered
  }, [achievementCategory, achievementRarity, achievementSearch, showUnlockedOnly, unlockedAchievements])

  // Achievement stats
  const achievementStats = useMemo(() => {
    const total = ALL_ACHIEVEMENTS.length
    const unlocked = unlockedAchievements.length
    const byRarity = {
      common: ALL_ACHIEVEMENTS.filter(a => a.rarity === 'common').length,
      uncommon: ALL_ACHIEVEMENTS.filter(a => a.rarity === 'uncommon').length,
      rare: ALL_ACHIEVEMENTS.filter(a => a.rarity === 'rare').length,
      epic: ALL_ACHIEVEMENTS.filter(a => a.rarity === 'epic').length,
      legendary: ALL_ACHIEVEMENTS.filter(a => a.rarity === 'legendary').length,
      mythic: ALL_ACHIEVEMENTS.filter(a => a.rarity === 'mythic').length,
    }
    const unlockedByRarity = {
      common: unlockedAchievements.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.rarity === 'common').length,
      uncommon: unlockedAchievements.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.rarity === 'uncommon').length,
      rare: unlockedAchievements.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.rarity === 'rare').length,
      epic: unlockedAchievements.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.rarity === 'epic').length,
      legendary: unlockedAchievements.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.rarity === 'legendary').length,
      mythic: unlockedAchievements.filter(id => ALL_ACHIEVEMENTS.find(a => a.id === id)?.rarity === 'mythic').length,
    }
    return { total, unlocked, byRarity, unlockedByRarity }
  }, [unlockedAchievements])

  // Clear message after 3 seconds
  useEffect(() => {
    if (purchaseMessage) {
      const timer = setTimeout(() => setPurchaseMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [purchaseMessage])

  const getRewardsForTab = (): VirtualReward[] => {
    switch (activeTab) {
      case 'badges': return BADGES.filter(r => r.price > 0 && !r.unlockCondition)
      case 'themes': return THEMES
      case 'powerups': return POWERUPS
      case 'profile': return PROFILE_ITEMS
      default: return ALL_REWARDS.filter(r => r.price > 0 && !r.unlockCondition)
    }
  }

  const handlePurchase = (reward: VirtualReward) => {
    const result = purchaseReward(reward.id, reward.price)

    if (result.success) {
      // Update local state
      setCoins(getCoins())
      setOwnedItems([...ownedItems, reward.id])

      // Add powerups to inventory
      if (reward.category === 'powerup') {
        switch (reward.id) {
          case 'powerup_streak_freeze':
            addPowerup('streakFreeze', 1)
            break
          case 'powerup_hint':
            addPowerup('hint', 3)
            break
          case 'powerup_fifty_fifty':
            addPowerup('fiftyFifty', 3)
            break
          case 'powerup_time_extend':
            addPowerup('timeExtender', 5)
            break
          case 'powerup_double_coins':
            addPowerup('doubleCoins', 1)
            break
        }
      }

      setPurchaseMessage({ type: 'success', text: `Purchased ${reward.name}!` })
    } else {
      setPurchaseMessage({ type: 'error', text: result.error || 'Purchase failed' })
    }
  }

  const handleEquip = (reward: VirtualReward) => {
    let slot: 'theme' | 'badge' | 'frame' | 'title' | null = null

    if (reward.id.startsWith('theme_')) slot = 'theme'
    else if (reward.id.startsWith('badge_')) slot = 'badge'
    else if (reward.id.startsWith('profile_frame_')) slot = 'frame'
    else if (reward.id.startsWith('profile_title_')) slot = 'title'

    if (slot) {
      const currentlyEquipped = equippedItems[slot]
      const newValue = currentlyEquipped === reward.id ? '' : reward.id

      equipItem(newValue, slot)
      setEquippedItems(getEquippedItems())
      setPurchaseMessage({
        type: 'success',
        text: newValue ? `Equipped ${reward.name}!` : `Unequipped ${reward.name}`
      })
    }
  }

  const isEquipped = (reward: VirtualReward): boolean => {
    if (reward.id.startsWith('theme_')) return equippedItems.theme === reward.id
    if (reward.id.startsWith('badge_')) return equippedItems.badge === reward.id
    if (reward.id.startsWith('profile_frame_')) return equippedItems.frame === reward.id
    if (reward.id.startsWith('profile_title_')) return equippedItems.title === reward.id
    return false
  }

  const tabs: { id: TabType; label: string; icon: string; badge?: string }[] = [
    // Only show Earn tab when Offertoro is configured
    ...(OFFERTORO_ENABLED ? [{ id: 'earn' as TabType, label: 'Earn Coins', icon: '🎁' }] : []),
    { id: 'all', label: 'Shop', icon: '🛒' },
    { id: 'achievements', label: 'Achievements', icon: '🏆', badge: `${achievementStats.unlocked}/${achievementStats.total}` },
    { id: 'badges', label: 'Badges', icon: '🏅' },
    { id: 'themes', label: 'Themes', icon: '🎨' },
    { id: 'powerups', label: 'Powerups', icon: '⚡' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ]

  const rewards = getRewardsForTab()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards Shop</h1>
          <p className="text-gray-600">Spend your Truthle Coins on virtual rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 px-4 py-2 rounded-full flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <span className="text-xl font-bold text-amber-700">{coins.toLocaleString()}</span>
          </div>
          <Link
            href="/truthle"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>
      </div>

      {/* Purchase message */}
      {purchaseMessage && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          purchaseMessage.type === 'success'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {purchaseMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Earn Coins Tab - Offer Wall (only when Offertoro configured) */}
      {OFFERTORO_ENABLED && activeTab === 'earn' && (
        <div className="mb-8">
          <OfferWall />
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Achievement Stats Overview */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Achievement Progress</h2>
                <p className="text-purple-200">Unlock achievements by playing Truthle</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{achievementStats.unlocked}</div>
                <div className="text-purple-200">of {achievementStats.total}</div>
              </div>
            </div>
            <div className="w-full bg-purple-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all"
                style={{ width: `${(achievementStats.unlocked / achievementStats.total) * 100}%` }}
              />
            </div>

            {/* Rarity breakdown */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
              {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                <div key={rarity} className="text-center p-2 bg-white/10 rounded-lg">
                  <div className="text-lg font-bold">
                    {achievementStats.unlockedByRarity[rarity as AchievementRarity]}/{achievementStats.byRarity[rarity as AchievementRarity]}
                  </div>
                  <div className={`text-xs ${config.color}`}>{config.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={achievementSearch}
                  onChange={(e) => setAchievementSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Category filter */}
              <select
                value={achievementCategory}
                onChange={(e) => setAchievementCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                {ACHIEVEMENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              {/* Rarity filter */}
              <select
                value={achievementRarity}
                onChange={(e) => setAchievementRarity(e.target.value as AchievementRarity | 'all')}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Rarities</option>
                {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                  <option key={rarity} value={rarity}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnlockedOnly}
                  onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-600">Show unlocked only</span>
              </label>
              <span className="text-sm text-gray-500">
                Showing {filteredAchievements.length} achievements
              </span>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.slice(0, 50).map(achievement => {
              const isUnlocked = unlockedAchievements.includes(achievement.id)
              const rarityConfig = RARITY_CONFIG[achievement.rarity]
              const category = ACHIEVEMENT_CATEGORIES.find(c => c.id === achievement.category)

              return (
                <div
                  key={achievement.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    isUnlocked
                      ? `${rarityConfig.bgColor} border-current`
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${rarityConfig.bgColor} ${rarityConfig.color}`}>
                        {rarityConfig.label}
                      </span>
                      <span className="text-xs text-gray-500">{category?.icon}</span>
                    </div>
                  </div>
                  <h3 className={`font-semibold mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-sm mb-3 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {isUnlocked ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">🔒 Locked</span>
                    )}
                    <span className="text-sm font-medium text-amber-600">
                      +{achievement.coinReward} 🪙
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredAchievements.length > 50 && (
            <div className="text-center text-gray-500 py-4">
              Showing 50 of {filteredAchievements.length} achievements. Use filters to narrow down.
            </div>
          )}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No achievements found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      )}

      {/* Rewards grid */}
      {activeTab !== 'earn' && activeTab !== 'achievements' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(reward => {
          const owned = ownedItems.includes(reward.id)
          const canAfford = coins >= reward.price
          const equipped = isEquipped(reward)
          const canEquip = reward.category !== 'powerup'

          return (
            <div
              key={reward.id}
              className={`bg-white rounded-xl border-2 p-4 transition-all ${
                owned ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Icon and rarity */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{reward.icon}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${RARITY_COLORS[reward.rarity]}`}>
                  {RARITY_LABELS[reward.rarity]}
                </span>
              </div>

              {/* Name and description */}
              <h3 className="font-semibold text-gray-900 mb-1">{reward.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

              {/* Price and actions */}
              <div className="flex items-center justify-between">
                {owned ? (
                  <>
                    <span className="text-emerald-600 font-medium">✓ Owned</span>
                    {canEquip && (
                      <button
                        onClick={() => handleEquip(reward)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          equipped
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {equipped ? 'Equipped' : 'Equip'}
                      </button>
                    )}
                    {!canEquip && (
                      <span className="text-sm text-gray-500">Consumable</span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">🪙</span>
                      <span className={`font-bold ${canAfford ? 'text-gray-900' : 'text-red-500'}`}>
                        {reward.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePurchase(reward)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Buy
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      )}

      {activeTab !== 'earn' && activeTab !== 'achievements' && rewards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No rewards available in this category
        </div>
      )}

      {/* Achievement badges section */}
      {(activeTab === 'badges' || activeTab === 'all') && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Achievement Badges</h2>
          <p className="text-gray-600 mb-6">These badges are unlocked through gameplay achievements, not purchased.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGES.filter(b => b.unlockCondition).map(badge => {
              const owned = ownedItems.includes(badge.id)

              return (
                <div
                  key={badge.id}
                  className={`bg-white rounded-xl border-2 p-4 ${
                    owned ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-4xl ${owned ? '' : 'grayscale'}`}>{badge.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${RARITY_COLORS[badge.rarity]}`}>
                      {RARITY_LABELS[badge.rarity]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{badge.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                  {owned ? (
                    <span className="text-emerald-600 font-medium">✓ Unlocked</span>
                  ) : (
                    <span className="text-gray-400 text-sm">🔒 Locked</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* How to earn coins */}
      <div className="mt-12 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-amber-800 mb-4">💡 How to Earn Coins</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">🎮</span>
            <div>
              <p className="font-medium text-amber-900">Daily Play</p>
              <p className="text-amber-700">+10 coins just for playing</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">✅</span>
            <div>
              <p className="font-medium text-amber-900">Correct Answers</p>
              <p className="text-amber-700">+5 coins per correct answer</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">⚡</span>
            <div>
              <p className="font-medium text-amber-900">Speed Bonus</p>
              <p className="text-amber-700">+2 coins per fast answer (&lt;3s)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">💯</span>
            <div>
              <p className="font-medium text-amber-900">Perfect Score</p>
              <p className="text-amber-700">+50 coins for 10/10</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔥</span>
            <div>
              <p className="font-medium text-amber-900">Streak Milestones</p>
              <p className="text-amber-700">+25 to +2000 coins at milestones</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🎁</span>
            <div>
              <p className="font-medium text-amber-900">Welcome Bonus</p>
              <p className="text-amber-700">+100 coins for first game</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
