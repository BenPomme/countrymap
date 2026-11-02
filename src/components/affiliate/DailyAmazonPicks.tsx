'use client'

import { useEffect, useState } from 'react'
import AffiliateShelf from '@/components/affiliate/AffiliateShelf'
import { getMillisecondsUntilNextUtcDay } from '@/lib/affiliate/dailyUnlocks'
import { getUtcDay } from '@/lib/truthle/dailyLifecycle'

interface Props {
  placement: string
  heading?: string
  intro?: string
  limit?: number
  variant?: 'full' | 'compact'
  className?: string
  /** Explicit result context. Omit on pages that should follow the current UTC day. */
  date?: string
}

/**
 * Keeps the daily Amazon theme stable through hydration and refreshes it after
 * UTC midnight or when a backgrounded page becomes visible again.
 */
export default function DailyAmazonPicks({
  placement,
  heading,
  intro,
  limit = 4,
  variant = 'full',
  className,
  date,
}: Props) {
  const [mountedDay, setMountedDay] = useState<string | null>(null)

  useEffect(() => {
    if (date) return

    let timer: number | null = null

    const scheduleRefresh = () => {
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        setMountedDay(getUtcDay())
        scheduleRefresh()
      }, getMillisecondsUntilNextUtcDay())
    }

    const refresh = () => {
      setMountedDay(getUtcDay())
      scheduleRefresh()
    }

    refresh()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (timer !== null) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [date])

  const activeDay = date ?? mountedDay
  if (!activeDay) return null

  return (
    <AffiliateShelf
      placement={placement}
      heading={heading}
      intro={intro}
      limit={limit}
      variant={variant}
      className={className}
      date={activeDay}
    />
  )
}
