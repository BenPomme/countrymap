'use client'

import { useState, useEffect } from 'react'
import { auth, subscribeToReminders, onAuthChange } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { User } from 'firebase/auth'

interface EmailPreferencesProps {
  className?: string
}

export default function EmailPreferences({ className = '' }: EmailPreferencesProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [remindersEnabled, setRemindersEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser)

      if (authUser && !authUser.isAnonymous && authUser.email) {
        // Fetch current preferences
        try {
          const subscriberRef = doc(db, 'email_subscribers', authUser.uid)
          const subscriberDoc = await getDoc(subscriberRef)

          if (subscriberDoc.exists()) {
            setRemindersEnabled(subscriberDoc.data()?.enabled || false)
          }
        } catch (err) {
          console.error('Error fetching preferences:', err)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleToggleReminders = async () => {
    if (!user || user.isAnonymous || !user.email) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const newValue = !remindersEnabled
      await subscribeToReminders(
        user.uid,
        user.email,
        user.displayName,
        newValue
      )
      setRemindersEnabled(newValue)
      setSuccess(newValue ? 'Daily reminders enabled!' : 'Daily reminders disabled')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error updating preferences:', err)
      setError('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-xl h-24 ${className}`} />
    )
  }

  // Not signed in with email
  if (!user || user.isAnonymous || !user.email) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">📧</div>
          <div>
            <h3 className="font-semibold text-gray-900">Email Reminders</h3>
            <p className="text-sm text-gray-600">
              Sign up with email to receive daily reminders to play Truthle
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📧</div>
          <div>
            <h3 className="font-semibold text-gray-900">Daily Reminders</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={handleToggleReminders}
            disabled={saving}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${saving ? 'opacity-50' : ''}`}></div>
        </label>
      </div>

      {remindersEnabled && (
        <p className="mt-3 text-xs text-gray-500">
          You&apos;ll receive a friendly reminder each day at 9:00 AM UTC if you haven&apos;t played yet.
        </p>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}
    </div>
  )
}
