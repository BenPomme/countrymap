import Link from 'next/link'
import { getAmazonStorefrontLabel } from '@/lib/affiliate/rewards'

export default function RewardsTeaser({ className = '' }: { className?: string }) {
  const storefront = getAmazonStorefrontLabel()

  return (
    <aside className={`mx-auto mb-4 w-full max-w-sm rounded-xl border border-[#d7c9a6] bg-[#fff9e8] px-4 py-3 text-left ${className}`}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#294cc4]">Rewards</p>
      <p className="mt-1 text-sm leading-6 text-[#192947]">
        Visit <Link href="/rewards/" className="font-semibold text-[#294cc4] underline">Rewards and codes</Link> for the coin shop, one-use friend Extra Attempt gift terms and everyday {storefront} picks.
      </p>
    </aside>
  )
}
