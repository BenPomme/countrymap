'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ANALYTICS_CONFIG, isTrackingEnabled } from '@/lib/constants/analytics'
import {
  clearQueuedAnalyticsEvents,
  configureGoogleTags,
  markAnalyticsConfigured,
  queueAnalyticsPageContext,
  trackPageView,
} from '@/lib/analytics/events'
import { useConsent } from '@/lib/analytics/useConsent'

const GOOGLE_TAG_SCRIPT_ID = 'twt-google-tag'
const GOOGLE_TAG_BOOTSTRAP_ID = 'twt-google-tag-bootstrap'

type Gtag = (...args: unknown[]) => void

function getGtag(): Gtag | undefined {
  if (typeof window === 'undefined') return undefined
  const candidate = (window as Window & { gtag?: Gtag }).gtag
  return typeof candidate === 'function' ? candidate : undefined
}

function consentSignals(analytics: boolean, advertising: boolean): Record<string, string> {
  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: advertising ? 'granted' : 'denied',
    ad_user_data: advertising ? 'granted' : 'denied',
    ad_personalization: advertising ? 'granted' : 'denied',
  }
}

export default function Analytics() {
  const consent = useConsent()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const scriptStarted = useRef(false)
  const configuredAnalytics = useRef(false)
  const configuredAds = useRef(false)
  const lastPathname = useRef<string | null>(null)

  const analyticsAllowed = consent?.analytics === true
  const advertisingAllowed = consent?.advertising === true
  const pageViewsAllowed = analyticsAllowed
  const tagId = analyticsAllowed
    ? ANALYTICS_CONFIG.googleAnalytics.measurementId
    : advertisingAllowed
      ? ANALYTICS_CONFIG.googleAds.conversionId
      : null

  useEffect(() => {
    if (!ready || !tagId) return

    const gtag = getGtag()
    if (!gtag) return

    gtag('consent', 'update', consentSignals(analyticsAllowed, advertisingAllowed))
    if (!scriptStarted.current) {
      gtag('js', new Date())
      scriptStarted.current = true
    }

    const analyticsMeasurementId =
      analyticsAllowed && isTrackingEnabled('googleAnalytics') && !configuredAnalytics.current
        ? ANALYTICS_CONFIG.googleAnalytics.measurementId
        : undefined
    const adsConversionId =
      advertisingAllowed && isTrackingEnabled('googleAds') && !configuredAds.current
        ? ANALYTICS_CONFIG.googleAds.conversionId
        : undefined

    if (analyticsMeasurementId || adsConversionId) {
      const configured = configureGoogleTags(gtag, {
        analyticsMeasurementId,
        adsConversionId,
      })
      if (configured) {
        if (analyticsMeasurementId) {
          configuredAnalytics.current = true
          markAnalyticsConfigured()
        }
        if (adsConversionId) configuredAds.current = true
      }
    }
  }, [advertisingAllowed, analyticsAllowed, ready, tagId])

  useEffect(() => {
    if (!analyticsAllowed) clearQueuedAnalyticsEvents()
  }, [analyticsAllowed])

  useEffect(() => {
    if (!ready) return
    if (!tagId) {
      lastPathname.current = null
      return
    }

    const gtag = getGtag()
    if (!gtag || !queueAnalyticsPageContext(gtag)) return

    if (!pageViewsAllowed) {
      lastPathname.current = null
      return
    }
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname
    trackPageView()
  }, [pageViewsAllowed, pathname, ready, tagId])

  useEffect(() => {
    if (!consent || tagId) return
    const gtag = getGtag()
    if (!gtag) return
    gtag('consent', 'update', consentSignals(false, false))
  }, [advertisingAllowed, analyticsAllowed, consent, tagId])

  if (!consent?.environmentAllowed || !tagId) return null

  return (
    <>
      <Script id={GOOGLE_TAG_BOOTSTRAP_ID} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
          window.gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
        `}
      </Script>
      <Script
        id={GOOGLE_TAG_SCRIPT_ID}
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`}
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
    </>
  )
}
