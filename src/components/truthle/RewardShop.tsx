'use client'

import { useState, useEffect } from 'react'
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

type TabType = 'earn' | 'all' | 'badges' | 'themes' | 'powerups' | 'profile'

export default function RewardShop() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [coins, setCoins] = useState(0)
  const [ownedItems, setOwnedItems] = useState<string[]>([])
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

  const tabs: { id: TabType; label: string; icon: string }[] = [
    // Only show Earn tab when Offertoro is configured
    ...(OFFERTORO_ENABLED ? [{ id: 'earn' as TabType, label: 'Earn Coins', icon: '🎁' }] : []),
    { id: 'all', label: 'All', icon: '🛒' },
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
          </button>
        ))}
      </div>

      {/* Earn Coins Tab - Offer Wall (only when Offertoro configured) */}
      {OFFERTORO_ENABLED && activeTab === 'earn' && (
        <div className="mb-8">
          <OfferWall />
        </div>
      )}

      {/* Rewards grid */}
      {activeTab !== 'earn' && (
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

      {activeTab !== 'earn' && rewards.length === 0 && (
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
