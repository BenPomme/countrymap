'use client'

import Script from 'next/script'
import { ADSENSE_CONFIG } from '@/lib/constants/ads'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

const ADSENSE_SCRIPT_ID = 'adsense-script'

/**
 * Loads the AdSense library once. Use next/script so it survives client
 * navigations and is not removed on effect cleanup (which broke fills).
 */
export default function AdSenseLoader() {
  const embeddedMode = useEmbeddedAppMode()

  if (embeddedMode) {
    return null
  }

  return (
    <Script
      id={ADSENSE_SCRIPT_ID}
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  )
}
