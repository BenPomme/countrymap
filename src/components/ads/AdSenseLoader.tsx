'use client'

import { useEffect } from 'react'
import { ADSENSE_CONFIG } from '@/lib/constants/ads'
import { isEmbeddedIOSApp } from '@/lib/appMode'

const ADSENSE_SCRIPT_ID = 'adsense-script'

export default function AdSenseLoader() {
  useEffect(() => {
    if (isEmbeddedIOSApp()) return

    if (document.getElementById(ADSENSE_SCRIPT_ID)) return

    const script = document.createElement('script')
    script.id = ADSENSE_SCRIPT_ID
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.clientId}`
    script.crossOrigin = 'anonymous'

    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return null
}
