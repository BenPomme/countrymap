'use client'

import { useEffect, useState } from 'react'
import {
  getConsentSnapshot,
  subscribeConsent,
  type ConsentSnapshot,
} from './consent'

export function useConsent(): ConsentSnapshot | null {
  const [snapshot, setSnapshot] = useState<ConsentSnapshot | null>(null)

  useEffect(() => {
    const refresh = () => setSnapshot(getConsentSnapshot())
    refresh()
    return subscribeConsent(refresh)
  }, [])

  return snapshot
}

