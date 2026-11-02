import type { SharePromo } from '@/lib/truthle/storage'
import { formatGiftExpiry } from './resultShare'

export default function SharePromoCard({ promo }: { promo: SharePromo }) {
  return (
    <div className="mt-3 rounded-xl border border-[#246e55] bg-[#eef8f3] px-4 py-3 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-[#246e55]">Prepared friend gift</p>
      <p className="mt-1 font-mono text-2xl font-black tracking-widest text-[#192947] select-all">{promo.code}</p>
      <p className="mt-1 text-xs text-[#59647a]">For a friend only. Single use. Expires {formatGiftExpiry(promo.expiresAt)}.</p>
      <p className="mt-1 text-xs text-[#59647a]">Your account cannot use this gift code.</p>
    </div>
  )
}
