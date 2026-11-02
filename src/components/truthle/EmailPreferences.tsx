'use client'

interface EmailPreferencesProps {
  className?: string
}

/**
 * Reminder controls are intentionally disabled until delivery, duplicate
 * prevention and unsubscribe are verified end to end. This component never
 * sends mail, never reads an account email or UID, and makes no delivery promise.
 */
export default function EmailPreferences({ className = '' }: EmailPreferencesProps) {
  return (
    <aside className={`twt-panel rounded-xl border border-gray-200 bg-white p-4 ${className}`} aria-labelledby="email-preferences-heading">
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden="true">✉️</div>
        <div>
          <h3 id="email-preferences-heading" className="font-semibold text-gray-900">Email reminders</h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Email reminders are disabled. No reminder can be turned on or sent from this page. The feature remains off until delivery, duplicate prevention and unsubscribe are verified.
          </p>
        </div>
      </div>
    </aside>
  )
}
