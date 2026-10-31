import { storeCodeTeaser } from '@/lib/affiliate/dailyUnlocks'

export default function RewardsTeaser({ className = '' }: { className?: string }) {
  return (
    <div className={`mx-auto mb-4 w-full max-w-sm rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-left ${className}`}>
      <p className="font-bold text-emerald-900">🎁 Codes &amp; rewards today</p>
      <p className="text-[11px] text-emerald-800/70 -mt-0.5 mb-1">Codes de réduction &amp; récompenses</p>
      <ul className="text-sm text-emerald-900 space-y-0.5">
        <li>• Score 5/5 → exclusive Lien &amp; Cie discount <span className="font-mono font-bold">{storeCodeTeaser()}</span> 🔒</li>
        <li>• Share your result → free Extra Attempt code for a friend</li>
      </ul>
    </div>
  )
}
