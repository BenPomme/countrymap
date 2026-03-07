export const IOS_EMBEDDED_QUERY_KEY = 'embedded'
export const IOS_EMBEDDED_QUERY_VALUE = 'ios'
export const IOS_APP_USER_AGENT_MARKER = 'WorldTruthIOS'

export function isEmbeddedIOSApp(): boolean {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  if (params.get(IOS_EMBEDDED_QUERY_KEY) === IOS_EMBEDDED_QUERY_VALUE) {
    return true
  }

  const ua = window.navigator.userAgent || ''
  return ua.includes(IOS_APP_USER_AGENT_MARKER)
}
