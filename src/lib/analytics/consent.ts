export const CONSENT_STORAGE_KEY = 'twt.privacy-choices.v1'
export const CONSENT_CHANGE_EVENT = 'twt:consent-change'
export const CONSENT_OPEN_EVENT = 'twt:open-consent-preferences'

const ANALYTICS_HOSTS = new Set(['theworldtruth.com', 'www.theworldtruth.com'])

export type ConsentChoice = {
  analytics: boolean
  advertising: boolean
}

export type ConsentSnapshot = ConsentChoice & {
  choice: 'unknown' | 'set'
  globalPrivacyControl: boolean
  environmentAllowed: boolean
}

type StoredConsent = ConsentChoice & { version: 1 }

export function parseStoredConsent(raw: string | null): ConsentChoice | null {
  if (!raw) return null

  try {
    const value = JSON.parse(raw) as Partial<StoredConsent> | null
    if (
      !value ||
      value.version !== 1 ||
      typeof value.analytics !== 'boolean' ||
      typeof value.advertising !== 'boolean'
    ) {
      return null
    }

    return {
      analytics: value.analytics,
      advertising: value.advertising,
    }
  } catch {
    return null
  }
}

export function isAnalyticsHostAllowed(hostname: string | null | undefined): boolean {
  if (!hostname) return false
  return ANALYTICS_HOSTS.has(hostname.trim().toLowerCase())
}

export function isAnalyticsLocationAllowed(location: {
  protocol?: string
  hostname?: string
} | null | undefined): boolean {
  return location?.protocol === 'https:' && isAnalyticsHostAllowed(location.hostname)
}

export function hasGlobalPrivacyControl(navigatorLike?: object | null): boolean {
  const candidate = navigatorLike as { globalPrivacyControl?: unknown } | null | undefined
  return candidate?.globalPrivacyControl === true
}

export function buildConsentSnapshot(options: {
  stored: ConsentChoice | null
  globalPrivacyControl: boolean
  environmentAllowed: boolean
}): ConsentSnapshot {
  const active = options.environmentAllowed && !options.globalPrivacyControl

  return {
    choice: options.stored ? 'set' : 'unknown',
    analytics: active && options.stored?.analytics === true,
    advertising: active && options.stored?.advertising === true,
    globalPrivacyControl: options.globalPrivacyControl,
    environmentAllowed: options.environmentAllowed,
  }
}

export function getConsentSnapshot(): ConsentSnapshot {
  if (typeof window === 'undefined') {
    return buildConsentSnapshot({
      stored: null,
      globalPrivacyControl: false,
      environmentAllowed: false,
    })
  }

  let stored: ConsentChoice | null = null
  try {
    stored = parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY))
  } catch {
    stored = null
  }

  return buildConsentSnapshot({
    stored,
    globalPrivacyControl: hasGlobalPrivacyControl(window.navigator),
    environmentAllowed: isAnalyticsLocationAllowed(window.location),
  })
}

export function saveConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return

  const value: StoredConsent = {
    version: 1,
    analytics: choice.analytics === true,
    advertising: choice.advertising === true,
  }

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value))
  } catch {
    return
  }

  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT))
}

export function subscribeConsent(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined

  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY) listener()
  }

  window.addEventListener(CONSENT_CHANGE_EVENT, listener)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function openConsentPreferences(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT))
}

