'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Country } from '@/types/country'
import { generateTrueFalseClaims, loadTF, recordTF, type TFState } from '@/lib/truthle/trueFalse'
import { getTodayDateString, getTruthleDay } from '@/lib/truthle/generator'
import { getCloudRetryStatus, consumeCloudRetry, createRetryCheckout, mintSharePromo, getStoredSharePromo, type SharePromo } from '@/lib/truthle/storage'
import CheckoutBanner from '@/components/truthle/CheckoutBanner'
import SharePromoCard from '@/components/truthle/SharePromoCard'
import { getVariableById } from '@/lib/seo/catalog'
import { AdUnit } from '@/components/ads'
import { AD_SLOTS } from '@/lib/constants/ads'
import DailyUnlockCard from '@/components/affiliate/DailyUnlockCard'

type Phase = 'intro' | 'playing' | 'done'

export default function TrueFalseGame(props: { countries: Country[] }) {
  return (
    <>
      <CheckoutBanner />
      <TrueFalseGameInner {...props} />
    </>
  )
}

function TrueFalseGameInner({ countries }: { countries: Country[] }) {
  const today = getTodayDateString()
  const day = getTruthleDay()
  const claims = useMemo(() => generateTrueFalseClaims(countries, today), [countries, today])

  const [phase, setPhase] = useState<Phase>('intro')
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<boolean | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [stats, setStats] = useState<TFState | null>(null)
  const [isExtra, setIsExtra] = useState(false)
  const [credits, setCredits] = useState(0)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const s = loadTF()
    setStats(s)
    if (s.lastDate === today && s.lastResults) {
      setResults(s.lastResults)
      setPhase('done')
    }
  }, [today])

  const playedToday = stats?.lastDate === today

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('checkout')
    if (c === 'success') setMsg('Extra Attempt unlocked — it may take a few seconds to appear.')
    else if (c === 'cancel') setMsg('Checkout cancelled.')
    if (c === 'success') {
      const sync = () => getCloudRetryStatus().then((r) => setCredits(r.canConsume ? Math.max(1, r.paidCredits || 0) : r.paidCredits || 0)).catch(() => {})
      const ts = [1500, 4000, 8000].map((d) => setTimeout(sync, d))
      return () => ts.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'done') return
    getCloudRetryStatus().then((r) => setCredits(r.canConsume ? Math.max(1, r.paidCredits || 0) : r.paidCredits || 0)).catch(() => {})
  }, [phase])

  const start = () => { setIdx(0); setPicked(null); setResults([]); setPhase('playing') }

  const answer = (v: boolean) => {
    if (picked !== null) return
    setPicked(v)
    setResults((r) => [...r, v === claims[idx].answer])
  }

  const next = () => {
    if (idx + 1 < claims.length) { setIdx(idx + 1); setPicked(null); return }
    const s = recordTF(today, results, isExtra || playedToday)
    setStats(s)
    setPhase('done')
  }

  const useExtra = async () => {
    setBusy(true); setMsg(null)
    const r = await consumeCloudRetry()
    setBusy(false)
    if (!r.success) { setMsg('No extra attempts available.'); return }
    setIsExtra(true); start()
  }
  const buyExtra = async () => {
    setBusy(true); setMsg(null)
    const { url, error } = await createRetryCheckout(1, 'true-false')
    if (url) { window.location.href = url; return }
    setBusy(false); setMsg(error || 'Checkout unavailable right now.')
  }

  const score = results.filter(Boolean).length
  const grid = results.map((r) => (r ? '✅' : '❌')).join('')
  const shareText = `True or False: World #${day}\n${grid} ${score}/5\nhttps://theworldtruth.com/true-false/`
  const [copied, setCopied] = useState(false)
  const [promo, setPromo] = useState<SharePromo | null>(null)
  const [promoError, setPromoError] = useState(false)
  useEffect(() => { setPromo(getStoredSharePromo()) }, [])
  const afterShare = useCallback(() => { setPromoError(false); mintSharePromo().then((p) => { if (p) setPromo(p); else setPromoError(true) }) }, [])
  const share = useCallback(async () => {
    try {
      if (navigator.share) { await navigator.share({ text: shareText }); afterShare(); return }
    } catch (e) { if ((e as Error)?.name === 'AbortError') return /* else fall through to clipboard */ }
    try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2000); afterShare() } catch {}
  }, [shareText, afterShare])

  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto px-4 text-center">
        <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold">Truthle · Day {day}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">True or False: World</h1>
        <p className="text-gray-600 mt-3">5 claims about countries, politics & world stats. Same for everyone today. How many can you call?</p>
        {stats && stats.played > 0 && (
          <p className="text-sm text-gray-500 mt-2">🔥 Streak {stats.streak} · {stats.played} played</p>
        )}
        <button onClick={start} className="mt-6 w-full py-4 rounded-2xl bg-sky-600 text-white text-lg font-bold shadow hover:bg-sky-700 active:scale-[0.99]">
          Play today's 5
        </button>
        <p className="text-xs text-gray-400 mt-3">Data: our country datasets (V-Dem, Freedom House, RSF, TI, World Bank, UN & more).</p>
      </div>
    )
  }

  if (phase === 'playing') {
    const c = claims[idx]
    const correct = picked !== null && picked === c.answer
    const mapSlug = getVariableById(c.mapSlugVar)?.slug
    return (
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-between text-sm text-gray-500 mb-3">
          <span>Claim {idx + 1} / {claims.length}</span>
          <span>{results.map((r) => (r ? '✅' : '❌')).join('')}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 min-h-[150px] flex flex-col justify-center">
          <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-2">{c.variableName}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{c.claim}</p>
        </div>
        {picked === null ? (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => answer(true)} className="py-5 rounded-2xl bg-emerald-600 text-white text-xl font-bold shadow hover:bg-emerald-700">True</button>
            <button onClick={() => answer(false)} className="py-5 rounded-2xl bg-rose-600 text-white text-xl font-bold shadow hover:bg-rose-700">False</button>
          </div>
        ) : (
          <div className={`mt-5 rounded-2xl p-5 ${correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <p className="font-bold text-lg">{correct ? '✅ Correct' : '❌ Wrong'} — it's {c.answer ? 'TRUE' : 'FALSE'}</p>
            <p className="text-gray-700 mt-1">{c.fact}</p>
            <p className="text-xs text-gray-500 mt-2">
              {c.source && (c.sourceUrl ? <>Source: <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{c.source}</a></> : <>Source: {c.source}</>)}
              {mapSlug && <> · <Link href={`/map/${mapSlug}`} className="underline">See the map</Link></>}
            </p>
            <button onClick={next} className="mt-4 w-full py-3 rounded-xl bg-gray-900 text-white font-semibold">
              {idx + 1 < claims.length ? 'Next claim →' : 'See results'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // done
  return (
    <div className="max-w-lg mx-auto px-4 text-center">
      <p className="text-xs uppercase tracking-widest text-sky-600 font-semibold">True or False: World #{day}</p>
      <p className="text-5xl font-extrabold mt-2">{score}/5</p>
      <p className="text-3xl mt-2 tracking-widest">{grid}</p>
      {stats && (
        <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
          <div className="bg-white rounded-xl shadow-sm p-2"><div className="text-xl font-bold">{stats.streak}</div>Streak</div>
          <div className="bg-white rounded-xl shadow-sm p-2"><div className="text-xl font-bold">{stats.maxStreak}</div>Best</div>
          <div className="bg-white rounded-xl shadow-sm p-2"><div className="text-xl font-bold">{stats.played}</div>Played</div>
        </div>
      )}
      <button onClick={share} className="mt-4 w-full py-3 rounded-2xl bg-sky-600 text-white font-semibold shadow">
        {copied ? 'Copied!' : 'Share result'}
      </button>
      {!promo && !promoError && <p className="mt-1 text-xs text-gray-500">Share to get a free Extra Attempt code for a friend</p>}
      {promoError && !promo && <p className="mt-1 text-xs text-rose-600">Couldn't create your friend code — tap Share again to retry.</p>}
      {promo && <SharePromoCard promo={promo} />}
      {isExtra && <p className="text-xs text-gray-500 mt-2">Extra attempt — your streak counts your first run of the day.</p>}
      <div className="mt-5">
        <DailyUnlockCard game="true-false" date={today} perfect={score === claims.length && claims.length > 0} cta={(
          <>
        {credits > 0 ? (
          <button disabled={busy} onClick={useExtra} className="mt-2 w-full whitespace-nowrap py-3 rounded-xl bg-amber-500 text-white font-bold disabled:opacity-60">
            Use an Extra Attempt ({credits} left)
          </button>
        ) : (
          <button disabled={busy} onClick={buyExtra} className="mt-2 w-full whitespace-nowrap py-3 rounded-xl bg-amber-500 text-white font-bold disabled:opacity-60">
            Extra Attempt — €0.99
          </button>
        )}
        <p className="text-xs text-gray-500 mt-1">Same Extra Attempt as Truthle; works in either game.</p>
        {msg && <p className="text-xs text-rose-600 mt-1">{msg}</p>}
          </>
        )} />
      </div>

      <div className="my-6">
        <AdUnit slotId={AD_SLOTS.truthleResults} format="rectangle" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/truthle" className="py-3 rounded-xl bg-emerald-600 text-white font-semibold">Play Truthle →</Link>
        <Link href="/map/press-freedom" className="py-3 rounded-xl bg-white border border-gray-300 font-semibold">Explore maps</Link>
      </div>
      <Link href="/true-false/claims/" className="block mt-3 text-sm text-sky-700 font-semibold hover:underline">Browse 270+ country claims, answered →</Link>
      <p className="text-xs text-gray-400 mt-4">New claims every day at 00:00 UTC.</p>
    </div>
  )
}
