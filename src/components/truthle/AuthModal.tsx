'use client'

import { useState, useEffect } from 'react'
import {
  signUpWithEmail,
  signInWithEmail,
  linkAnonymousToEmail,
  resetPassword,
  subscribeToReminders,
  auth
} from '@/lib/firebase/config'
import { claimEmailSignupBonus, hasClaimedEmailBonus } from '@/lib/truthle/storage'
import { COIN_REWARDS } from '@/lib/truthle/coins'

type AuthTab = 'signup' | 'signin' | 'link' | 'forgot'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialTab?: AuthTab
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = 'signup' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [enableReminders, setEnableReminders] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [bonusClaimed, setBonusClaimed] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    // Check if current user is anonymous
    const checkAuth = () => {
      const user = auth.currentUser
      setIsAnonymous(user?.isAnonymous || false)
    }
    checkAuth()

    // Check if bonus already claimed
    if (typeof window !== 'undefined') {
      setBonusClaimed(hasClaimedEmailBonus())
    }
  }, [isOpen])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setDisplayName('')
    setEnableReminders(false)
    setError(null)
    setSuccess(null)
  }

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab)
    resetForm()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const user = await signUpWithEmail(email, password, displayName || undefined)

      // Subscribe to reminders if checked
      if (enableReminders) {
        await subscribeToReminders(user.uid, email, displayName || null, true)
      }

      // Claim signup bonus
      if (!hasClaimedEmailBonus()) {
        const result = claimEmailSignupBonus()
        if (result.success) {
          setSuccess(`Account created! You earned ${COIN_REWARDS.emailSignup} coins and the Verified Player badge!`)
        } else {
          setSuccess('Account created successfully!')
        }
      } else {
        setSuccess('Account created successfully!')
      }

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try signing in instead.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(firebaseError.message || 'Failed to create account')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await signInWithEmail(email, password)
      setSuccess('Signed in successfully!')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        setError('Invalid email or password.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(firebaseError.message || 'Failed to sign in')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const user = await linkAnonymousToEmail(email, password, displayName || undefined)

      // Subscribe to reminders if checked
      if (enableReminders) {
        await subscribeToReminders(user.uid, email, displayName || null, true)
      }

      // Claim signup bonus
      if (!hasClaimedEmailBonus()) {
        const result = claimEmailSignupBonus()
        if (result.success) {
          setSuccess(`Account linked! You earned ${COIN_REWARDS.emailSignup} coins and the Verified Player badge!`)
        } else {
          setSuccess('Account linked successfully!')
        }
      } else {
        setSuccess('Account linked successfully!')
      }

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('This email is already linked to another account.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(firebaseError.message || 'Failed to link account')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await resetPassword(email)
      setSuccess('Password reset email sent! Check your inbox.')
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }
      if (firebaseError.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(firebaseError.message || 'Failed to send reset email')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const showBonusBadge = !bonusClaimed && (activeTab === 'signup' || activeTab === 'link')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {activeTab === 'signup' && 'Create Account'}
            {activeTab === 'signin' && 'Sign In'}
            {activeTab === 'link' && 'Link Account'}
            {activeTab === 'forgot' && 'Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bonus Badge */}
        {showBonusBadge && (
          <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎁</div>
              <div>
                <div className="font-semibold text-amber-800">Sign Up Bonus!</div>
                <div className="text-sm text-amber-700">
                  Get <span className="font-bold">+{COIN_REWARDS.emailSignup} coins</span> and the{' '}
                  <span className="font-bold">Verified Player</span> badge
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b mx-4 mt-4">
          {isAnonymous ? (
            <>
              <button
                onClick={() => handleTabChange('link')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'link'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Link Account
              </button>
              <button
                onClick={() => handleTabChange('signin')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'signin'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleTabChange('signup')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'signup'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => handleTabChange('signin')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'signin'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={
            activeTab === 'signup'
              ? handleSignUp
              : activeTab === 'signin'
              ? handleSignIn
              : activeTab === 'link'
              ? handleLinkAccount
              : handleForgotPassword
          }
          className="p-4 space-y-4"
        >
          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Display Name (signup/link only) */}
          {(activeTab === 'signup' || activeTab === 'link') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Password (not for forgot) */}
          {activeTab !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Confirm Password (signup/link only) */}
          {(activeTab === 'signup' || activeTab === 'link') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Daily Reminders Checkbox (signup/link only) */}
          {(activeTab === 'signup' || activeTab === 'link') && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableReminders}
                onChange={(e) => setEnableReminders(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Send me daily reminders
                </div>
                <div className="text-xs text-gray-500">
                  Get a friendly email reminder to play Truthle each day
                </div>
              </div>
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              <>
                {activeTab === 'signup' && 'Create Account'}
                {activeTab === 'signin' && 'Sign In'}
                {activeTab === 'link' && 'Link Account'}
                {activeTab === 'forgot' && 'Send Reset Email'}
              </>
            )}
          </button>

          {/* Forgot Password Link */}
          {activeTab === 'signin' && (
            <button
              type="button"
              onClick={() => handleTabChange('forgot')}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Forgot your password?
            </button>
          )}

          {/* Back to Sign In (from forgot) */}
          {activeTab === 'forgot' && (
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t text-center text-xs text-gray-500">
          By signing up, you agree to our{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  )
}
