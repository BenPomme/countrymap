'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Shows a prominent fixed banner immediately on mount when the URL has ?checkout=success|cancel
 * (Stripe return). Rendered via portal so it is visible even while the game is still loading.
 * Strips the checkout query params after a short delay (game init may still read them first).
 */
export default function CheckoutBanner({ onSuccess }: { onSuccess?: () => void }) {
  const [kind, setKind] = useState<'success' | 'cancel' | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const c = new URLSearchParams(window.location.search).get('checkout')
    if (c !== 'success' && c !== 'cancel') return
    setKind(c)
    if (c === 'success') onSuccess?.()
    const strip = window.setTimeout(() => {
      const p = new URLSearchParams(window.location.search)
      if (p.has('checkout')) {
        ;['checkout', 'paid', 'session_id'].forEach((k) => p.delete(k))
        const q = p.toString()
        window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash)
      }
    }, 15000)
    const hide = window.setTimeout(() => setKind(null), c === 'success' ? 10000 : 5000)
    return () => { window.clearTimeout(strip); window.clearTimeout(hide) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!kind || typeof document === 'undefined') return null
  const ok = kind === 'success'
  return createPortal(
    <div role="status" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 w-full max-w-md">
      <div className={`flex items-center justify-between gap-3 rounded-xl shadow-lg px-4 py-3 text-white font-semibold ${ok ? 'bg-emerald-600' : 'bg-gray-700'}`}>
        <span>{ok ? '✅ Extra Attempt unlocked' : 'Checkout cancelled — no charge was made.'}</span>
        <button type="button" aria-label="Dismiss" onClick={() => setKind(null)} className="text-white/80 hover:text-white">✕</button>
      </div>
    </div>,
    document.body,
  )
}
