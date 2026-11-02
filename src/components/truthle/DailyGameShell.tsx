'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { useEmbeddedAppMode } from '@/lib/useEmbeddedAppMode'

interface DailyGameShellProps {
  children: ReactNode
  footer?: ReactNode
  mainClassName?: string
  playAwarePromo?: ReactNode
  hideFooterWhenEmbedded?: boolean
}

function PlayAwarePromo({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onState = (event: Event) => {
      const state = (event as CustomEvent<string>).detail
      setHidden(state === 'playing' || state === 'answered')
    }

    window.addEventListener('truthle:state', onState)
    return () => window.removeEventListener('truthle:state', onState)
  }, [])

  return hidden ? null : <>{children}</>
}

export default function DailyGameShell({
  children,
  footer,
  mainClassName = '',
  playAwarePromo,
  hideFooterWhenEmbedded = false,
}: DailyGameShellProps) {
  const embeddedMode = useEmbeddedAppMode()
  const showFooter = footer && (!embeddedMode || !hideFooterWhenEmbedded)

  return (
    <main className={`twt-container ${mainClassName} ${embeddedMode ? 'py-4' : 'py-6 sm:py-10'}`}>
      {playAwarePromo && <PlayAwarePromo>{playAwarePromo}</PlayAwarePromo>}
      {children}
      {showFooter ? footer : null}
    </main>
  )
}
