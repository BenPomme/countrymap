'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { isEmbeddedIOSApp } from '@/lib/appMode'
import { installNativeBridgeReceiver, postBridgeMessage } from '@/lib/bridge/webBridge'

export default function AppBridgeLifecycle() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previousRouteRef = useRef<string | null>(null)
  const routeStartRef = useRef<number>(Date.now())

  useEffect(() => {
    installNativeBridgeReceiver()
  }, [])

  useEffect(() => {
    if (!isEmbeddedIOSApp()) return

    const currentQuery = searchParams.toString()
    const currentRoute = currentQuery ? `${pathname}?${currentQuery}` : pathname
    const now = Date.now()

    if (previousRouteRef.current) {
      postBridgeMessage({
        type: 'session_completed',
        payload: {
          route: previousRouteRef.current,
          sessionType: 'route',
          reason: 'route_change',
          durationMs: now - routeStartRef.current,
          timestamp: new Date().toISOString(),
        },
      })
    }

    postBridgeMessage({
      type: 'route_changed',
      payload: {
        route: pathname,
        query: currentQuery,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    })

    previousRouteRef.current = currentRoute
    routeStartRef.current = now

    window.dispatchEvent(new CustomEvent('worldtruth:route-changed'))
  }, [pathname, searchParams])

  useEffect(() => {
    if (!isEmbeddedIOSApp()) return

    const handleBeforeUnload = () => {
      if (!previousRouteRef.current) return

      postBridgeMessage({
        type: 'session_completed',
        payload: {
          route: previousRouteRef.current,
          sessionType: 'route',
          reason: 'unload',
          durationMs: Date.now() - routeStartRef.current,
          timestamp: new Date().toISOString(),
        },
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return null
}
