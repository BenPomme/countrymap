'use client'

import { useEffect, useState } from 'react'
import { isEmbeddedIOSApp } from './appMode'

export function useEmbeddedAppMode(): boolean {
  const [embedded, setEmbedded] = useState(false)

  useEffect(() => {
    const evaluate = () => setEmbedded(isEmbeddedIOSApp())

    evaluate()
    window.addEventListener('popstate', evaluate)
    window.addEventListener('worldtruth:route-changed', evaluate)

    return () => {
      window.removeEventListener('popstate', evaluate)
      window.removeEventListener('worldtruth:route-changed', evaluate)
    }
  }, [])

  return embedded
}
