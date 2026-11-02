'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CONSENT_OPEN_EVENT,
  saveConsent,
  type ConsentChoice,
  type ConsentSnapshot,
} from '@/lib/analytics/consent'
import { useConsent } from '@/lib/analytics/useConsent'

function needsReloadForConsentChange(before: ConsentSnapshot, after: ConsentChoice): boolean {
  return (
    before.choice === 'set' &&
    (before.analytics !== after.analytics || before.advertising !== after.advertising)
  )
}

export default function ConsentManager() {
  const consent = useConsent()
  const [requested, setRequested] = useState(false)
  const [dismissedPrompt, setDismissedPrompt] = useState(false)
  const [draft, setDraft] = useState<ConsentChoice>({ analytics: false, advertising: false })

  const show = requested || (consent?.choice === 'unknown' && !dismissedPrompt)

  useEffect(() => {
    const open = () => setRequested(true)
    window.addEventListener(CONSENT_OPEN_EVENT, open)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open)
  }, [])

  useEffect(() => {
    if (!show || !consent) return
    setDraft({ analytics: consent.analytics, advertising: consent.advertising })
  }, [consent, show])

  if (!show || !consent) return null

  const apply = (choice: ConsentChoice) => {
    const next = consent.globalPrivacyControl
      ? { analytics: false, advertising: false }
      : choice

    saveConsent(next)
    setRequested(false)
    setDismissedPrompt(true)

    if (needsReloadForConsentChange(consent, next)) {
      window.location.reload()
    }
  }

  const close = () => {
    setRequested(false)
    if (consent.choice === 'unknown') setDismissedPrompt(true)
  }

  return (
    <aside
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-slate-300 bg-[#fff9e8] p-5 text-slate-900 shadow-2xl md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="twt-kicker text-xs font-bold uppercase tracking-wide text-blue-800">
            Privacy choices
          </p>
          <h2 id="consent-title" className="twt-display mt-1 text-xl font-bold md:text-2xl">
            You control optional measurement
          </h2>
        </div>
        {consent.choice === 'set' && (
          <button
            type="button"
            onClick={close}
            className="rounded-md px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            aria-label="Close privacy choices"
          >
            Close
          </button>
        )}
      </div>

      <p id="consent-description" className="mt-3 text-sm leading-6 text-slate-700">
        Analytics and advertising are off unless you allow them. Game progress and earned credits
        work without optional choices.
      </p>

      {consent.globalPrivacyControl && (
        <p className="mt-3 rounded-lg bg-blue-100 p-3 text-sm leading-6 text-blue-950">
          Global Privacy Control is on, so optional analytics and advertising stay off.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-slate-300 bg-white p-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.analytics}
            disabled={consent.globalPrivacyControl}
            onChange={(event) => setDraft((current) => ({ ...current, analytics: event.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-blue-700"
          />
          <span>Analytics</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-slate-300 bg-white p-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.advertising}
            disabled={consent.globalPrivacyControl}
            onChange={(event) => setDraft((current) => ({ ...current, advertising: event.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-blue-700"
          />
          <span>Advertising</span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => apply({ analytics: true, advertising: true })}
          disabled={consent.globalPrivacyControl}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Allow optional
        </button>
        <button
          type="button"
          onClick={() => apply({ analytics: false, advertising: false })}
          className="rounded-lg border border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          Reject optional
        </button>
        <button
          type="button"
          onClick={() => apply(draft)}
          disabled={consent.globalPrivacyControl}
          className="rounded-lg border border-blue-700 bg-transparent px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save choices
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-600">
        Read the <Link className="font-semibold text-blue-800 underline" href="/privacy/">privacy policy</Link>.
      </p>
    </aside>
  )
}

