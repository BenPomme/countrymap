'use client'

import Script from 'next/script'
import { ANALYTICS_CONFIG, isTrackingEnabled } from '@/lib/constants/analytics'

/**
 * Analytics component that loads all tracking scripts
 * Add this to your layout.tsx
 */
export default function Analytics() {
  const ga = ANALYTICS_CONFIG.googleAnalytics
  const gads = ANALYTICS_CONFIG.googleAds
  const meta = ANALYTICS_CONFIG.metaPixel
  const tiktok = ANALYTICS_CONFIG.tiktokPixel
  const xPixel = ANALYTICS_CONFIG.xPixel

  return (
    <>
      {/* Google Analytics 4 */}
      {isTrackingEnabled('googleAnalytics') && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga.measurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga.measurementId}');
              ${isTrackingEnabled('googleAds') ? `gtag('config', '${gads.conversionId}');` : ''}
            `}
          </Script>
        </>
      )}

      {/* Meta (Facebook) Pixel */}
      {isTrackingEnabled('metaPixel') && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${meta.pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* TikTok Pixel */}
      {isTrackingEnabled('tiktokPixel') && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktok.pixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* Meta Pixel noscript fallback */}
      {isTrackingEnabled('metaPixel') && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${meta.pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}

      {/* X (Twitter) Pixel */}
      {isTrackingEnabled('xPixel') && (
        <Script id="x-pixel" strategy="afterInteractive">
          {`
            !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
            },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
            a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
            twq('config','${xPixel.pixelId}');
          `}
        </Script>
      )}
    </>
  )
}
