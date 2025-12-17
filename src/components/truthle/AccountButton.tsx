'use client'

import { useState, useEffect, useRef } from 'react'
import { auth, logOut, onAuthChange } from '@/lib/firebase/config'
import { hasClaimedEmailBonus } from '@/lib/truthle/storage'
import { COIN_REWARDS } from '@/lib/truthle/coins'
import AuthModal from './AuthModal'
import type { User } from 'firebase/auth'

interface AccountButtonProps {
  className?: string
}

export default function AccountButton({ className = '' }: AccountButtonProps) {
  const [user, setUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showBonusBadge, setShowBonusBadge] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    // Listen for auth changes
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser)
      // Check if bonus is available for anonymous users
      if (authUser?.isAnonymous && !hasClaimedEmailBonus()) {
        setShowBonusBadge(true)
      } else {
        setShowBonusBadge(false)
      }
    })

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await logOut()
      setShowDropdown(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!mounted) return null

  // Anonymous user - show Sign Up button with bonus badge
  if (!user || user.isAnonymous) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`relative flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors ${className}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Sign Up
          {showBonusBadge && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full animate-pulse">
              +{COIN_REWARDS.emailSignup}
            </span>
          )}
        </button>
        <AuthModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          initialTab={user?.isAnonymous ? 'link' : 'signup'}
        />
      </>
    )
  }

  // Signed in user - show avatar with dropdown
  const displayName = user.displayName || user.email?.split('@')[0] || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate hidden sm:block">
            {displayName}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="font-medium text-gray-900 truncate">{displayName}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
