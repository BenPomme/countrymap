'use client'

import { useState } from 'react'
import { T } from '@/lib/truthle/monetizeCopy'
import type { SharePromo } from '@/lib/truthle/storage'

export default function SharePromoCard({ promo }: { promo: SharePromo }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(promo.code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }
  const share = async () => {
    const text = T.truthCodeGift(promo.code)
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch {}
  }
  return (
    <div className="mt-3 mb-6 mx-auto max-w-sm rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center">
      <p className="font-mono text-2xl font-bold tracking-widest text-emerald-900 select-all">🎁 {promo.code}</p>
      <button onClick={copy} className="mt-2 text-xs font-semibold py-1 px-3 rounded-lg bg-emerald-600 text-white">
        {copied ? '✓ Copied' : 'Copy code'}
      </button>
      <button onClick={share} className="mt-2 ml-2 text-xs font-semibold py-1 px-3 rounded-lg border border-emerald-600 text-emerald-700">
        Share with a friend
      </button>
      <p className="mt-1 text-[11px] text-emerald-800/70">Free Extra Attempt for a friend · Single use · ends today (UTC)</p>
    </div>
  )
}
