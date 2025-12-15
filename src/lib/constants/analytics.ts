/**
 * Analytics & Tracking Configuration
 *
 * Add your tracking IDs here after creating accounts on each platform.
 */

export const ANALYTICS_CONFIG = {
  /**
   * Google Analytics 4
   * Get your Measurement ID from: https://analytics.google.com/
   * Go to: Admin > Data Streams > Web > Measurement ID (starts with G-)
   */
  googleAnalytics: {
    measurementId: 'G-4JYNSX3JXM',
  },

  /**
   * Google Ads Conversion Tracking
   * Get your Conversion ID from: https://ads.google.com/
   * Go to: Tools > Conversions > New Conversion Action
   */
  googleAds: {
    conversionId: '', // e.g., 'AW-XXXXXXXXXX'
  },

  /**
   * Meta (Facebook) Pixel
   * Get your Pixel ID from: https://business.facebook.com/
   * Go to: Events Manager > Data Sources > Add > Web > Meta Pixel
   */
  metaPixel: {
    pixelId: '', // e.g., 'XXXXXXXXXXXXXXXX'
  },

  /**
   * TikTok Pixel
   * Get your Pixel ID from: https://ads.tiktok.com/
   * Go to: Assets > Events > Web Events > Create Pixel
   */
  tiktokPixel: {
    pixelId: '', // e.g., 'XXXXXXXXXXXXXXXXXX'
  },
}

/**
 * Check if a tracking ID is configured
 */
export function isTrackingEnabled(platform: keyof typeof ANALYTICS_CONFIG): boolean {
  const config = ANALYTICS_CONFIG[platform]
  if ('measurementId' in config) return !!config.measurementId
  if ('conversionId' in config) return !!config.conversionId
  if ('pixelId' in config) return !!config.pixelId
  return false
}
