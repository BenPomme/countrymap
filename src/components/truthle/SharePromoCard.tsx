'use client'

import { useState } from 'react'
import { T } from '@/lib/truthle/monetizeCopy'
import type { SharePromo } from '@/lib/truthle/storage'

export default function SharePromoCard({ promo }: { promo: SharePromo }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(promo.code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }
  return (
    <div className="mt-3 mb-6 mx-auto max-w-sm rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center">
      <p className="text-sm text-emerald-900">
        🎁 Free Extra Attempt code for a friend: <span className="font-mono font-bold">{promo.code}</span>
      </p>
      <button onClick={copy} className="mt-2 text-xs font-semibold py-1 px-3 rounded-lg bg-emerald-600 text-white">
        {copied ? '✓ Copied' : 'Copy code'}
      </button>
      <p className="mt-2 text-xs text-emerald-900">{T.truthCodeGift(promo.code)}</p>
      <p className="mt-1 text-[11px] text-emerald-800/70">Single use · expires end of today (UTC) · paste at checkout</p>
    </div>
  )
}
