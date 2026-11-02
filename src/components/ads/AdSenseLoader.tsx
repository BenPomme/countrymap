'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { ADSENSE_CONFIG } from '@/lib/constants/ads'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'
import { useConsent } from '@/lib/analytics/useConsent'
import { emitAdStatus } from '@/lib/ads/state'

const ADSENSE_SCRIPT_ID = 'adsense-script'

/**
 * Loads the AdSense library once. Use next/script so it survives client
 * navigations and is not removed on effect cleanup (which broke fills).
 */
export default function AdSenseLoader() {
  const embeddedMode = useEmbeddedAppMode()
  const consent = useConsent()
  const [embeddedChecked, setEmbeddedChecked] = useState(false)

  useEffect(() => {
    setEmbeddedChecked(true)
  }, [])

  if (
    !embeddedChecked ||
    embeddedMode ||
    consent?.advertising !== true ||
    !consent.environmentAllowed
  ) {
    return null
  }

  return (
    <Script
      id={ADSENSE_SCRIPT_ID}
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
      onError={() => emitAdStatus({ status: 'error' })}
    />
  )
}
