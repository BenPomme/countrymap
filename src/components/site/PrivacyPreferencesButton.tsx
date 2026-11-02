'use client'

import { openConsentPreferences } from '@/lib/analytics/consent'

export default function PrivacyPreferencesButton() {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className="twt-footer-link cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-twt-blue"
    >
      Privacy choices
    </button>
  )
}
