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
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

// Check if Offertoro is configured
const OFFERTORO_ENABLED = !!process.env.NEXT_PUBLIC_OFFERTORO_PUBID

type TabType = 'earn' | 'all' | 'badges' | 'themes' | 'powerups' | 'profile' | 'achievements'

const REWARD_RARITY_STYLES: Record<VirtualReward['rarity'], string> = {
  common: 'bg-twt-ink/10 text-twt-ink',
  rare: 'bg-twt-blue/10 text-twt-blue',
  epic: 'bg-twt-coral/15 text-twt-coral',
  legendary: 'bg-twt-butter text-twt-ink',
}

const ACHIEVEMENT_RARITY_STYLES: Record<AchievementRarity, string> = {
  common: 'border-twt-ink/20 bg-twt-ink/5 text-twt-ink',
  uncommon: 'border-twt-green/30 bg-twt-green/10 text-twt-green',
  rare: 'border-twt-blue/30 bg-twt-blue/10 text-twt-blue',
  epic: 'border-twt-coral/30 bg-twt-coral/10 text-twt-coral',
  legendary: 'border-twt-butter bg-twt-butter/35 text-twt-ink',
  mythic: 'border-twt-ink bg-twt-ink text-white',
}

export default function RewardShop() {
  const embeddedMode = useEmbeddedAppMode()
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
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  // Load state on mount and sync cloud coins
  useEffect(() => {
    let cancelled = false
    setLoadStatus('loading')
    setLoadError(null)

    async function loadState() {
      try {
        const state = getLocalState()
        if (cancelled) return

        setCoins(state.coins)
        setOwnedItems(state.ownedItems)
        setUnlockedAchievements(state.unlockedAchievements || [])
        setEquippedItems(getEquippedItems())

        // Sync coins from cloud (offer wall earnings)
        const cloudCoins = await syncCloudCoins()
        if (cancelled) return

        if (cloudCoins > 0) {
          setCoins(getCoins()) // Refresh after sync
        }
        setLoadStatus('ready')
      } catch {
        if (cancelled) return
        console.error('Failed to load reward shop state')
        setLoadError('Your saved coins and rewards could not be loaded. No purchase was made.')
        setLoadStatus('error')
      }
    }

    loadState()

    return () => {
      cancelled = true
    }
  }, [loadAttempt])

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
    ...(!embeddedMode && OFFERTORO_ENABLED ? [{ id: 'earn' as TabType, label: 'Earn Coins', icon: '🎁' }] : []),
    { id: 'all', label: 'Shop', icon: '🛒' },
    { id: 'achievements', label: 'Achievements', icon: '🏆', badge: `${achievementStats.unlocked}/${achievementStats.total}` },
    { id: 'badges', label: 'Badges', icon: '🏅' },
    { id: 'themes', label: 'Themes', icon: '🎨' },
    { id: 'powerups', label: 'Powerups', icon: '⚡' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ]

  const rewards = getRewardsForTab()

  if (loadStatus === 'loading') {
    return (
      <div className="twt-container py-10 sm:py-14">
        <div className="twt-panel mx-auto max-w-2xl p-6 sm:p-8" role="status" aria-live="polite" aria-busy="true">
          <p className="twt-kicker">Rewards shop</p>
          <h1 className="twt-display mt-2 text-3xl sm:text-4xl">Loading your coins and saved rewards</h1>
          <p className="twt-prose mt-3">
            Checking this device, then your linked account balance. Purchases remain disabled until loading finishes.
          </p>
        </div>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="twt-container py-10 sm:py-14">
        <div className="twt-panel mx-auto max-w-2xl border-twt-coral p-6 sm:p-8" role="alert">
          <p className="twt-kicker !text-twt-coral">Rewards shop unavailable</p>
          <h1 className="twt-display mt-2 text-3xl sm:text-4xl">We could not load your rewards</h1>
          <p className="twt-prose mt-3">{loadError}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="twt-button" onClick={() => setLoadAttempt(attempt => attempt + 1)}>
              Try again
            </button>
            <Link href="/truthle/" className="twt-button-secondary">
              Back to Truthle
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`twt-container ${embeddedMode ? 'py-5' : 'py-8 sm:py-10'}`}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="twt-kicker">Truthle rewards</p>
          <h1 className="twt-display mt-2 text-4xl sm:text-5xl">Rewards shop</h1>
          <p className="twt-prose mt-3">Spend your Truthle Coins on virtual rewards.</p>
        </div>
        <div
          className="flex w-fit items-center gap-2 rounded-full border-2 border-twt-ink bg-twt-butter px-4 py-2 shadow-[3px_3px_0_#192947]"
          aria-live="polite"
          aria-label={`${coins.toLocaleString()} Truthle Coins`}
        >
          <span className="text-xl" aria-hidden="true">🪙</span>
          <span className="text-xl font-extrabold text-twt-ink">{coins.toLocaleString()}</span>
          <span className="text-sm font-bold text-twt-ink/70">coins</span>
        </div>
      </div>

      <div className="twt-panel mb-6 bg-twt-butter/35 p-4 sm:p-5">
        <h2 className="font-extrabold text-twt-ink">Virtual rewards only</h2>
        <p className="mt-2 text-sm leading-6 text-twt-ink/75">
          Truthle Coins are game credits with no cash value. Rewards are virtual items saved on this device.
        </p>
        <p className="mt-1 text-sm leading-6 text-twt-ink/75">
          No cash, gift card, or physical reward delivery is available.
        </p>
      </div>

      {/* Purchase message */}
      {purchaseMessage && (
        <div role={purchaseMessage.type === 'error' ? 'alert' : 'status'} className={`mb-6 rounded-xl border-2 px-4 py-3 font-semibold ${
          purchaseMessage.type === 'success'
            ? 'border-twt-green/30 bg-twt-green/10 text-twt-green'
            : 'border-twt-coral/30 bg-twt-coral/10 text-twt-coral'
        }`}>
          {purchaseMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Reward shop sections">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border-2 border-twt-ink px-4 py-2 text-sm font-extrabold transition-colors ${
              activeTab === tab.id
                ? 'bg-twt-blue text-white'
                : 'bg-white text-twt-ink hover:bg-twt-butter'
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-twt-ink/10 text-twt-ink'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Earn Coins Tab - Offer Wall (only when Offertoro configured) */}
      {!embeddedMode && OFFERTORO_ENABLED && activeTab === 'earn' && (
        <div className="mb-8">
          <OfferWall />
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Achievement Stats Overview */}
          <div className="twt-panel bg-twt-ink p-6 text-white">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="twt-kicker !text-twt-butter">Achievements</p>
                <h2 className="twt-display mt-1 text-2xl sm:text-3xl">Achievement progress</h2>
                <p className="mt-2 text-white/70">Unlock achievements by playing Truthle.</p>
              </div>
              <div className="text-right">
                <div className="twt-display text-4xl">{achievementStats.unlocked}</div>
                <div className="text-white/70">of {achievementStats.total}</div>
              </div>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-label="Achievements unlocked"
              aria-valuemin={0}
              aria-valuemax={achievementStats.total}
              aria-valuenow={achievementStats.unlocked}
            >
              <div
                className="h-3 rounded-full bg-twt-butter transition-all"
                style={{ width: `${(achievementStats.unlocked / achievementStats.total) * 100}%` }}
              />
            </div>

            {/* Rarity breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                <div key={rarity} className="rounded-xl bg-white/10 p-2 text-center">
                  <div className="text-lg font-extrabold">
                    {achievementStats.unlockedByRarity[rarity as AchievementRarity]}/{achievementStats.byRarity[rarity as AchievementRarity]}
                  </div>
                  <div className="text-xs text-white/70">{config.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="twt-panel space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              {/* Search */}
              <div className="flex-1">
                <label htmlFor="achievement-search" className="mb-1 block text-sm font-bold text-twt-ink">Search achievements</label>
                <input
                  id="achievement-search"
                  type="text"
                  placeholder="Search achievements..."
                  value={achievementSearch}
                  onChange={(e) => setAchievementSearch(e.target.value)}
                  className="w-full rounded-xl border-2 border-twt-ink/25 bg-white px-4 py-2 text-twt-ink placeholder:text-twt-ink/45 focus:border-twt-blue focus:outline-none focus:ring-2 focus:ring-twt-blue/30"
                />
              </div>

              {/* Category filter */}
              <div>
                <label htmlFor="achievement-category" className="mb-1 block text-sm font-bold text-twt-ink">Category</label>
                <select
                  id="achievement-category"
                  value={achievementCategory}
                  onChange={(e) => setAchievementCategory(e.target.value)}
                  className="w-full rounded-xl border-2 border-twt-ink/25 bg-white px-3 py-2 text-twt-ink focus:border-twt-blue focus:outline-none focus:ring-2 focus:ring-twt-blue/30"
                >
                  <option value="all">All Categories</option>
                  {ACHIEVEMENT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rarity filter */}
              <div>
                <label htmlFor="achievement-rarity" className="mb-1 block text-sm font-bold text-twt-ink">Rarity</label>
                <select
                  id="achievement-rarity"
                  value={achievementRarity}
                  onChange={(e) => setAchievementRarity(e.target.value as AchievementRarity | 'all')}
                  className="w-full rounded-xl border-2 border-twt-ink/25 bg-white px-3 py-2 text-twt-ink focus:border-twt-blue focus:outline-none focus:ring-2 focus:ring-twt-blue/30"
                >
                  <option value="all">All Rarities</option>
                  {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                    <option key={rarity} value={rarity}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnlockedOnly}
                  onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                  className="h-4 w-4 rounded accent-twt-blue"
                />
                <span className="text-sm font-semibold text-twt-ink/75">Show unlocked only</span>
              </label>
              <span className="text-sm text-twt-ink/60">
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
                  className={`rounded-2xl border-2 p-4 transition-all ${
                    isUnlocked
                      ? ACHIEVEMENT_RARITY_STYLES[achievement.rarity]
                      : 'border-twt-ink/20 bg-twt-paper'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ACHIEVEMENT_RARITY_STYLES[achievement.rarity]}`}>
                        {rarityConfig.label}
                      </span>
                      <span className="text-xs text-twt-ink/55" aria-hidden="true">{category?.icon}</span>
                    </div>
                  </div>
                  <h3 className={`mb-1 font-bold ${isUnlocked ? 'text-twt-ink' : 'text-twt-ink/70'}`}>
                    {achievement.name}
                  </h3>
                  <p className={`mb-3 text-sm leading-6 ${isUnlocked ? 'text-twt-ink/70' : 'text-twt-ink/60'}`}>
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {isUnlocked ? (
                      <span className="flex items-center gap-1 font-semibold text-twt-green">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-twt-ink/60">🔒 Locked</span>
                    )}
                    <span className="text-sm font-bold text-twt-ink">
                      +{achievement.coinReward} 🪙
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredAchievements.length > 50 && (
            <div className="py-4 text-center text-sm text-twt-ink/60">
              Showing 50 of {filteredAchievements.length} achievements. Use filters to narrow down.
            </div>
          )}

          {filteredAchievements.length === 0 && (
            <div className="twt-panel bg-twt-paper px-5 py-12 text-center">
              <div className="mb-4 text-6xl" aria-hidden="true">🔍</div>
              <h3 className="twt-display mb-2 text-2xl">No achievements found</h3>
              <p className="text-twt-ink/65">Try adjusting your filters or search query.</p>
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
          const missingCoins = Math.max(0, reward.price - coins)
          const balanceNoteId = `reward-balance-${reward.id}`

          return (
            <div
              key={reward.id}
              className={`twt-panel p-4 transition-all ${
                owned ? '!border-twt-green bg-twt-green/5' : ''
              }`}
            >
              {/* Icon and rarity */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl" aria-hidden="true">{reward.icon}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${REWARD_RARITY_STYLES[reward.rarity]}`}>
                  {RARITY_LABELS[reward.rarity]}
                </span>
              </div>

              {/* Name and description */}
              <h3 className="mb-1 font-extrabold text-twt-ink">{reward.name}</h3>
              <p className="mb-4 text-sm leading-6 text-twt-ink/70">{reward.description}</p>

              {/* Price and actions */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {owned ? (
                  <>
                    <span className="font-semibold text-twt-green">✓ Owned</span>
                    {canEquip && (
                      <button
                        type="button"
                        onClick={() => handleEquip(reward)}
                        aria-pressed={equipped}
                        className={`min-h-10 rounded-full border-2 border-twt-ink px-3 py-1 text-sm font-extrabold transition-colors ${
                          equipped
                            ? 'bg-twt-green text-white'
                            : 'bg-white text-twt-ink hover:bg-twt-butter'
                        }`}
                      >
                        {equipped ? 'Equipped' : 'Equip'}
                      </button>
                    )}
                    {!canEquip && (
                      <span className="text-sm font-semibold text-twt-ink/60">Consumable</span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <span aria-hidden="true">🪙</span>
                      <span className={`font-extrabold ${canAfford ? 'text-twt-ink' : 'text-twt-coral'}`}>
                        {reward.price.toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePurchase(reward)}
                      disabled={!canAfford}
                      aria-describedby={!canAfford ? balanceNoteId : undefined}
                      aria-label={`Buy ${reward.name} for ${reward.price.toLocaleString()} Truthle Coins`}
                      className="twt-button !min-h-10 !px-4 !py-2 !text-sm disabled:cursor-not-allowed disabled:border-twt-ink/20 disabled:bg-twt-ink/10 disabled:text-twt-ink/45 disabled:shadow-none"
                    >
                      Buy
                    </button>
                  </>
                )}
              </div>
              {!owned && !canAfford && (
                <p id={balanceNoteId} className="mt-3 rounded-lg bg-twt-coral/10 px-3 py-2 text-sm font-semibold text-twt-coral">
                  Insufficient balance. Earn {missingCoins.toLocaleString()} more coins to buy this reward.
                </p>
              )}
            </div>
          )
        })}
      </div>
      )}

      {activeTab !== 'earn' && activeTab !== 'achievements' && rewards.length === 0 && (
        <div className="twt-panel bg-twt-paper px-5 py-12 text-center">
          <h2 className="twt-display text-2xl">No rewards in this category</h2>
          <p className="mt-2 text-twt-ink/65">Try another section of the shop.</p>
        </div>
      )}

      {/* Achievement badges section */}
      {(activeTab === 'badges' || activeTab === 'all') && (
        <div className="mt-12">
          <p className="twt-kicker">Gameplay rewards</p>
          <h2 className="twt-display mt-2 text-3xl text-twt-ink">Achievement badges</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-twt-ink/70">
            These badges are unlocked through gameplay achievements, not purchased.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BADGES.filter(b => b.unlockCondition).map(badge => {
              const owned = ownedItems.includes(badge.id)

              return (
                <div
                  key={badge.id}
                  className={`twt-panel p-4 ${
                    owned ? '!border-twt-green bg-twt-green/5' : 'bg-twt-paper'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-4xl ${owned ? '' : 'grayscale'}`} aria-hidden="true">{badge.icon}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${REWARD_RARITY_STYLES[badge.rarity]}`}>
                      {RARITY_LABELS[badge.rarity]}
                    </span>
                  </div>
                  <h3 className="mb-1 font-extrabold text-twt-ink">{badge.name}</h3>
                  <p className="mb-3 text-sm leading-6 text-twt-ink/70">{badge.description}</p>
                  {owned ? (
                    <span className="font-semibold text-twt-green">✓ Unlocked</span>
                  ) : (
                    <span className="text-sm font-semibold text-twt-ink/60">🔒 Locked</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <section className="twt-panel mt-12 bg-twt-paper p-5 sm:p-6" aria-labelledby="earn-coins-heading">
        <p className="twt-kicker">Gameplay</p>
        <h2 id="earn-coins-heading" className="twt-display mt-2 text-2xl sm:text-3xl">How to earn coins</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-twt-ink/70">
          These game rewards add Truthle Coins to your balance. They do not change the shop prices.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-twt-ink/15 bg-white p-4">
            <span className="text-lg" aria-hidden="true">🎮</span>
            <div>
              <p className="font-extrabold text-twt-ink">Daily Play</p>
              <p className="text-sm text-twt-ink/70">+10 coins just for playing</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-twt-ink/15 bg-white p-4">
            <span className="text-lg" aria-hidden="true">✅</span>
            <div>
              <p className="font-extrabold text-twt-ink">Correct Answers</p>
              <p className="text-sm text-twt-ink/70">+5 coins per correct answer</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-twt-ink/15 bg-white p-4">
            <span className="text-lg" aria-hidden="true">⚡</span>
            <div>
              <p className="font-extrabold text-twt-ink">Speed Bonus</p>
              <p className="text-sm text-twt-ink/70">+2 coins per fast answer (&lt;3s)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-twt-ink/15 bg-white p-4">
            <span className="text-lg" aria-hidden="true">💯</span>
            <div>
              <p className="font-extrabold text-twt-ink">Perfect Score</p>
              <p className="text-sm text-twt-ink/70">+50 coins for 5/5</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-twt-ink/15 bg-white p-4">
            <span className="text-lg" aria-hidden="true">🔥</span>
            <div>
              <p className="font-extrabold text-twt-ink">Streak Milestones</p>
              <p className="text-sm text-twt-ink/70">+25 to +2000 coins at milestones</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-twt-ink/15 bg-white p-4">
            <span className="text-lg" aria-hidden="true">🎁</span>
            <div>
              <p className="font-extrabold text-twt-ink">Welcome Bonus</p>
              <p className="text-sm text-twt-ink/70">+100 coins for first game</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
