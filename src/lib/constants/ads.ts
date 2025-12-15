/**
 * Google AdSense Configuration
 *
 * To get your ad slot IDs:
 * 1. Go to https://www.google.com/adsense/
 * 2. Create ad units for each placement
 * 3. Copy the data-ad-slot values here
 */

export const ADSENSE_CONFIG = {
  // Your AdSense Publisher ID
  clientId: 'ca-pub-6325580740065771',

  // Set to true to enable test mode (shows test ads)
  testMode: process.env.NODE_ENV === 'development',
}

/**
 * Ad Slot IDs - Update these after creating ad units in AdSense
 *
 * To create ad units:
 * 1. Go to AdSense > Ads > By ad unit
 * 2. Create Display ads for each placement
 * 3. Copy the slot ID from the ad code
 */
export const AD_SLOTS = {
  // Horizontal banner below header (728x90 / responsive)
  headerBanner: '3829065727',

  // Square ad in sidebar (300x250)
  sidebarSquare: '1374933403',

  // Ad below country detail panel (300x250)
  countryDetail: '8870280048',

  // Banner on charts page (728x90 / responsive)
  chartsBanner: '6435688394',

  // In-feed ad between chart sections
  chartsInFeed: '3581653716',
}

/**
 * Ad Formats
 */
export const AD_FORMATS = {
  banner: {
    width: 728,
    height: 90,
    mobileWidth: 320,
    mobileHeight: 50,
  },
  square: {
    width: 300,
    height: 250,
  },
  vertical: {
    width: 300,
    height: 600,
  },
}
