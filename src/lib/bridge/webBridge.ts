'use client'

import { isEmbeddedIOSApp } from '@/lib/appMode'
import type { IOSToWebBridgeMessage, WebToIOSBridgeMessage } from './types'

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        worldTruthBridge?: {
          postMessage: (message: WebToIOSBridgeMessage) => void
        }
      }
    }
    WorldTruthBridge?: {
      receiveNativeMessage: (message: unknown) => void
    }
  }
}

const NATIVE_BRIDGE_EVENT = 'worldtruth:native-message'

function tryParseMessage(message: unknown): IOSToWebBridgeMessage | null {
  try {
    if (typeof message === 'string') {
      return JSON.parse(message) as IOSToWebBridgeMessage
    }

    if (message && typeof message === 'object') {
      return message as IOSToWebBridgeMessage
    }
  } catch (error) {
    console.error('Failed to parse native bridge message:', error)
  }

  return null
}

export function installNativeBridgeReceiver(): void {
  if (typeof window === 'undefined' || window.WorldTruthBridge) return

  window.WorldTruthBridge = {
    receiveNativeMessage: (rawMessage: unknown) => {
      const parsed = tryParseMessage(rawMessage)
      if (!parsed) return

      window.dispatchEvent(new CustomEvent<IOSToWebBridgeMessage>(NATIVE_BRIDGE_EVENT, {
        detail: parsed,
      }))
    },
  }
}

export function postBridgeMessage(message: WebToIOSBridgeMessage): void {
  if (typeof window === 'undefined' || !isEmbeddedIOSApp()) return

  try {
    window.webkit?.messageHandlers?.worldTruthBridge?.postMessage(message)
  } catch (error) {
    console.error('Failed to post message to iOS bridge:', error)
  }
}

export function onNativeBridgeMessage(
  callback: (message: IOSToWebBridgeMessage) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<IOSToWebBridgeMessage>
    if (customEvent.detail) {
      callback(customEvent.detail)
    }
  }

  window.addEventListener(NATIVE_BRIDGE_EVENT, handler)
  return () => window.removeEventListener(NATIVE_BRIDGE_EVENT, handler)
}
