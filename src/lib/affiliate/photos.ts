import type { UnlockPick } from '@/lib/affiliate/dailyUnlocks'

export const AFFILIATE_PHOTO_WIDTH = 640
export const AFFILIATE_PHOTO_HEIGHT = 420

export const AFFILIATE_PHOTO_KEYS = [
  'privacy-screen',
  'webcam',
  'journalism',
  'books',
  'passport',
  'adapter',
  'luggage',
  'guides',
  'atlas',
  'map',
  'globe',
  'trivia',
] as const

export type AffiliatePhotoKey = typeof AFFILIATE_PHOTO_KEYS[number]

export interface AffiliatePhotoMetadata {
  key: AffiliatePhotoKey
  src: string
  width: number
  height: number
}

type AffiliatePhotoSource = Pick<UnlockPick, 'label' | 'query'>

const PHOTO_SOURCES: Record<AffiliatePhotoKey, string> = {
  'privacy-screen': '/affiliate/photos/privacy-screen.webp',
  webcam: '/affiliate/photos/webcam.webp',
  journalism: '/affiliate/photos/journalism.webp',
  books: '/affiliate/photos/books.webp',
  passport: '/affiliate/photos/passport.webp',
  adapter: '/affiliate/photos/adapter.webp',
  luggage: '/affiliate/photos/luggage.webp',
  guides: '/affiliate/photos/guides.webp',
  atlas: '/affiliate/photos/atlas.webp',
  map: '/affiliate/photos/map.webp',
  globe: '/affiliate/photos/globe.webp',
  trivia: '/affiliate/photos/trivia.webp',
}

/** Maps a pick to one of the fixed local photo categories. */
export function getAffiliatePhotoKey({ label, query }: AffiliatePhotoSource): AffiliatePhotoKey {
  const text = `${label} ${query}`.toLowerCase()

  if (/webcam/.test(text)) return 'webcam'
  if (/privacy|screen protector|screen filter/.test(text)) return 'privacy-screen'
  if (/journalism|press freedom|news/.test(text)) return 'journalism'
  if (/passport|rfid/.test(text)) return 'passport'
  if (/adapter|plug|power strip/.test(text)) return 'adapter'
  if (/cabin|carry-on|carry on|luggage|backpack|suitcase/.test(text)) return 'luggage'
  if (/guide|lonely planet/.test(text)) return 'guides'
  if (/atlas/.test(text)) return 'atlas'
  if (/scratch|map/.test(text)) return 'map'
  if (/globe/.test(text)) return 'globe'
  if (/trivia|game/.test(text)) return 'trivia'
  if (/book|orwell|reading/.test(text)) return 'books'

  return 'books'
}

export function getAffiliatePhotoByKey(key: AffiliatePhotoKey): AffiliatePhotoMetadata {
  return {
    key,
    src: PHOTO_SOURCES[key],
    width: AFFILIATE_PHOTO_WIDTH,
    height: AFFILIATE_PHOTO_HEIGHT,
  }
}

export function getAffiliatePhoto(pick: AffiliatePhotoSource): AffiliatePhotoMetadata {
  return getAffiliatePhotoByKey(getAffiliatePhotoKey(pick))
}

export const ATLAS_PHOTO = getAffiliatePhotoByKey('atlas')
