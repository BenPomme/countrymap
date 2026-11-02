'use client'

import { openConsentPreferences } from '@/lib/analytics/consent'

export default function PrivacyPreferencesButton() {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="twt-button rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      Review privacy choices
    </button>
  )
}
