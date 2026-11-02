'use client'

import { useEffect, useState } from 'react'
import { formatUtcCountdown, getMillisecondsUntilNextUtcDay } from './resultShare'

export default function UtcCountdown() {
  const [countdown, setCountdown] = useState(() => formatUtcCountdown(getMillisecondsUntilNextUtcDay()))

  useEffect(() => {
    const update = () => setCountdown(formatUtcCountdown(getMillisecondsUntilNextUtcDay()))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="twt-panel w-full max-w-2xl mx-auto p-5 text-center" aria-label="Next daily puzzle">
      <p className="twt-kicker">Next puzzle</p>
      <p className="mt-1 text-sm text-[#59647a]">New questions unlock at 00:00 UTC</p>
      <p className="mt-2 font-mono text-3xl font-black tabular-nums text-[#192947]">{countdown}</p>
    </section>
  )
}
